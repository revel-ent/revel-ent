import { NextResponse } from 'next/server';

import { getOperationalPersistenceMode, getVenueIntelligenceProjectionForActor } from '@/lib/production-domains';
import { requireEventRoleContext } from '@/lib/event-context';
import { canAccessDomain } from '@/lib/role-scoped-adapters';

export async function GET() {
  const { context, response } = await requireEventRoleContext();

  if (response || !context) {
    return response as NextResponse;
  }

  if (!canAccessDomain('venue_intelligence', context.role, 'read')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const projection = await getVenueIntelligenceProjectionForActor({ eventId: context.eventId, actorRole: context.role });

  return NextResponse.json({
    eventId: context.eventId,
    role: context.role,
    persistenceMode: getOperationalPersistenceMode(),
    source: 'simulation',
    domainScope: projection.domainScope,
    venue: projection.venue
  });
}
