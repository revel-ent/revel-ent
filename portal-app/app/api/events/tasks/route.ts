import { NextResponse } from 'next/server';

import { buildCanonicalTaskPreview, canCreateCanonicalTask, getTaskProjectionForActor, type TaskPriority } from '@/lib/canonical-tasks';
import { requireEventRoleContext } from '@/lib/event-context';

interface CreateTaskBody {
  title?: unknown;
  description?: unknown;
  priority?: unknown;
  assigneeUserId?: unknown;
  linkedTimelineItemIds?: unknown;
  dueAtIso?: unknown;
  notes?: unknown;
  clientVisible?: unknown;
}

function parsePriority(value: unknown): TaskPriority {
  return value === 'critical' || value === 'high' ? value : 'normal';
}

export async function GET() {
  const { context, response } = await requireEventRoleContext();

  if (response || !context) {
    return response as NextResponse;
  }

  const projection = getTaskProjectionForActor({
    eventId: context.eventId,
    actorUserId: context.userId,
    actorRole: context.role
  });

  return NextResponse.json({
    eventId: context.eventId,
    role: context.role,
    source: 'simulation',
    domainScope: projection.domainScope,
    permissions: projection.permissions,
    tasks: projection.tasks,
    relatedTimeline: projection.relatedTimeline,
    summary: projection.summary
  });
}

export async function POST(request: Request) {
  const { context, response } = await requireEventRoleContext();

  if (response || !context) {
    return response as NextResponse;
  }

  if (!canCreateCanonicalTask(context.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: CreateTaskBody;
  try {
    body = (await request.json()) as CreateTaskBody;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const assigneeUserId = typeof body.assigneeUserId === 'string' ? body.assigneeUserId.trim() : '';
  const linkedTimelineItemIds = Array.isArray(body.linkedTimelineItemIds)
    ? body.linkedTimelineItemIds.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];

  if (!title || !description || !assigneeUserId || linkedTimelineItemIds.length === 0) {
    return NextResponse.json({ error: 'missing_required_fields' }, { status: 400 });
  }

  const preview = buildCanonicalTaskPreview({
    eventId: context.eventId,
    title,
    description,
    priority: parsePriority(body.priority),
    assigneeUserId,
    linkedTimelineItemIds,
    dueAtIso: typeof body.dueAtIso === 'string' ? body.dueAtIso : null,
    notes: typeof body.notes === 'string' ? body.notes : null,
    ownerRole: context.role,
    clientVisible: body.clientVisible === true
  });

  if (!preview) {
    return NextResponse.json({ error: 'assignee_not_found' }, { status: 404 });
  }

  return NextResponse.json(
    {
      mode: 'simulation',
      createdTask: preview.task,
      assignment: preview.assignment,
      relatedTimeline: preview.relatedTimeline
    },
    { status: 201 }
  );
}