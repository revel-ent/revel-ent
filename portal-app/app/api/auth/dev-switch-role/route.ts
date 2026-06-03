import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { isKnownRole } from '@/lib/auth';
import { findMembershipByRoleAndEvent } from '@/lib/mock-data';
import { isDevRoleSwitchEnabled } from '@/lib/runtime-flags';
import {
  getSessionCookieName,
  getSessionCookieOptions,
  signSessionToken,
  verifySessionToken
} from '@/lib/session-token';

export async function POST(request: Request) {
  if (!isDevRoleSwitchEnabled()) {
    return new NextResponse('Not Found', { status: 404 });
  }

  const cookieStore = await cookies();
  const currentToken = cookieStore.get(getSessionCookieName())?.value;

  const currentSession = currentToken ? await verifySessionToken(currentToken) : null;

  if (!currentSession) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const formData = await request.formData();
  const roleRaw = String(formData.get('role') || '').trim();
  const eventIdRaw = String(formData.get('eventId') || '').trim();
  const nextRaw = String(formData.get('next') || '/portal').trim();
  const nextPath = nextRaw.startsWith('/portal') ? nextRaw : '/portal';

  if (!isKnownRole(roleRaw)) {
    return NextResponse.redirect(new URL(nextPath, request.url));
  }

  const targetRole = roleRaw;
  const targetEventId = eventIdRaw || currentSession.eventId;
  const membership = findMembershipByRoleAndEvent(targetRole, targetEventId);

  if (!membership) {
    const fallback = new URL(nextPath, request.url);
    fallback.searchParams.set('error', 'dev_switch_unavailable');
    return NextResponse.redirect(fallback);
  }

  const sessionToken = await signSessionToken({
    userId: membership.userId,
    email: membership.email,
    displayName: membership.displayName,
    role: membership.role,
    organizationId: membership.organizationId,
    eventId: membership.eventId,
    lastActiveEventId: membership.eventId
  });

  const response = NextResponse.redirect(new URL(nextPath, request.url));

  response.cookies.set(getSessionCookieName(), sessionToken, getSessionCookieOptions());

  return response;
}
