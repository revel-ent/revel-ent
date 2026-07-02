import { generateTimelineFromVenue, type TimelineGenerationResult } from '@/lib/onboarding-timeline';
import {
  recalculateTimeline,
  type CanonicalTimelineItem,
  type TimelineRecalculationResult
} from '@/lib/canonical-timeline';
import { getSupabaseAdminClient } from '@/lib/supabase-server';
import { DEFAULT_TRADITION_KEY, isWeddingTraditionKey } from '@/lib/wedding-traditions';

const ALL_AUDIENCES: CanonicalTimelineItem['audiences'] = [
  'admin',
  'planner',
  'production',
  'dj_mc',
  'vendor',
  'delegate_coordinator',
  'venue_coordinator',
  'couple',
  'guest'
];

export interface EventTimelineGenerationSuccess {
  ok: true;
  eventId: string;
  generation: TimelineGenerationResult;
  recalculated: TimelineRecalculationResult;
  existingTimelineCount: number;
  resolvedTradition: string;
}

export interface EventTimelineGenerationFailure {
  ok: false;
  error: string;
  status: number;
}

export type EventTimelineGenerationOutcome = EventTimelineGenerationSuccess | EventTimelineGenerationFailure;

function toCanonicalDrafts(items: TimelineGenerationResult['items'], eventId: string): CanonicalTimelineItem[] {
  return items.map((item, index) => ({
    id: `draft-${index}-${item.phaseCode}`,
    eventId,
    phase: item.phaseCode,
    title: item.title,
    scheduledStartIso: item.scheduledStartIso,
    scheduledEndIso: item.scheduledEndIso,
    status: 'pending',
    ownerLabel: 'Operations',
    ownerRole: 'planner',
    audiences: ALL_AUDIENCES,
    instructions: item.escalationHint ?? 'Follow run-of-show coordination guidance.',
    notes: null,
    escalationHint: item.escalationHint,
    visibility: 'client',
    canDelegateUpdate: true
  }));
}

/**
 * Resolves an already-onboarded event's venue/date/tradition, generates a timeline via the same
 * generateTimelineFromVenue() the onboarding flow uses, and recalculates it for conflicts.
 * Shared by /api/events/timeline/generate (preview) and /publish (which re-runs this identically
 * before writing, rather than trusting a client-held item list that could drift).
 */
export async function generateEventTimeline(params: {
  eventId: string;
  tradition?: string | null;
}): Promise<EventTimelineGenerationOutcome> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return { ok: false, error: 'supabase_unavailable', status: 503 };
  }

  const { data: eventRow, error: eventError } = await supabase
    .from('events')
    .select('event_id, venue_id, starts_on, atlas_entitlement_snapshot')
    .eq('event_id', params.eventId)
    .maybeSingle();

  if (eventError || !eventRow) {
    return { ok: false, error: 'event_not_found', status: 404 };
  }

  const venueUuid = eventRow.venue_id as string | null;

  if (!venueUuid) {
    return { ok: false, error: 'event_missing_venue', status: 422 };
  }

  const { data: venueRow, error: venueError } = await supabase
    .from('venues')
    .select('atlas_record_id')
    .eq('venue_id', venueUuid)
    .maybeSingle();

  if (venueError || !venueRow?.atlas_record_id) {
    return { ok: false, error: 'venue_not_found', status: 404 };
  }

  const snapshot = (eventRow.atlas_entitlement_snapshot as Record<string, unknown> | null) ?? {};
  const storedTradition = typeof snapshot.tradition_key === 'string' ? snapshot.tradition_key : null;

  const resolvedTradition =
    (params.tradition && isWeddingTraditionKey(params.tradition) ? params.tradition : null) ??
    (storedTradition && isWeddingTraditionKey(storedTradition) ? storedTradition : null) ??
    DEFAULT_TRADITION_KEY;

  const generation = await generateTimelineFromVenue({
    venueId: venueRow.atlas_record_id as string,
    weddingDate: eventRow.starts_on as string,
    tradition: resolvedTradition,
    fetchTemplates: async () => {
      const { data, error } = await supabase
        .from('timeline_templates')
        .select('phase_code,title,offset_minutes,default_duration_minutes,requires_venue_check')
        .eq('template_key', `${resolvedTradition}_weekend_v1`)
        .eq('active', true);

      if (error || !data) {
        return null;
      }

      return data;
    }
  });

  if (!generation) {
    return { ok: false, error: 'venue_generation_failed', status: 404 };
  }

  const drafts = toCanonicalDrafts(generation.items, params.eventId);
  const recalculated = recalculateTimeline(drafts);

  // Feed the recalculated (conflict-adjusted) times back into the generation items so the
  // response and any subsequent insert both reflect the adjusted schedule, not the raw one.
  const adjustedById = new Map(recalculated.items.map((item) => [item.id, item]));
  generation.items = generation.items.map((item, index) => {
    const adjusted = adjustedById.get(`draft-${index}-${item.phaseCode}`);
    if (!adjusted) return item;
    return {
      ...item,
      scheduledStartIso: adjusted.scheduledStartIso,
      scheduledEndIso: adjusted.scheduledEndIso
    };
  });

  const { count } = await supabase
    .from('timelines')
    .select('timeline_id', { count: 'exact', head: true })
    .eq('event_id', params.eventId);

  return {
    ok: true,
    eventId: params.eventId,
    generation,
    recalculated,
    existingTimelineCount: count ?? 0,
    resolvedTradition
  };
}
