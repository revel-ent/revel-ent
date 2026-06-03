import { NextResponse } from 'next/server';

import { type Role } from '@/lib/auth';
import { getSession, type Session } from '@/lib/session';
import { getDomainScopesForRole, type DomainKey, type DomainScope } from '@/lib/role-scoped-adapters';

export type WorkspaceSurface =
  | 'admin_planner'
  | 'couple'
  | 'production'
  | 'dj_mc'
  | 'vendor'
  | 'venue'
  | 'guest'
  | 'delegate';

export interface EventRoleContext extends Session {
  workspaceSurface: WorkspaceSurface;
  roleContextLocked: true;
  domainScopes: Record<DomainKey, DomainScope>;
}

export interface RequireEventContextOptions {
  allowedRoles?: Role[];
  requireEventId?: boolean;
}

export function getWorkspaceSurfaceForRole(role: Role): WorkspaceSurface {
  if (role === 'admin' || role === 'planner') {
    return 'admin_planner';
  }

  if (role === 'couple') {
    return 'couple';
  }

  if (role === 'production') {
    return 'production';
  }

  if (role === 'dj_mc') {
    return 'dj_mc';
  }

  if (role === 'vendor') {
    return 'vendor';
  }

  if (role === 'venue_coordinator') {
    return 'venue';
  }

  if (role === 'guest') {
    return 'guest';
  }

  return 'delegate';
}

export function buildEventRoleContext(session: Session): EventRoleContext {
  return {
    ...session,
    workspaceSurface: getWorkspaceSurfaceForRole(session.role),
    roleContextLocked: true,
    domainScopes: getDomainScopesForRole(session.role)
  };
}

export async function getEventRoleContext(): Promise<EventRoleContext | null> {
  const session = await getSession();

  if (!session) {
    return null;
  }

  return buildEventRoleContext(session);
}

export async function requireEventRoleContext(
  options: RequireEventContextOptions = {}
): Promise<{ context: EventRoleContext | null; response: NextResponse | null }> {
  const context = await getEventRoleContext();

  if (!context) {
    return { context: null, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  if (options.requireEventId !== false && !context.eventId) {
    return { context: null, response: NextResponse.json({ error: 'Missing event context' }, { status: 400 }) };
  }

  if (options.allowedRoles && !options.allowedRoles.includes(context.role)) {
    return { context: null, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { context, response: null };
}