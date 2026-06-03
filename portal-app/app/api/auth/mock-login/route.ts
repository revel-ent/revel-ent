import { NextResponse } from 'next/server';

import { findMembershipByEmailAndInviteCode } from '@/lib/mock-data';
import { isDemoAuthEnabled } from '@/lib/runtime-flags';
import {
  getSessionCookieName,
  getSessionCookieOptions,
  signSessionToken
} from '@/lib/session-token';

export async function POST(request: Request) {
  if (!isDemoAuthEnabled()) {
    return new NextResponse('Not Found', { status: 404 });
  }

  const formData = await request.formData();
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const inviteCode = String(formData.get('inviteCode') || '').trim();
  const next = String(formData.get('next') || '/portal').trim();

  const nextPath = next.startsWith('/portal') ? next : '/portal';

  if (!email || !inviteCode) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', 'missing_fields');
    loginUrl.searchParams.set('next', nextPath);
    return NextResponse.redirect(loginUrl);
  }

  const membership = findMembershipByEmailAndInviteCode(email, inviteCode);

  if (!membership) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', 'invalid_credentials');
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
      organizationId: membership.organizationId,
      eventId: membership.eventId
    });
  } catch {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', 'configuration_error');
    loginUrl.searchParams.set('next', nextPath);
    return NextResponse.redirect(loginUrl);
  }

  const response = NextResponse.redirect(new URL(nextPath, request.url));

  response.cookies.set(getSessionCookieName(), sessionToken, getSessionCookieOptions());

  return response;
}
