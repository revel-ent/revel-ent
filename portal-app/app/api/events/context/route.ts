import { NextResponse } from 'next/server';

import { requireEventRoleContext } from '@/lib/event-context';

export async function GET() {
  const { context, response } = await requireEventRoleContext();

  if (response || !context) {
    return response as NextResponse;
  }

  return NextResponse.json(
    {
      actor: {
        userId: context.userId,
        email: context.email,
        displayName: context.displayName,
        role: context.role,
        workspaceSurface: context.workspaceSurface,
        roleContextLocked: context.roleContextLocked
      },
      event: {
        organizationId: context.organizationId,
        eventId: context.eventId
      },
      domainScopes: context.domainScopes
    },
    { status: 200 }
  );
}