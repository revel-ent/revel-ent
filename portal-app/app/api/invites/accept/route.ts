import { NextResponse } from 'next/server';

import { acceptInviteWithToken } from '@/lib/invite-acceptance';
import { getSessionCookieName, getSessionCookieOptions } from '@/lib/session-token';

interface AcceptInviteBody {
  email?: unknown;
  inviteToken?: unknown;
  next?: unknown;
}

export async function POST(request: Request) {
  let body: AcceptInviteBody;

  try {
    body = (await request.json()) as AcceptInviteBody;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const result = await acceptInviteWithToken({
    email: String(body.email ?? ''),
    inviteToken: String(body.inviteToken ?? ''),
    next: body.next
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error.error, details: result.error.details }, { status: result.error.status });
  }

  const response = NextResponse.json(
    {
      source: result.value.source,
      accepted: result.value.accepted,
      eventId: result.value.eventId,
      organizationId: result.value.organizationId,
      role: result.value.role,
      nextPath: result.value.nextPath
    },
    { status: 200 }
  );

  response.cookies.set(getSessionCookieName(), result.value.sessionToken, getSessionCookieOptions());

  return response;
}
