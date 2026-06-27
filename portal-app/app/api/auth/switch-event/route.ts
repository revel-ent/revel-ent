import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { findEventById } from '@/lib/mock-data';
import {
  getSessionCookieName,
  getSessionCookieOptions,
  signSessionToken,
  verifySessionToken
} from '@/lib/session-token';

function canSwitchEvents(role: string): boolean {
  return role === 'admin' || role === 'planner';
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const currentToken = cookieStore.get(getSessionCookieName())?.value;
  const session = currentToken ? await verifySessionToken(currentToken) : null;

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!canSwitchEvents(session.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = (await request.json()) as { eventId?: unknown };
  const eventId = typeof body.eventId === 'string' ? body.eventId.trim() : '';

  if (!eventId) {
    return NextResponse.json({ error: 'eventId required' }, { status: 400 });
  }

  const event = findEventById(eventId);
  if (!event || event.organizationId !== session.organizationId) {
    return NextResponse.json({ error: 'event_not_found' }, { status: 404 });
  }

  const newToken = await signSessionToken({
    userId: session.userId,
    email: session.email,
    displayName: session.displayName,
    role: session.role,
    organizationId: session.organizationId,
    eventId,
    lastActiveEventId: eventId
  });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(getSessionCookieName(), newToken, getSessionCookieOptions());
  return response;
}
