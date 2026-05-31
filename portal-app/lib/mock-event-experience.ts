import type { Role } from '@/lib/auth';

export type TimelineStatus = 'pending' | 'in_progress' | 'completed' | 'delayed';

export interface TimelineStep {
  id: string;
  eventId: string;
  phase: string;
  title: string;
  startsAtIso: string;
  endsAtIso: string;
  status: TimelineStatus;
  ownerLabel: string;
  audiences: Role[];
  instructions: string;
}

export interface LiveAlert {
  id: string;
  severity: 'info' | 'attention';
  title: string;
  detail: string;
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
}

function addMinutes(base: Date, minutes: number): Date {
  return new Date(base.getTime() + minutes * 60_000);
}

function toIso(base: Date): string {
  return base.toISOString();
}

function buildBaseTimeline(eventId: string): TimelineStep[] {
  const now = new Date();
  const anchor = addMinutes(now, -45);

  const steps: TimelineStep[] = [
    {
      id: 'step-loadin',
      eventId,
      phase: 'load_in',
      title: 'Vendor Load-In and Sound Check',
      startsAtIso: toIso(anchor),
      endsAtIso: toIso(addMinutes(anchor, 30)),
      status: 'completed',
      ownerLabel: 'Production Team',
      audiences: ['admin', 'planner', 'vendor', 'delegate_coordinator', 'venue_coordinator', 'couple'],
      instructions: 'Confirm power lanes, cable safety, and stage access before guests arrive.'
    },
    {
      id: 'step-baraat',
      eventId,
      phase: 'baraat',
      title: 'Baraat Assembly and Route Start',
      startsAtIso: toIso(addMinutes(anchor, 35)),
      endsAtIso: toIso(addMinutes(anchor, 65)),
      status: 'in_progress',
      ownerLabel: 'Family Coordinator',
      audiences: ['admin', 'planner', 'vendor', 'delegate_coordinator', 'venue_coordinator', 'couple', 'guest'],
      instructions: 'Assemble immediate family first; start processional route once DJ confirms sound lane.'
    },
    {
      id: 'step-ceremony',
      eventId,
      phase: 'ceremony',
      title: 'Ceremony Seating and Start',
      startsAtIso: toIso(addMinutes(anchor, 75)),
      endsAtIso: toIso(addMinutes(anchor, 135)),
      status: 'pending',
      ownerLabel: 'Planner Desk',
      audiences: ['admin', 'planner', 'vendor', 'delegate_coordinator', 'venue_coordinator', 'couple', 'guest'],
      instructions: 'Seat elderly guests first; keep aisle clear for couple entrance.'
    },
    {
      id: 'step-cocktail',
      eventId,
      phase: 'cocktail',
      title: 'Cocktail Transition',
      startsAtIso: toIso(addMinutes(anchor, 145)),
      endsAtIso: toIso(addMinutes(anchor, 190)),
      status: 'pending',
      ownerLabel: 'Venue + Hospitality',
      audiences: ['admin', 'planner', 'vendor', 'delegate_coordinator', 'venue_coordinator', 'couple', 'guest'],
      instructions: 'Open beverage stations before transition announcement.'
    },
    {
      id: 'step-reception',
      eventId,
      phase: 'reception',
      title: 'Reception Grand Entry',
      startsAtIso: toIso(addMinutes(anchor, 200)),
      endsAtIso: toIso(addMinutes(anchor, 260)),
      status: 'pending',
      ownerLabel: 'MC + Planner',
      audiences: ['admin', 'planner', 'vendor', 'delegate_coordinator', 'venue_coordinator', 'couple', 'guest'],
      instructions: 'Lock final cue order 10 minutes before entry.'
    }
  ];

  return steps;
}

export function getEventTimelineForRole(eventId: string, role: Role): TimelineStep[] {
  const allSteps = buildBaseTimeline(eventId);

  if (role === 'admin' || role === 'planner') {
    return allSteps;
  }

  return allSteps.filter((step) => step.audiences.includes(role));
}

function mapPersistedStatus(status: string): TimelineStatus {
  if (status === 'in_progress' || status === 'completed' || status === 'delayed') {
    return status;
  }

  return 'pending';
}

function extractPromptNote(prompt: unknown): string | null {
  if (!prompt || typeof prompt !== 'object') {
    return null;
  }

  const candidate = (prompt as { note?: unknown }).note;
  return typeof candidate === 'string' && candidate.trim().length > 0 ? candidate.trim() : null;
}

export function getEventTimelineFromPersistedRows(params: {
  eventId: string;
  role: Role;
  rows: PersistedTimelineRow[];
}): TimelineStep[] {
  const { eventId, role, rows } = params;
  const baseAudiences: Role[] = ['admin', 'planner', 'vendor', 'delegate_coordinator', 'venue_coordinator', 'couple', 'guest'];

  const mapped = rows
    .map((row) => {
      const startDate = new Date(row.scheduled_start);
      const endDate = row.scheduled_end ? new Date(row.scheduled_end) : new Date(startDate.getTime() + 30 * 60_000);

      return {
        id: row.timeline_id,
        eventId,
        phase: row.phase_code,
        title: row.title,
        startsAtIso: startDate.toISOString(),
        endsAtIso: endDate.toISOString(),
        status: mapPersistedStatus(row.status),
        ownerLabel: 'Operations',
        audiences: baseAudiences,
        instructions:
          row.notes || row.escalation_hint || extractPromptNote(row.atlas_prompt) || 'Follow run-of-show coordination guidance.'
      } satisfies TimelineStep;
    })
    .sort((a, b) => (a.startsAtIso > b.startsAtIso ? 1 : -1));

  if (role === 'admin' || role === 'planner') {
    return mapped;
  }

  return mapped.filter((step) => step.audiences.includes(role));
}

function buildSharedLiveMetadata() {
  const alerts: LiveAlert[] = [
    {
      id: 'alert-baraat-lane',
      severity: 'attention',
      title: 'Baraat Route Check',
      detail: 'East-side staging lane narrows near valet. Keep dhol and DJ setup compact at turn-in point.'
    },
    {
      id: 'alert-guest-cue',
      severity: 'info',
      title: 'Guest Arrival Reminder',
      detail: 'Guest concierge announcement should go out 20 minutes before ceremony seating opens.'
    }
  ];

  const contacts = {
    planner: 'MC Maulin · +1 706-555-0144',
    venue: 'Venue Ops Desk · +1 404-555-0190',
    production: 'REVEL Production Lead · +1 706-555-0177'
  };

  return { alerts, contacts };
}

export function buildLiveSnapshotFromTimeline(params: {
  eventId: string;
  role: Role;
  timeline: TimelineStep[];
}) {
  const { eventId, role, timeline } = params;
  const nowMs = Date.now();

  const current =
    timeline.find((step) => {
      const start = new Date(step.startsAtIso).getTime();
      const end = new Date(step.endsAtIso).getTime();
      return nowMs >= start && nowMs <= end;
    }) ?? null;

  const next =
    timeline
      .filter((step) => new Date(step.startsAtIso).getTime() > nowMs)
      .sort((a, b) => (a.startsAtIso > b.startsAtIso ? 1 : -1))[0] ?? null;
  const { alerts, contacts } = buildSharedLiveMetadata();

  const canManage = ['admin', 'planner', 'delegate_coordinator', 'venue_coordinator'].includes(role);

  return {
    eventId,
    generatedAt: new Date().toISOString(),
    current,
    next,
    alerts,
    contacts,
    canManage
  };
}

export function getLiveSnapshot(eventId: string, role: Role) {
  const timeline = getEventTimelineForRole(eventId, role);
  return buildLiveSnapshotFromTimeline({ eventId, role, timeline });
}
