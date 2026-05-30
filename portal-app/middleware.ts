import { NextResponse, type NextRequest } from 'next/server';

import { canAccessRoute, isKnownRole, type Role } from '@/lib/auth';
import { getSessionCookieName, verifySessionToken } from '@/lib/session-token';

function redirectTo(path: string, request: NextRequest) {
  const url = new URL(path, request.url);
  return NextResponse.redirect(url);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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

  if (!roleCookie || !isKnownRole(roleCookie)) {
    return redirectTo('/login', request);
  }

  const role = roleCookie as Role;

  if (role !== 'admin' && !eventId) {
    return redirectTo('/login?error=missing_event', request);
  }

  if (!canAccessRoute(role, pathname)) {
    return redirectTo('/unauthorized', request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/portal/:path*']
};
