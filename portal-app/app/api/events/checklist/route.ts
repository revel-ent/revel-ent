import { NextResponse } from 'next/server';

import { getChecklistState } from '@/lib/couple-domains';
import { requireEventRoleContext } from '@/lib/event-context';

export async function GET() {
  const { context, response } = await requireEventRoleContext({ allowedRoles: ['admin', 'couple', 'planner'] });

  if (response || !context) {
    return response as NextResponse;
  }

  const checklist = getChecklistState(context.eventId);

  return NextResponse.json({
    eventId: context.eventId,
    role: context.role,
    source: 'simulation',
    permissions: {
      canUpdatePayments: context.role === 'couple' || context.role === 'planner' || context.role === 'admin',
      canUpdateChecklist: context.role === 'couple' || context.role === 'planner' || context.role === 'admin'
    },
    ...checklist
  });
}