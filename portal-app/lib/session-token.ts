import { jwtVerify, SignJWT } from 'jose';

import { isKnownRole, type Role } from '@/lib/auth';

export interface SessionPayload {
  userId: string;
  email: string;
  displayName: string;
  role: Role;
  eventId: string | null;
}

const SESSION_COOKIE_NAME = 'revel_session';
const SESSION_DURATION_SECONDS = 60 * 60 * 8;

function getSessionSecret(): Uint8Array {
  const secret = process.env.PORTAL_SESSION_SECRET;

  if (!secret || secret.length < 16) {
    throw new Error('PORTAL_SESSION_SECRET must be set with at least 16 characters.');
  }

  return new TextEncoder().encode(secret);
}

export function getSessionCookieName(): string {
  return SESSION_COOKIE_NAME;
}

export function getSessionMaxAgeSeconds(): number {
  return SESSION_DURATION_SECONDS;
}

export function getSessionCookieOptions(): {
  httpOnly: true;
  sameSite: 'lax';
  path: '/';
  maxAge: number;
  secure: boolean;
} {
  return {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: getSessionMaxAgeSeconds(),
    secure: process.env.NODE_ENV === 'production'
  };
}

export async function signSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({
    userId: payload.userId,
    email: payload.email,
    displayName: payload.displayName,
    role: payload.role,
    eventId: payload.eventId
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSessionSecret());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSessionSecret());

    const userId = typeof payload.userId === 'string' ? payload.userId : null;
    const email = typeof payload.email === 'string' ? payload.email : null;
    const displayName = typeof payload.displayName === 'string' ? payload.displayName : null;
    const role = typeof payload.role === 'string' ? payload.role : null;
    const eventIdRaw = payload.eventId;

    if (!userId || !email || !displayName || !role) {
      return null;
    }

    if (!isKnownRole(role)) {
      return null;
    }

    return {
      userId,
      email,
      displayName,
      role: role as Role,
      eventId: typeof eventIdRaw === 'string' ? eventIdRaw : null
    };
  } catch {
    return null;
  }
}
