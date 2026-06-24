import { NextResponse } from 'next/server';

import { getChecklistState, getCouplePersistenceMode, markPaymentMilestoneComplete } from '@/lib/couple-domains';
import { requireEventRoleContext } from '@/lib/event-context';

export async function PATCH(_request: Request, { params }: { params: Promise<{ milestoneId: string }> }) {
  const { context, response } = await requireEventRoleContext({ allowedRoles: ['admin', 'couple', 'planner'] });

  if (response || !context) {
    return response as NextResponse;
  }

  const { milestoneId } = await params;
  const updated = await markPaymentMilestoneComplete(context.eventId, milestoneId);

  if (!updated) {
    return NextResponse.json({ error: 'milestone_not_found' }, { status: 404 });
  }

  const checklist = await getChecklistState(context.eventId);

  return NextResponse.json({
    mode: getCouplePersistenceMode(),
    updatedMilestone: updated,
    summary: checklist.summary
  });
}