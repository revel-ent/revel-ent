import { NextResponse } from 'next/server';

import { getOperationalPersistenceMode, patchEquipmentItemForActor, type EquipmentStatus } from '@/lib/production-domains';
import { requireEventRoleContext } from '@/lib/event-context';
import { isKnownRole } from '@/lib/auth';
import { canAccessDomain } from '@/lib/role-scoped-adapters';

interface EquipmentPatchBody {
  status?: unknown;
  ownerRole?: unknown;
  note?: unknown;
}

function parseStatus(value: unknown): EquipmentStatus | undefined {
  return value === 'pending' || value === 'ready' || value === 'blocked' || value === 'complete' ? value : undefined;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ itemId: string }> }) {
  const { context, response } = await requireEventRoleContext();

  if (response || !context) {
    return response as NextResponse;
  }

  if (!canAccessDomain('equipment', context.role, 'write')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: EquipmentPatchBody;
  try {
    body = (await request.json()) as EquipmentPatchBody;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const { itemId } = await params;
  const result = await patchEquipmentItemForActor({
    eventId: context.eventId,
    actorRole: context.role,
    itemId,
    patch: {
      status: parseStatus(body.status),
      ownerRole: typeof body.ownerRole === 'string' && isKnownRole(body.ownerRole) ? body.ownerRole : undefined,
      note: typeof body.note === 'string' ? body.note : undefined
    }
  });

  if (result.forbidden) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!result.item) {
    return NextResponse.json({ error: 'equipment_item_not_found' }, { status: 404 });
  }

  return NextResponse.json({
    persistenceMode: getOperationalPersistenceMode(),
    mode: 'simulation',
    updatedItem: result.item,
    summary: result.summary
  });
}
