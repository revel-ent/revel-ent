import { NextResponse } from 'next/server';

import { patchCanonicalTaskForActor, type TaskStatus } from '@/lib/canonical-tasks';
import { requireEventRoleContext } from '@/lib/event-context';

interface PatchTaskBody {
  status?: unknown;
  notes?: unknown;
  title?: unknown;
  description?: unknown;
  dueAtIso?: unknown;
}

function parseStatus(value: unknown): TaskStatus | undefined {
  return value === 'pending' || value === 'acknowledged' || value === 'in_progress' || value === 'completed' || value === 'blocked'
    ? value
    : undefined;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ taskId: string }> }) {
  const { context, response } = await requireEventRoleContext();

  if (response || !context) {
    return response as NextResponse;
  }

  let body: PatchTaskBody;
  try {
    body = (await request.json()) as PatchTaskBody;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const { taskId } = await params;
  const result = patchCanonicalTaskForActor({
    eventId: context.eventId,
    actorUserId: context.userId,
    actorRole: context.role,
    taskId,
    patch: {
      status: parseStatus(body.status),
      notes: typeof body.notes === 'string' ? body.notes : undefined,
      title: typeof body.title === 'string' ? body.title : undefined,
      description: typeof body.description === 'string' ? body.description : undefined,
      dueAtIso: typeof body.dueAtIso === 'string' ? body.dueAtIso : undefined
    }
  });

  if (result.forbidden) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!result.task) {
    return NextResponse.json({ error: 'task_not_found' }, { status: 404 });
  }

  return NextResponse.json({
    mode: 'simulation',
    updatedTask: result.task,
    relatedTimeline: result.relatedTimeline
  });
}