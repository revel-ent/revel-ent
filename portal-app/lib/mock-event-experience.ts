import type { Role } from '@/lib/auth';
import {
  buildBaseCanonicalTimeline,
  buildLiveSnapshotFromCanonicalTimeline,
  mapPersistedTimelineRows,
  type CanonicalTimelineItem,
  type PersistedTimelineRow as CanonicalPersistedTimelineRow,
  type TimelineStatus as CanonicalTimelineStatus
} from '@/lib/canonical-timeline';

export type TimelineStatus = CanonicalTimelineStatus;

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

export type PersistedTimelineRow = CanonicalPersistedTimelineRow;

function mapCanonicalStep(step: CanonicalTimelineItem): TimelineStep {
  return {
    id: step.id,
    eventId: step.eventId,
    phase: step.phase,
    title: step.title,
    startsAtIso: step.scheduledStartIso,
    endsAtIso: step.scheduledEndIso,
    status: step.status,
    ownerLabel: step.ownerLabel,
    audiences: step.audiences,
    instructions: step.instructions
  };
}

export function getEventTimelineForRole(eventId: string, role: Role): TimelineStep[] {
  return buildBaseCanonicalTimeline(eventId)
    .filter((step) => step.audiences.includes(role))
    .map(mapCanonicalStep);
}

export function getEventTimelineFromPersistedRows(params: {
  eventId: string;
  role: Role;
  rows: PersistedTimelineRow[];
}): TimelineStep[] {
  const { eventId, role, rows } = params;
  return mapPersistedTimelineRows(eventId, rows)
    .filter((step) => step.audiences.includes(role))
    .map(mapCanonicalStep);
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
  const { alerts, contacts } = buildSharedLiveMetadata();
  const snapshot = buildLiveSnapshotFromCanonicalTimeline({
    eventId,
    role,
    timeline: timeline.map((step) => ({
      id: step.id,
      eventId: step.eventId,
      phase: step.phase,
      title: step.title,
      scheduledStartIso: step.startsAtIso,
      scheduledEndIso: step.endsAtIso,
      status: step.status,
      ownerLabel: step.ownerLabel,
      ownerRole: 'planner',
      audiences: step.audiences,
      instructions: step.instructions,
      notes: null,
      escalationHint: null,
      visibility: 'public',
      canDelegateUpdate: true
    }))
  });

  const canManage = ['admin', 'planner', 'delegate_coordinator', 'venue_coordinator', 'production'].includes(role);

  return {
    ...snapshot,
    alerts,
    contacts,
    canManage
  };
}

export function getLiveSnapshot(eventId: string, role: Role) {
  const timeline = getEventTimelineForRole(eventId, role);
  return buildLiveSnapshotFromTimeline({ eventId, role, timeline });
}
