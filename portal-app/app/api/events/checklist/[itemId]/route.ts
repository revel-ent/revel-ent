import { NextResponse } from 'next/server';

import { getChecklistState, toggleChecklistItem } from '@/lib/couple-domains';
import { requireEventRoleContext } from '@/lib/event-context';

export async function PATCH(_request: Request, { params }: { params: Promise<{ itemId: string }> }) {
  const { context, response } = await requireEventRoleContext({ allowedRoles: ['admin', 'couple', 'planner'] });

  if (response || !context) {
    return response as NextResponse;
  }

  const { itemId } = await params;
  const updated = toggleChecklistItem(context.eventId, itemId);

  if (!updated) {
    return NextResponse.json({ error: 'item_not_updatable' }, { status: 400 });
  }

  return NextResponse.json({
    mode: 'simulation',
    updatedItem: updated,
    summary: getChecklistState(context.eventId).summary
  });
}