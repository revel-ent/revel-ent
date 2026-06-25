import { NextResponse, type NextRequest } from 'next/server';

import { canAccessRoute, isKnownRole, resolveDefaultPortalRoute, type Role } from '@/lib/auth';
import { findMembershipByUserIdAndEvent, listMembershipsByUserId } from '@/lib/mock-data';
import { getSessionCookieName, verifySessionToken } from '@/lib/session-token';
import { getSessionCookieOptions, signSessionToken } from '@/lib/session-token';

function redirectTo(path: string, request: NextRequest) {
  const url = new URL(path, request.url);
  return NextResponse.redirect(url);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/Atlas') {
    return redirectTo('/atlas', request);
  }

  if (!pathname.startsWith('/portal')) {
    return NextResponse.next();
  }

  const rawSessionToken = request.cookies.get(getSessionCookieName())?.value;

  if (!rawSessionToken) {
    return redirectTo('/login', request);
  }

  const session = await verifySessionToken(rawSessionToken);
  const roleCookie = session?.role;
  const eventId = session?.eventId;
  const lastActiveEventId = session?.lastActiveEventId ?? null;

  if (!roleCookie || !isKnownRole(roleCookie)) {
    return redirectTo('/login', request);
  }

  const role = roleCookie as Role;

  let resolvedEventId: string | null = eventId ?? null;
  let resolvedOrganizationId = session.organizationId ?? null;

  if (role !== 'admin') {
    const memberships = listMembershipsByUserId(session.userId).filter((membership) => membership.role === role);
    const byCurrent = resolvedEventId ? findMembershipByUserIdAndEvent(session.userId, resolvedEventId) : null;

    if (byCurrent && byCurrent.role === role) {
      resolvedEventId = byCurrent.eventId;
      resolvedOrganizationId = byCurrent.organizationId;
    } else {
      const byLastActive = lastActiveEventId ? findMembershipByUserIdAndEvent(session.userId, lastActiveEventId) : null;
      if (byLastActive && byLastActive.role === role) {
        resolvedEventId = byLastActive.eventId;
        resolvedOrganizationId = byLastActive.organizationId;
      } else if (memberships.length === 1) {
        resolvedEventId = memberships[0].eventId;
        resolvedOrganizationId = memberships[0].organizationId;
      } else if (memberships.length === 0 && resolvedEventId) {
        // Real invite-accepted users may not exist in local mock membership fixtures.
        // Keep signed event context so route access can continue.
      } else {
        resolvedEventId = null;
      }
    }
  }

  if (role !== 'admin' && !resolvedEventId) {
    return redirectTo('/login?error=missing_event', request);
  }

  if (!canAccessRoute(role, pathname)) {
    return redirectTo('/unauthorized', request);
  }

  if (pathname === '/portal') {
    const defaultRoute = resolveDefaultPortalRoute(role);
    if (defaultRoute !== '/portal') {
      const redirectResponse = redirectTo(defaultRoute, request);
      const sessionToken = await signSessionToken({
        userId: session.userId,
        email: session.email,
        displayName: session.displayName,
        role,
        organizationId: resolvedOrganizationId,
        eventId: resolvedEventId,
        lastActiveEventId: resolvedEventId
      });

      redirectResponse.cookies.set(getSessionCookieName(), sessionToken, getSessionCookieOptions());
      return redirectResponse;
    }
  }

  const response = NextResponse.next();

  if (resolvedEventId !== eventId || lastActiveEventId !== resolvedEventId || resolvedOrganizationId !== (session.organizationId ?? null)) {
    const sessionToken = await signSessionToken({
      userId: session.userId,
      email: session.email,
      displayName: session.displayName,
      role,
      organizationId: resolvedOrganizationId,
      eventId: resolvedEventId,
      lastActiveEventId: resolvedEventId
    });

    response.cookies.set(getSessionCookieName(), sessionToken, getSessionCookieOptions());
  }

  return response;
}

export const config = {
  matcher: ['/portal/:path*', '/Atlas']
};
