import { NextResponse } from 'next/server';

import { getVendorRosterProjectionForActor } from '@/lib/canonical-tasks';
import { requireEventRoleContext } from '@/lib/event-context';

export async function GET() {
  const { context, response } = await requireEventRoleContext();

  if (response || !context) {
    return response as NextResponse;
  }

  const projection = getVendorRosterProjectionForActor({
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
    roster: projection.roster
  });
}