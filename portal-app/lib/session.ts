import { cookies } from 'next/headers';

import { type Role } from '@/lib/auth';
import { getSessionCookieName, verifySessionToken } from '@/lib/session-token';

export interface Session {
  userId: string;
  email: string;
  displayName: string;
  role: Role;
  organizationId: string | null;
  eventId: string | null;
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const rawSessionToken = cookieStore.get(getSessionCookieName())?.value;

  if (!rawSessionToken) {
    return null;
  }

  const payload = await verifySessionToken(rawSessionToken);

  if (!payload) {
    return null;
  }

  return {
    userId: payload.userId,
    email: payload.email,
    displayName: payload.displayName,
    role: payload.role,
    organizationId: payload.organizationId ?? null,
    eventId: payload.eventId
  };
}
