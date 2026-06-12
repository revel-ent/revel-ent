import { type Role } from '@/lib/auth';
import { buildBaseCanonicalTimeline, type CanonicalTimelineItem } from '@/lib/canonical-timeline';
import { type MemberRecord, findMembershipByRoleAndEvent, findMembershipByUserIdAndEvent, listMembersByEvent } from '@/lib/mock-data';
import { canAccessDomain, createRoleScopedAdapter, getDomainScope, type DomainScope } from '@/lib/role-scoped-adapters';

export type TaskStatus = 'pending' | 'acknowledged' | 'in_progress' | 'completed' | 'blocked';
export type TaskPriority = 'critical' | 'high' | 'normal';
export type VendorProfile = 'general' | 'decorator' | 'dj_mc' | 'production' | 'venue';

export interface CanonicalVendorAssignment {
  id: string;
  eventId: string;
  taskId: string;
  assigneeUserId: string;
  assigneeRole: Role;
  assigneeLabel: string;
  assigneeEmail: string;
  vendorProfile: VendorProfile;
}

export interface CanonicalTask {
  id: string;
  eventId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  ownerRole: Role;
  ownerLabel: string;
  assignmentId: string;
  linkedTimelineItemIds: string[];
  dueAtIso: string | null;
  notes: string | null;
  clientVisible: boolean;
}

export interface TimelineSlice {
  id: string;
  phase: string;
  title: string;
  startsAtIso: string;
  endsAtIso: string;
  ownerLabel: string;
}

export interface TaskProjectionItem {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  ownerRole: Role;
  ownerLabel: string;
  assignee: {
    userId: string;
    label: string;
    role: Role;
    profile: VendorProfile;
  };
  linkedTimelineItemIds: string[];
  linkedTimeline: TimelineSlice[];
  dueAtIso: string | null;
  notes: string | null;
  readOnly: boolean;
  canUpdateStatus: boolean;
}

export interface VendorRosterEntry {
  userId: string;
  displayName: string;
  email: string;
  role: Role;
  vendorProfile: VendorProfile;
  assignmentCount: number;
  openTaskCount: number;
  linkedTimeline: TimelineSlice[];
  taskIds: string[];
  readOnly: boolean;
}

interface TaskTemplate {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  ownerRole: Role;
  assigneeRole: Role;
  vendorProfile: VendorProfile;
  linkedTimelineItemIds: string[];
  dueAtIso: string | null;
  notes: string | null;
  clientVisible: boolean;
}

interface TaskBundle {
  eventId: string;
  actorUserId: string;
  actorRole: Role;
  tasks: CanonicalTask[];
  assignments: CanonicalVendorAssignment[];
  timeline: CanonicalTimelineItem[];
}

function inferVendorProfile(member: MemberRecord): VendorProfile {
  if (member.role === 'dj_mc') {
    return 'dj_mc';
  }

  if (member.role === 'production') {
    return 'production';
  }

  if (member.role === 'venue_coordinator') {
    return 'venue';
  }

  if (member.role === 'decorator') {
    return 'decorator';
  }

  const label = member.displayName.toLowerCase();
  if (label.includes('dreamcatchers') || label.includes('decor')) {
    return 'decorator';
  }

  return 'general';
}

function getTaskTemplates(eventId: string): TaskTemplate[] {
  const now = new Date('2026-11-27T16:00:00.000Z');
  const inDays = (days: number) => new Date(now.getTime() + days * 24 * 60 * 60_000).toISOString();

  return [
    {
      id: `${eventId}:decor-loadin`,
      title: 'Confirm Decor Load-In Path',
      description: 'Review dock access, staging location, and ballroom handoff before decor release.',
      status: 'pending',
      priority: 'high',
      ownerRole: 'planner',
      assigneeRole: 'decorator',
      vendorProfile: 'decorator',
      linkedTimelineItemIds: ['step-loadin'],
      dueAtIso: inDays(3),
      notes: 'Must align with venue access window and production cable paths.',
      clientVisible: false
    },
    {
      id: `${eventId}:dj-baraat-cue`,
      title: 'Finalize Baraat Audio Cue Stack',
      description: 'Lock entry order, dhol handoff, and mobile sound sequence before baraat assembly.',
      status: 'pending',
      priority: 'critical',
      ownerRole: 'planner',
      assigneeRole: 'dj_mc',
      vendorProfile: 'dj_mc',
      linkedTimelineItemIds: ['step-baraat'],
      dueAtIso: inDays(5),
      notes: 'Requires final family coordinator timing confirmation.',
      clientVisible: true
    },
    {
      id: `${eventId}:venue-cocktail-reset`,
      title: 'Confirm Cocktail Turnover Window',
      description: 'Validate ballroom reset timing and guest routing between ceremony and cocktail hour.',
      status: 'pending',
      priority: 'high',
      ownerRole: 'planner',
      assigneeRole: 'venue_coordinator',
      vendorProfile: 'venue',
      linkedTimelineItemIds: ['step-cocktail'],
      dueAtIso: inDays(7),
      notes: 'Needed before planner can lock guest transition staffing.',
      clientVisible: false
    },
    {
      id: `${eventId}:planner-ceremony-flow`,
      title: 'Approve Ceremony Seating Flow',
      description: 'Confirm seating order, accessibility path, and final aisle timing before ceremony release.',
      status: 'pending',
      priority: 'normal',
      ownerRole: 'admin',
      assigneeRole: 'planner',
      vendorProfile: 'general',
      linkedTimelineItemIds: ['step-ceremony'],
      dueAtIso: inDays(4),
      notes: 'Couple can see this status as a planning milestone.',
      clientVisible: true
    },
    {
      id: `${eventId}:production-entry-sync`,
      title: 'Production Sync for Grand Entry',
      description: 'Verify entry lighting, audio cues, and staging sequence for reception start.',
      status: 'pending',
      priority: 'critical',
      ownerRole: 'planner',
      assigneeRole: 'production',
      vendorProfile: 'production',
      linkedTimelineItemIds: ['step-reception'],
      dueAtIso: inDays(6),
      notes: 'Foundation only; workspace UI comes later.',
      clientVisible: false
    }
  ];
}

function resolveAssigneeMember(template: TaskTemplate, eventId: string): MemberRecord | null {
  const exactRole = findMembershipByRoleAndEvent(template.assigneeRole, eventId);
  if (exactRole && inferVendorProfile(exactRole) === template.vendorProfile) {
    return exactRole;
  }

  if (exactRole && template.vendorProfile === 'general') {
    return exactRole;
  }

  const members = listMembersByEvent(eventId);
  return (
    members.find((member) => member.role === template.assigneeRole && inferVendorProfile(member) === template.vendorProfile) ??
    (template.vendorProfile === 'decorator' ? members.find((m) => m.role === 'decorator') ?? null : null) ??
    (template.assigneeRole === 'dj_mc' ? findMembershipByRoleAndEvent('vendor', eventId) : null) ??
    (template.assigneeRole !== 'planner' ? findMembershipByRoleAndEvent('planner', eventId) : null)
  );
}

export function getCanonicalTaskBundle(eventId: string, actorUserId: string, actorRole: Role): TaskBundle {
  const templates = getTaskTemplates(eventId);
  const assignments: CanonicalVendorAssignment[] = [];
  const tasks: CanonicalTask[] = [];

  for (const template of templates) {
    const assignee = resolveAssigneeMember(template, eventId);
    if (!assignee) {
      continue;
    }

    const assignmentId = `${template.id}:assignment`;
    assignments.push({
      id: assignmentId,
      eventId,
      taskId: template.id,
      assigneeUserId: assignee.userId,
      assigneeRole: assignee.role,
      assigneeLabel: assignee.displayName,
      assigneeEmail: assignee.email,
      vendorProfile: template.vendorProfile === 'general' ? inferVendorProfile(assignee) : template.vendorProfile
    });

    tasks.push({
      id: template.id,
      eventId,
      title: template.title,
      description: template.description,
      status: template.status,
      priority: template.priority,
      ownerRole: template.ownerRole,
      ownerLabel: template.ownerRole === 'admin' ? 'Admin Console' : 'Planner Desk',
      assignmentId,
      linkedTimelineItemIds: template.linkedTimelineItemIds,
      dueAtIso: template.dueAtIso,
      notes: template.notes,
      clientVisible: template.clientVisible
    });
  }

  return {
    eventId,
    actorUserId,
    actorRole,
    tasks,
    assignments,
    timeline: buildBaseCanonicalTimeline(eventId)
  };
}

function mapTimelineSlices(bundle: TaskBundle, ids: string[]): TimelineSlice[] {
  return bundle.timeline
    .filter((item) => ids.includes(item.id))
    .map((item) => ({
      id: item.id,
      phase: item.phase,
      title: item.title,
      startsAtIso: item.scheduledStartIso,
      endsAtIso: item.scheduledEndIso,
      ownerLabel: item.ownerLabel
    }));
}

function mapTaskProjection(task: CanonicalTask, assignment: CanonicalVendorAssignment, bundle: TaskBundle, scope: DomainScope): TaskProjectionItem {
  const assignedToActor = assignment.assigneeUserId === bundle.actorUserId;

  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    ownerRole: task.ownerRole,
    ownerLabel: task.ownerLabel,
    assignee: {
      userId: assignment.assigneeUserId,
      label: assignment.assigneeLabel,
      role: assignment.assigneeRole,
      profile: assignment.vendorProfile
    },
    linkedTimelineItemIds: task.linkedTimelineItemIds,
    linkedTimeline: mapTimelineSlices(bundle, task.linkedTimelineItemIds),
    dueAtIso: task.dueAtIso,
    notes: scope.projection === 'full' || scope.projection === 'operations' || assignedToActor ? task.notes : null,
    readOnly: !canAccessDomain('tasks', bundle.actorRole, 'write') || (!assignedToActor && !(bundle.actorRole === 'admin' || bundle.actorRole === 'planner')),
    canUpdateStatus: bundle.actorRole === 'admin' || bundle.actorRole === 'planner' || assignedToActor
  };
}

function summarizeTasks(tasks: TaskProjectionItem[]) {
  return {
    totalTasks: tasks.length,
    openTasks: tasks.filter((task) => task.status !== 'completed').length,
    linkedTimelineIds: Array.from(new Set(tasks.flatMap((task) => task.linkedTimelineItemIds)))
  };
}

const projectTasks = createRoleScopedAdapter<
  TaskBundle,
  {
    tasks: TaskProjectionItem[];
    relatedTimeline: TimelineSlice[];
    summary: ReturnType<typeof summarizeTasks>;
    permissions: { canCreate: boolean; canEditAny: boolean };
  }
>({
  domain: 'tasks',
  projectors: {
    full: (bundle, scope) => {
      const tasks = bundle.tasks.map((task) => mapTaskProjection(task, bundle.assignments.find((item) => item.id === task.assignmentId)!, bundle, scope));

      return {
        tasks,
        relatedTimeline: mapTimelineSlices(bundle, Array.from(new Set(tasks.flatMap((task) => task.linkedTimelineItemIds)))),
        summary: summarizeTasks(tasks),
        permissions: { canCreate: true, canEditAny: true }
      };
    },
    owner_filtered: (bundle, scope) => {
      const tasks = bundle.tasks
        .filter((task) => task.clientVisible)
        .map((task) => mapTaskProjection(task, bundle.assignments.find((item) => item.id === task.assignmentId)!, bundle, scope));

      return {
        tasks,
        relatedTimeline: mapTimelineSlices(bundle, Array.from(new Set(tasks.flatMap((task) => task.linkedTimelineItemIds)))),
        summary: summarizeTasks(tasks),
        permissions: { canCreate: false, canEditAny: false }
      };
    },
    operations: (bundle, scope) => {
      const tasks = bundle.tasks
        .filter(
          (task) =>
            ['planner', 'production', 'dj_mc', 'venue_coordinator'].includes(task.ownerRole) ||
            ['production', 'dj_mc', 'venue_coordinator'].includes(bundle.assignments.find((item) => item.id === task.assignmentId)?.assigneeRole ?? 'guest')
        )
        .map((task) => mapTaskProjection(task, bundle.assignments.find((item) => item.id === task.assignmentId)!, bundle, scope));

      return {
        tasks,
        relatedTimeline: mapTimelineSlices(bundle, Array.from(new Set(tasks.flatMap((task) => task.linkedTimelineItemIds)))),
        summary: summarizeTasks(tasks),
        permissions: { canCreate: false, canEditAny: false }
      };
    },
    assigned: (bundle, scope) => {
      const tasks = bundle.tasks
        .filter((task) => bundle.assignments.find((item) => item.id === task.assignmentId)?.assigneeUserId === bundle.actorUserId)
        .map((task) => mapTaskProjection(task, bundle.assignments.find((item) => item.id === task.assignmentId)!, bundle, scope));

      return {
        tasks,
        relatedTimeline: mapTimelineSlices(bundle, Array.from(new Set(tasks.flatMap((task) => task.linkedTimelineItemIds)))),
        summary: summarizeTasks(tasks),
        permissions: { canCreate: false, canEditAny: false }
      };
    },
    venue: (bundle, scope) => {
      const tasks = bundle.tasks
        .filter((task) => bundle.assignments.find((item) => item.id === task.assignmentId)?.assigneeRole === 'venue_coordinator')
        .map((task) => mapTaskProjection(task, bundle.assignments.find((item) => item.id === task.assignmentId)!, bundle, scope));

      return {
        tasks,
        relatedTimeline: mapTimelineSlices(bundle, Array.from(new Set(tasks.flatMap((task) => task.linkedTimelineItemIds)))),
        summary: summarizeTasks(tasks),
        permissions: { canCreate: false, canEditAny: false }
      };
    },
    summary: (bundle, scope) => {
      const tasks = bundle.tasks
        .filter((task) => task.clientVisible)
        .map((task) => mapTaskProjection(task, bundle.assignments.find((item) => item.id === task.assignmentId)!, bundle, scope));

      return {
        tasks,
        relatedTimeline: mapTimelineSlices(bundle, Array.from(new Set(tasks.flatMap((task) => task.linkedTimelineItemIds)))),
        summary: summarizeTasks(tasks),
        permissions: { canCreate: false, canEditAny: false }
      };
    }
  }
});

const projectVendorRoster = createRoleScopedAdapter<
  TaskBundle,
  { roster: VendorRosterEntry[]; permissions: { canManageAssignments: boolean } }
>({
  domain: 'vendors',
  projectors: {
    full: (bundle) => {
      const roster = bundle.assignments.map((assignment) => {
        const tasks = bundle.tasks.filter((task) => task.assignmentId === assignment.id);
        return {
          userId: assignment.assigneeUserId,
          displayName: assignment.assigneeLabel,
          email: assignment.assigneeEmail,
          role: assignment.assigneeRole,
          vendorProfile: assignment.vendorProfile,
          assignmentCount: tasks.length,
          openTaskCount: tasks.filter((task) => task.status !== 'completed').length,
          linkedTimeline: mapTimelineSlices(bundle, Array.from(new Set(tasks.flatMap((task) => task.linkedTimelineItemIds)))),
          taskIds: tasks.map((task) => task.id),
          readOnly: false
        } satisfies VendorRosterEntry;
      });

      return { roster, permissions: { canManageAssignments: true } };
    },
    owner_filtered: (bundle) => {
      const roster = bundle.assignments.map((assignment) => {
        const tasks = bundle.tasks.filter((task) => task.assignmentId === assignment.id && task.clientVisible);
        return {
          userId: assignment.assigneeUserId,
          displayName: assignment.assigneeLabel,
          email: '',
          role: assignment.assigneeRole,
          vendorProfile: assignment.vendorProfile,
          assignmentCount: tasks.length,
          openTaskCount: tasks.filter((task) => task.status !== 'completed').length,
          linkedTimeline: mapTimelineSlices(bundle, Array.from(new Set(tasks.flatMap((task) => task.linkedTimelineItemIds)))),
          taskIds: tasks.map((task) => task.id),
          readOnly: true
        } satisfies VendorRosterEntry;
      });

      return { roster: roster.filter((entry) => entry.assignmentCount > 0), permissions: { canManageAssignments: false } };
    },
    operations: (bundle) => ({
      roster: bundle.assignments
        .filter((assignment) => assignment.assigneeRole === 'production' || assignment.assigneeRole === 'dj_mc' || assignment.assigneeRole === 'venue_coordinator')
        .map((assignment) => {
          const tasks = bundle.tasks.filter((task) => task.assignmentId === assignment.id);
          return {
            userId: assignment.assigneeUserId,
            displayName: assignment.assigneeLabel,
            email: assignment.assigneeEmail,
            role: assignment.assigneeRole,
            vendorProfile: assignment.vendorProfile,
            assignmentCount: tasks.length,
            openTaskCount: tasks.filter((task) => task.status !== 'completed').length,
            linkedTimeline: mapTimelineSlices(bundle, Array.from(new Set(tasks.flatMap((task) => task.linkedTimelineItemIds)))),
            taskIds: tasks.map((task) => task.id),
            readOnly: true
          } satisfies VendorRosterEntry;
        }),
      permissions: { canManageAssignments: false }
    }),
    assigned: (bundle) => {
      const assignment = bundle.assignments.find((item) => item.assigneeUserId === bundle.actorUserId);
      if (!assignment) {
        return { roster: [], permissions: { canManageAssignments: false } };
      }

      const tasks = bundle.tasks.filter((task) => task.assignmentId === assignment.id);
      return {
        roster: [
          {
            userId: assignment.assigneeUserId,
            displayName: assignment.assigneeLabel,
            email: assignment.assigneeEmail,
            role: assignment.assigneeRole,
            vendorProfile: assignment.vendorProfile,
            assignmentCount: tasks.length,
            openTaskCount: tasks.filter((task) => task.status !== 'completed').length,
            linkedTimeline: mapTimelineSlices(bundle, Array.from(new Set(tasks.flatMap((task) => task.linkedTimelineItemIds)))),
            taskIds: tasks.map((task) => task.id),
            readOnly: true
          }
        ],
        permissions: { canManageAssignments: false }
      };
    },
    venue: (bundle) => ({
      roster: bundle.assignments
        .filter((assignment) => assignment.assigneeRole === 'venue_coordinator')
        .map((assignment) => {
          const tasks = bundle.tasks.filter((task) => task.assignmentId === assignment.id);
          return {
            userId: assignment.assigneeUserId,
            displayName: assignment.assigneeLabel,
            email: assignment.assigneeEmail,
            role: assignment.assigneeRole,
            vendorProfile: assignment.vendorProfile,
            assignmentCount: tasks.length,
            openTaskCount: tasks.filter((task) => task.status !== 'completed').length,
            linkedTimeline: mapTimelineSlices(bundle, Array.from(new Set(tasks.flatMap((task) => task.linkedTimelineItemIds)))),
            taskIds: tasks.map((task) => task.id),
            readOnly: true
          } satisfies VendorRosterEntry;
        }),
      permissions: { canManageAssignments: false }
    })
  }
});

export function getTaskProjectionForActor(params: { eventId: string; actorUserId: string; actorRole: Role }) {
  const bundle = getCanonicalTaskBundle(params.eventId, params.actorUserId, params.actorRole);
  const projection = projectTasks(params.actorRole, bundle) ?? {
    tasks: [],
    relatedTimeline: [],
    summary: summarizeTasks([]),
    permissions: { canCreate: false, canEditAny: false }
  };

  return {
    domainScope: getDomainScope('tasks', params.actorRole),
    ...projection
  };
}

export function getVendorRosterProjectionForActor(params: { eventId: string; actorUserId: string; actorRole: Role }) {
  const bundle = getCanonicalTaskBundle(params.eventId, params.actorUserId, params.actorRole);
  const projection = projectVendorRoster(params.actorRole, bundle) ?? { roster: [], permissions: { canManageAssignments: false } };

  return {
    domainScope: getDomainScope('vendors', params.actorRole),
    ...projection
  };
}

export function canCreateCanonicalTask(role: Role): boolean {
  return role === 'admin' || role === 'planner';
}

export function buildCanonicalTaskPreview(params: {
  eventId: string;
  title: string;
  description: string;
  priority: TaskPriority;
  assigneeUserId: string;
  linkedTimelineItemIds: string[];
  dueAtIso: string | null;
  notes: string | null;
  ownerRole: Role;
  clientVisible: boolean;
}): { task: CanonicalTask; assignment: CanonicalVendorAssignment; relatedTimeline: TimelineSlice[] } | null {
  const member = findMembershipByUserIdAndEvent(params.assigneeUserId, params.eventId);
  if (!member) {
    return null;
  }

  const normalizedId = params.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const assignment: CanonicalVendorAssignment = {
    id: `${params.eventId}:${params.assigneeUserId}:${normalizedId}`,
    eventId: params.eventId,
    taskId: `${params.eventId}:${normalizedId}`,
    assigneeUserId: member.userId,
    assigneeRole: member.role,
    assigneeLabel: member.displayName,
    assigneeEmail: member.email,
    vendorProfile: inferVendorProfile(member)
  };

  const task: CanonicalTask = {
    id: assignment.taskId,
    eventId: params.eventId,
    title: params.title,
    description: params.description,
    status: 'pending',
    priority: params.priority,
    ownerRole: params.ownerRole,
    ownerLabel: params.ownerRole === 'admin' ? 'Admin Console' : 'Planner Desk',
    assignmentId: assignment.id,
    linkedTimelineItemIds: params.linkedTimelineItemIds,
    dueAtIso: params.dueAtIso,
    notes: params.notes,
    clientVisible: params.clientVisible
  };

  const bundle = getCanonicalTaskBundle(params.eventId, params.assigneeUserId, member.role);
  return {
    task,
    assignment,
    relatedTimeline: mapTimelineSlices(bundle, params.linkedTimelineItemIds)
  };
}

export function patchCanonicalTaskForActor(params: {
  eventId: string;
  actorUserId: string;
  actorRole: Role;
  taskId: string;
  patch: Partial<Pick<CanonicalTask, 'status' | 'notes' | 'title' | 'description' | 'dueAtIso'>>;
}) {
  const bundle = getCanonicalTaskBundle(params.eventId, params.actorUserId, params.actorRole);
  const task = bundle.tasks.find((item) => item.id === params.taskId) ?? null;
  const assignment = task ? bundle.assignments.find((item) => item.id === task.assignmentId) ?? null : null;

  if (!task || !assignment) {
    return { task: null, relatedTimeline: [] as TimelineSlice[], forbidden: false };
  }

  const assignedToActor = assignment.assigneeUserId === params.actorUserId;
  const canEditAny = params.actorRole === 'admin' || params.actorRole === 'planner';

  if (!canEditAny && !assignedToActor) {
    return { task: null, relatedTimeline: [] as TimelineSlice[], forbidden: true };
  }

  if (!canEditAny && (params.patch.title || params.patch.description || params.patch.dueAtIso)) {
    return { task: null, relatedTimeline: [] as TimelineSlice[], forbidden: true };
  }

  const updated: CanonicalTask = {
    ...task,
    title: params.patch.title ?? task.title,
    description: params.patch.description ?? task.description,
    status: params.patch.status ?? task.status,
    dueAtIso: params.patch.dueAtIso ?? task.dueAtIso,
    notes: params.patch.notes === undefined ? task.notes : params.patch.notes
  };

  return {
    task: updated,
    relatedTimeline: mapTimelineSlices(bundle, updated.linkedTimelineItemIds),
    forbidden: false
  };
}
