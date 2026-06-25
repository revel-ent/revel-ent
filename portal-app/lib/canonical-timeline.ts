import { type Role } from '@/lib/auth';
import { createRoleScopedAdapter, getDomainScope } from '@/lib/role-scoped-adapters';

export type TimelineStatus = 'pending' | 'ready' | 'in_progress' | 'completed' | 'delayed' | 'blocked';

export type TimelineVisibility = 'client' | 'operations' | 'venue' | 'public';

export interface CanonicalTimelineItem {
  id: string;
  eventId: string;
  phase: string;
  title: string;
  scheduledStartIso: string;
  scheduledEndIso: string;
  status: TimelineStatus;
  ownerLabel: string;
  ownerRole: Role | 'venue_ops';
  audiences: Role[];
  instructions: string;
  notes: string | null;
  escalationHint: string | null;
  visibility: TimelineVisibility;
  canDelegateUpdate: boolean;
}

export interface TimelineProjectionItem {
  id: string;
  eventId: string;
  phase: string;
  title: string;
  startsAtIso: string;
  endsAtIso: string;
  status: TimelineStatus;
  ownerLabel: string;
  instructions: string;
  notes: string | null;
  visibility: TimelineVisibility;
  readOnly: boolean;
}

export interface PersistedTimelineRow {
  timeline_id: string;
  phase_code: string;
  title: string;
  scheduled_start: string;
  scheduled_end: string | null;
  status: string;
  escalation_hint: string | null;
  notes: string | null;
  atlas_prompt: unknown;
  can_delegate_update?: boolean | null;
}

export interface TimelineConflict {
  id: string;
  type: 'overlap' | 'tight_turnover' | 'missing_duration';
  severity: 'warning' | 'critical';
  itemIds: string[];
  message: string;
}

export interface TimelineRecalculationResult {
  items: CanonicalTimelineItem[];
  conflicts: TimelineConflict[];
  adjustments: Array<{
    itemId: string;
    previousStartIso: string;
    previousEndIso: string;
    nextStartIso: string;
    nextEndIso: string;
  }>;
}

const DEFAULT_DURATION_MINUTES = 30;
const MIN_TURNOVER_MINUTES = 15;

function addMinutes(base: Date, minutes: number): Date {
  return new Date(base.getTime() + minutes * 60_000);
}

function toIso(date: Date): string {
  return date.toISOString();
}

function phaseGapMinutes(phase: string): number {
  if (phase === 'baraat' || phase === 'ceremony') {
    return 10;
  }

  if (phase === 'load_in') {
    return 5;
  }

  return MIN_TURNOVER_MINUTES;
}

function normalizeStatus(status: string): TimelineStatus {
  if (status === 'ready' || status === 'in_progress' || status === 'completed' || status === 'delayed' || status === 'blocked') {
    return status;
  }

  return 'pending';
}

function extractPromptNote(prompt: unknown): string | null {
  if (!prompt || typeof prompt !== 'object') {
    return null;
  }

  const note = (prompt as { note?: unknown }).note;
  return typeof note === 'string' && note.trim().length > 0 ? note.trim() : null;
}

function mapInstructions(row: PersistedTimelineRow): string {
  return row.notes || row.escalation_hint || extractPromptNote(row.atlas_prompt) || 'Follow run-of-show coordination guidance.';
}

export function buildBaseCanonicalTimeline(eventId: string): CanonicalTimelineItem[] {
  const now = new Date();
  const anchor = addMinutes(now, -45);

  return [
    {
      id: 'step-loadin',
      eventId,
      phase: 'load_in',
      title: 'Vendor Load-In and Sound Check',
      scheduledStartIso: toIso(anchor),
      scheduledEndIso: toIso(addMinutes(anchor, 30)),
      status: 'completed',
      ownerLabel: 'Production Team',
      ownerRole: 'production',
      audiences: ['admin', 'planner', 'production', 'dj_mc', 'vendor', 'delegate_coordinator', 'venue_coordinator', 'couple'],
      instructions: 'Confirm power lanes, cable safety, and stage access before guests arrive.',
      notes: null,
      escalationHint: 'Escalate immediately if power lanes or loading dock access are blocked.',
      visibility: 'operations',
      canDelegateUpdate: true
    },
    {
      id: 'step-baraat',
      eventId,
      phase: 'baraat',
      title: 'Baraat Assembly and Route Start',
      scheduledStartIso: toIso(addMinutes(anchor, 35)),
      scheduledEndIso: toIso(addMinutes(anchor, 65)),
      status: 'in_progress',
      ownerLabel: 'Family Coordinator',
      ownerRole: 'planner',
      audiences: ['admin', 'planner', 'production', 'dj_mc', 'vendor', 'delegate_coordinator', 'venue_coordinator', 'couple', 'guest'],
      instructions: 'Assemble immediate family first; start processional route once DJ confirms sound lane.',
      notes: null,
      escalationHint: 'Route compression can delay ceremony start.',
      visibility: 'public',
      canDelegateUpdate: true
    },
    {
      id: 'step-ceremony',
      eventId,
      phase: 'ceremony',
      title: 'Ceremony Seating and Start',
      scheduledStartIso: toIso(addMinutes(anchor, 75)),
      scheduledEndIso: toIso(addMinutes(anchor, 135)),
      status: 'pending',
      ownerLabel: 'Planner Desk',
      ownerRole: 'planner',
      audiences: ['admin', 'planner', 'production', 'dj_mc', 'vendor', 'delegate_coordinator', 'venue_coordinator', 'couple', 'guest'],
      instructions: 'Seat elderly guests first; keep aisle clear for couple entrance.',
      notes: null,
      escalationHint: null,
      visibility: 'client',
      canDelegateUpdate: true
    },
    {
      id: 'step-cocktail',
      eventId,
      phase: 'cocktail',
      title: 'Cocktail Transition',
      scheduledStartIso: toIso(addMinutes(anchor, 145)),
      scheduledEndIso: toIso(addMinutes(anchor, 190)),
      status: 'pending',
      ownerLabel: 'Venue + Hospitality',
      ownerRole: 'venue_ops',
      audiences: ['admin', 'planner', 'production', 'dj_mc', 'vendor', 'delegate_coordinator', 'venue_coordinator', 'couple', 'guest'],
      instructions: 'Open beverage stations before transition announcement.',
      notes: null,
      escalationHint: null,
      visibility: 'venue',
      canDelegateUpdate: true
    },
    {
      id: 'step-reception',
      eventId,
      phase: 'reception',
      title: 'Reception Grand Entry',
      scheduledStartIso: toIso(addMinutes(anchor, 200)),
      scheduledEndIso: toIso(addMinutes(anchor, 260)),
      status: 'pending',
      ownerLabel: 'MC + Planner',
      ownerRole: 'dj_mc',
      audiences: ['admin', 'planner', 'production', 'dj_mc', 'vendor', 'delegate_coordinator', 'venue_coordinator', 'couple', 'guest'],
      instructions: 'Lock final cue order 10 minutes before entry.',
      notes: null,
      escalationHint: 'Hold entry until audio, lighting, and family staging are confirmed.',
      visibility: 'public',
      canDelegateUpdate: true
    }
  ];
}

export function mapPersistedTimelineRows(eventId: string, rows: PersistedTimelineRow[]): CanonicalTimelineItem[] {
  return rows
    .map((row) => {
      const startDate = new Date(row.scheduled_start);
      const endDate = row.scheduled_end ? new Date(row.scheduled_end) : addMinutes(startDate, DEFAULT_DURATION_MINUTES);

      return {
        id: row.timeline_id,
        eventId,
        phase: row.phase_code,
        title: row.title,
        scheduledStartIso: startDate.toISOString(),
        scheduledEndIso: endDate.toISOString(),
        status: normalizeStatus(row.status),
        ownerLabel: 'Operations',
        ownerRole: 'planner',
        audiences: ['admin', 'planner', 'production', 'dj_mc', 'vendor', 'delegate_coordinator', 'venue_coordinator', 'couple', 'guest'],
        instructions: mapInstructions(row),
        notes: row.notes,
        escalationHint: row.escalation_hint,
        visibility: row.phase_code === 'load_in' ? 'operations' : row.phase_code === 'cocktail' ? 'venue' : 'client',
        canDelegateUpdate: row.can_delegate_update !== false
      } satisfies CanonicalTimelineItem;
    })
    .sort((a, b) => (a.scheduledStartIso > b.scheduledStartIso ? 1 : -1));
}

function toProjectionItem(item: CanonicalTimelineItem, readOnly: boolean): TimelineProjectionItem {
  return {
    id: item.id,
    eventId: item.eventId,
    phase: item.phase,
    title: item.title,
    startsAtIso: item.scheduledStartIso,
    endsAtIso: item.scheduledEndIso,
    status: item.status,
    ownerLabel: item.ownerLabel,
    instructions: item.instructions,
    notes: item.notes,
    visibility: item.visibility,
    readOnly
  };
}

const projectTimeline = createRoleScopedAdapter<CanonicalTimelineItem[], TimelineProjectionItem[]>({
  domain: 'timeline',
  projectors: {
    full: (items) => items.map((item) => toProjectionItem(item, false)),
    operations: (items) =>
      items
        .filter((item) => item.visibility !== 'client' || item.audiences.includes('production') || item.audiences.includes('dj_mc'))
        .map((item) => toProjectionItem(item, true)),
    owner_filtered: (items) =>
      items
        .filter((item) => item.visibility !== 'operations')
        .map((item) => toProjectionItem(item, true)),
    assigned: (items) =>
      items
        .filter((item) => item.visibility !== 'client')
        .map((item) => toProjectionItem(item, true)),
    venue: (items) =>
      items
        .filter((item) => item.visibility === 'venue' || item.visibility === 'operations' || item.phase === 'cocktail')
        .map((item) => toProjectionItem(item, true)),
    summary: (items) =>
      items
        .filter((item) => item.visibility === 'public' || item.visibility === 'client')
        .map((item) => toProjectionItem(item, true))
  }
});

export function getTimelineProjectionForRole(items: CanonicalTimelineItem[], role: Role): TimelineProjectionItem[] {
  return projectTimeline(role, items) ?? [];
}

export function detectTimelineConflicts(items: CanonicalTimelineItem[]): TimelineConflict[] {
  const sorted = [...items].sort((a, b) => (a.scheduledStartIso > b.scheduledStartIso ? 1 : -1));
  const conflicts: TimelineConflict[] = [];

  for (let index = 0; index < sorted.length; index += 1) {
    const current = sorted[index];
    const start = new Date(current.scheduledStartIso).getTime();
    const end = new Date(current.scheduledEndIso).getTime();

    if (!Number.isFinite(end) || end <= start) {
      conflicts.push({
        id: `missing-duration:${current.id}`,
        type: 'missing_duration',
        severity: 'critical',
        itemIds: [current.id],
        message: `${current.title} has an invalid duration.`
      });
    }

    const next = sorted[index + 1];
    if (!next) {
      continue;
    }

    const nextStart = new Date(next.scheduledStartIso).getTime();
    const gapMinutes = Math.round((nextStart - end) / 60_000);

    if (nextStart < end) {
      conflicts.push({
        id: `overlap:${current.id}:${next.id}`,
        type: 'overlap',
        severity: 'critical',
        itemIds: [current.id, next.id],
        message: `${current.title} overlaps ${next.title}.`
      });
      continue;
    }

    if (gapMinutes < MIN_TURNOVER_MINUTES) {
      conflicts.push({
        id: `tight-turnover:${current.id}:${next.id}`,
        type: 'tight_turnover',
        severity: 'warning',
        itemIds: [current.id, next.id],
        message: `${current.title} leaves only ${gapMinutes} minutes before ${next.title}.`
      });
    }
  }

  return conflicts;
}

export function recalculateTimeline(items: CanonicalTimelineItem[]): TimelineRecalculationResult {
  const sorted = [...items].sort((a, b) => (a.scheduledStartIso > b.scheduledStartIso ? 1 : -1));
  const adjustments: TimelineRecalculationResult['adjustments'] = [];

  const normalized = sorted.map((item, index) => {
    const start = new Date(item.scheduledStartIso);
    const parsedEnd = new Date(item.scheduledEndIso);
    const durationMinutes =
      Number.isFinite(parsedEnd.getTime()) && parsedEnd.getTime() > start.getTime()
        ? Math.max(1, Math.round((parsedEnd.getTime() - start.getTime()) / 60_000))
        : DEFAULT_DURATION_MINUTES;

    if (index === 0) {
      return {
        ...item,
        scheduledEndIso: addMinutes(start, durationMinutes).toISOString()
      };
    }

    const previous = sorted[index - 1];
    const previousEnd = new Date(previous.scheduledEndIso);
    const minAllowedStart = addMinutes(previousEnd, phaseGapMinutes(item.phase));
    const nextStart = start.getTime() < minAllowedStart.getTime() ? minAllowedStart : start;
    const nextEnd = addMinutes(nextStart, durationMinutes);

    if (nextStart.getTime() !== start.getTime() || nextEnd.getTime() !== parsedEnd.getTime()) {
      adjustments.push({
        itemId: item.id,
        previousStartIso: item.scheduledStartIso,
        previousEndIso: item.scheduledEndIso,
        nextStartIso: nextStart.toISOString(),
        nextEndIso: nextEnd.toISOString()
      });
    }

    return {
      ...item,
      scheduledStartIso: nextStart.toISOString(),
      scheduledEndIso: nextEnd.toISOString()
    };
  });

  return {
    items: normalized,
    conflicts: detectTimelineConflicts(normalized),
    adjustments
  };
}

export function patchTimelineItem(
  items: CanonicalTimelineItem[],
  itemId: string,
  patch: Partial<Pick<CanonicalTimelineItem, 'title' | 'scheduledStartIso' | 'scheduledEndIso' | 'status' | 'notes' | 'ownerLabel'>>
): CanonicalTimelineItem[] {
  return items.map((item) => {
    if (item.id !== itemId) {
      return item;
    }

    return {
      ...item,
      title: patch.title ?? item.title,
      scheduledStartIso: patch.scheduledStartIso ?? item.scheduledStartIso,
      scheduledEndIso: patch.scheduledEndIso ?? item.scheduledEndIso,
      status: patch.status ?? item.status,
      notes: patch.notes ?? item.notes,
      ownerLabel: patch.ownerLabel ?? item.ownerLabel
    };
  });
}

export function createTimelineResponse(params: {
  eventId: string;
  role: Role;
  source: 'mock' | 'supabase' | 'simulation';
  items: CanonicalTimelineItem[];
}) {
  const { eventId, role, source, items } = params;

  return {
    eventId,
    role,
    domainScope: getDomainScope('timeline', role),
    source,
    timeline: getTimelineProjectionForRole(items, role),
    conflicts: detectTimelineConflicts(items)
  };
}

export function buildLiveSnapshotFromCanonicalTimeline(params: {
  eventId: string;
  role: Role;
  timeline: CanonicalTimelineItem[];
}) {
  const projected = getTimelineProjectionForRole(params.timeline, params.role);
  const nowMs = Date.now();

  const current =
    projected.find((step) => {
      const start = new Date(step.startsAtIso).getTime();
      const end = new Date(step.endsAtIso).getTime();
      return nowMs >= start && nowMs <= end;
    }) ?? null;

  const next =
    projected
      .filter((step) => new Date(step.startsAtIso).getTime() > nowMs)
      .sort((a, b) => (a.startsAtIso > b.startsAtIso ? 1 : -1))[0] ?? null;

  return {
    eventId: params.eventId,
    generatedAt: new Date().toISOString(),
    current,
    next,
    conflicts: detectTimelineConflicts(params.timeline)
  };
}