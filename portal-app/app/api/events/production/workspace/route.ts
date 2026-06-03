import { NextResponse } from 'next/server';

import { getOperationalPersistenceMode, getProductionWorkspaceProjectionForActor } from '@/lib/production-domains';
import { requireEventRoleContext } from '@/lib/event-context';
import { canAccessDomain } from '@/lib/role-scoped-adapters';

export async function GET() {
  const { context, response } = await requireEventRoleContext();

  if (response || !context) {
    return response as NextResponse;
  }

  const canReadAny =
    canAccessDomain('venue_intelligence', context.role, 'read') ||
    canAccessDomain('equipment', context.role, 'read') ||
    canAccessDomain('run_of_show', context.role, 'read');

  if (!canReadAny) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const projection = await getProductionWorkspaceProjectionForActor({ eventId: context.eventId, actorRole: context.role });

  return NextResponse.json({
    eventId: context.eventId,
    role: context.role,
    persistenceMode: getOperationalPersistenceMode(),
    source: 'simulation',
    workspace: projection
  });
}
