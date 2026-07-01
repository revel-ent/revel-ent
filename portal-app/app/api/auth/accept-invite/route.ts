import { NextResponse } from 'next/server';

import { acceptInviteWithToken } from '@/lib/invite-acceptance';
import { sanitizeNextPath } from '@/lib/invite-lifecycle';
import { findMembershipByEmailAndInviteCode } from '@/lib/mock-data';
import { isDemoAuthEnabled } from '@/lib/runtime-flags';
import { getSessionCookieName, getSessionCookieOptions, signSessionToken } from '@/lib/session-token';

function redirectToLogin(request: Request, error: string, nextPath: string): NextResponse {
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('error', error);
  loginUrl.searchParams.set('next', nextPath);
  return NextResponse.redirect(loginUrl);
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get('email') || '').trim();
  const inviteToken = String(formData.get('inviteToken') || formData.get('inviteCode') || '').trim();
  const nextPath = sanitizeNextPath(formData.get('next'));

  if (!email || !inviteToken) {
    return redirectToLogin(request, 'missing_fields', nextPath);
  }

  // When demo auth is enabled, try mock credentials before hitting Supabase.
  if (isDemoAuthEnabled()) {
    const membership = findMembershipByEmailAndInviteCode(email, inviteToken);
    if (membership) {
      try {
        const sessionToken = await signSessionToken({
          userId: membership.userId,
          email: membership.email,
          displayName: membership.displayName,
          role: membership.role,
          organizationId: membership.organizationId,
          eventId: membership.eventId,
          lastActiveEventId: membership.eventId,
        });
        const response = NextResponse.redirect(new URL(nextPath, request.url));
        response.cookies.set(getSessionCookieName(), sessionToken, getSessionCookieOptions());
        return response;
      } catch {
        return redirectToLogin(request, 'configuration_error', nextPath);
      }
    }
  }

  const result = await acceptInviteWithToken({ email, inviteToken, next: nextPath });

  if (!result.ok) {
    return redirectToLogin(request, result.error.error, nextPath);
  }

  const response = NextResponse.redirect(new URL(result.value.nextPath, request.url));
  response.cookies.set(getSessionCookieName(), result.value.sessionToken, getSessionCookieOptions());

  return response;
}
