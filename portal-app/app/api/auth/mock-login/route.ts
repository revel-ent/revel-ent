import { NextResponse } from 'next/server';

import { findMembershipByEmailAndEventCode } from '@/lib/mock-data';
import {
  getSessionCookieName,
  getSessionMaxAgeSeconds,
  signSessionToken
} from '@/lib/session-token';

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const eventCode = String(formData.get('eventCode') || '').trim();
  const next = String(formData.get('next') || '/portal').trim();

  const nextPath = next.startsWith('/portal') ? next : '/portal';

  if (!email || !eventCode) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', 'missing_fields');
    loginUrl.searchParams.set('next', nextPath);
    return NextResponse.redirect(loginUrl);
  }

  const membership = findMembershipByEmailAndEventCode(email, eventCode);

  if (!membership) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', 'membership_not_found');
    loginUrl.searchParams.set('next', nextPath);
    return NextResponse.redirect(loginUrl);
  }

  let sessionToken: string;

  try {
    sessionToken = await signSessionToken({
      userId: membership.userId,
      email: membership.email,
      displayName: membership.displayName,
      role: membership.role,
      eventId: membership.eventId
    });
  } catch {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', 'configuration_error');
    loginUrl.searchParams.set('next', nextPath);
    return NextResponse.redirect(loginUrl);
  }

  const response = NextResponse.redirect(new URL(nextPath, request.url));

  response.cookies.set(getSessionCookieName(), sessionToken, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: getSessionMaxAgeSeconds()
  });

  return response;
}
