import { NextResponse } from 'next/server';

import {
  buildBaseCanonicalTimeline,
  createTimelineResponse,
  mapPersistedTimelineRows,
  patchTimelineItem,
  recalculateTimeline,
  type TimelineStatus
} from '@/lib/canonical-timeline';
import { requireEventRoleContext } from '@/lib/event-context';
import { getSupabaseAdminClient } from '@/lib/supabase-server';

interface TimelinePatchBody {
  title?: unknown;
  scheduledStartIso?: unknown;
  scheduledEndIso?: unknown;
  status?: unknown;
  notes?: unknown;
  ownerLabel?: unknown;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function parseStatus(value: unknown): TimelineStatus | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim();
  if (normalized === 'pending' || normalized === 'ready' || normalized === 'in_progress' || normalized === 'completed' || normalized === 'delayed' || normalized === 'blocked') {
    return normalized;
  }

  return undefined;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ itemId: string }> }) {
  const { context, response } = await requireEventRoleContext({ allowedRoles: ['admin', 'planner'] });

  if (response || !context) {
    return response as NextResponse;
  }

  let body: TimelinePatchBody;
  try {
    body = (await request.json()) as TimelinePatchBody;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const { itemId } = await params;
  const patch = {
    title: typeof body.title === 'string' ? body.title.trim() : undefined,
    scheduledStartIso: typeof body.scheduledStartIso === 'string' ? body.scheduledStartIso.trim() : undefined,
    scheduledEndIso: typeof body.scheduledEndIso === 'string' ? body.scheduledEndIso.trim() : undefined,
    status: parseStatus(body.status),
    notes: typeof body.notes === 'string' ? body.notes.trim() : undefined,
    ownerLabel: typeof body.ownerLabel === 'string' ? body.ownerLabel.trim() : undefined
  };

  const supabase = getSupabaseAdminClient();
  if (supabase && isUuid(context.eventId) && isUuid(itemId)) {
    const { data, error } = await supabase
      .from('timelines')
      .update({
        title: patch.title,
        scheduled_start: patch.scheduledStartIso,
        scheduled_end: patch.scheduledEndIso,
        status: patch.status,
        notes: patch.notes,
        updated_at: new Date().toISOString()
      })
      .eq('event_id', context.eventId)
      .eq('timeline_id', itemId)
      .select('timeline_id,phase_code,title,scheduled_start,scheduled_end,status,escalation_hint,notes,atlas_prompt,can_delegate_update')
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: 'timeline_patch_failed', details: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'timeline_item_not_found' }, { status: 404 });
    }

    const recalculated = recalculateTimeline(mapPersistedTimelineRows(context.eventId, [data]));

    return NextResponse.json({
      mode: 'supabase',
      updated: createTimelineResponse({
        eventId: context.eventId,
        role: context.role,
        source: 'supabase',
        items: recalculated.items
      }),
      adjustments: recalculated.adjustments
    });
  }

  const base = buildBaseCanonicalTimeline(context.eventId);
  const patched = patchTimelineItem(base, itemId, patch);
  const recalculated = recalculateTimeline(patched);

  if (!recalculated.items.some((item) => item.id === itemId)) {
    return NextResponse.json({ error: 'timeline_item_not_found' }, { status: 404 });
  }

  return NextResponse.json({
    mode: 'simulation',
    updated: createTimelineResponse({
      eventId: context.eventId,
      role: context.role,
      source: 'simulation',
      items: recalculated.items
    }),
    adjustments: recalculated.adjustments
  });
}