import { NextResponse } from 'next/server';

import { getApprovalProjectionForActor, getCouplePersistenceMode } from '@/lib/couple-domains';
import { requireEventRoleContext } from '@/lib/event-context';
import { canAccessDomain } from '@/lib/role-scoped-adapters';

export async function GET() {
  const { context, response } = await requireEventRoleContext();

  if (response || !context) {
    return response as NextResponse;
  }

  if (!canAccessDomain('approvals', context.role, 'read')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const projection = await getApprovalProjectionForActor({ eventId: context.eventId, actorRole: context.role });
  return NextResponse.json({
    eventId: context.eventId,
    role: context.role,
    source: getCouplePersistenceMode(),
    domainScope: projection.domainScope,
    approvals: projection.approvals,
    summary: projection.summary
  });
}