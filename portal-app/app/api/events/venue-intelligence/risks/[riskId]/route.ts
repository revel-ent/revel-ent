import { NextResponse } from 'next/server';

import { getOperationalPersistenceMode, patchVenueRiskForActor } from '@/lib/production-domains';
import { requireEventRoleContext } from '@/lib/event-context';
import { canAccessDomain } from '@/lib/role-scoped-adapters';

interface RiskPatchBody {
  acknowledged?: unknown;
  mitigationNote?: unknown;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ riskId: string }> }) {
  const { context, response } = await requireEventRoleContext();

  if (response || !context) {
    return response as NextResponse;
  }

  if (!canAccessDomain('venue_intelligence', context.role, 'write')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: RiskPatchBody;
  try {
    body = (await request.json()) as RiskPatchBody;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const { riskId } = await params;
  const result = await patchVenueRiskForActor({
    eventId: context.eventId,
    actorRole: context.role,
    riskId,
    patch: {
      acknowledged: typeof body.acknowledged === 'boolean' ? body.acknowledged : undefined,
      mitigationNote: typeof body.mitigationNote === 'string' ? body.mitigationNote : undefined
    }
  });

  if (result.forbidden) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!result.risk) {
    return NextResponse.json({ error: 'risk_not_found' }, { status: 404 });
  }

  return NextResponse.json({
    persistenceMode: getOperationalPersistenceMode(),
    mode: 'simulation',
    updatedRisk: result.risk,
    summary: result.summary
  });
}
