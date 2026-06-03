import { NextResponse } from 'next/server';

import { getOperationalPersistenceMode, patchCueForActor, type CueStatus } from '@/lib/production-domains';
import { requireEventRoleContext } from '@/lib/event-context';
import { canAccessDomain } from '@/lib/role-scoped-adapters';

interface CuePatchBody {
  status?: unknown;
  note?: unknown;
  actualAtIso?: unknown;
}

function parseCueStatus(value: unknown): CueStatus | undefined {
  return value === 'pending' || value === 'ready' || value === 'in_progress' || value === 'complete' || value === 'blocked'
    ? value
    : undefined;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ cueId: string }> }) {
  const { context, response } = await requireEventRoleContext();

  if (response || !context) {
    return response as NextResponse;
  }

  if (!canAccessDomain('run_of_show', context.role, 'write')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: CuePatchBody;
  try {
    body = (await request.json()) as CuePatchBody;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const { cueId } = await params;
  const result = await patchCueForActor({
    eventId: context.eventId,
    actorRole: context.role,
    cueId,
    patch: {
      status: parseCueStatus(body.status),
      note: typeof body.note === 'string' ? body.note : undefined,
      actualAtIso: typeof body.actualAtIso === 'string' || body.actualAtIso === null ? body.actualAtIso : undefined
    }
  });

  if (result.forbidden) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!result.cue) {
    return NextResponse.json({ error: 'cue_not_found' }, { status: 404 });
  }

  return NextResponse.json({
    persistenceMode: getOperationalPersistenceMode(),
    mode: 'simulation',
    updatedCue: result.cue,
    summary: result.summary
  });
}
