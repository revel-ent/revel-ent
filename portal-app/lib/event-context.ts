import { NextResponse } from 'next/server';

import { type Role } from '@/lib/auth';
import { getSession, type Session } from '@/lib/session';
import { getDomainScopesForRole, type DomainKey, type DomainScope } from '@/lib/role-scoped-adapters';
import { getSupabaseAdminClient } from '@/lib/supabase-server';

export interface EventRecord {
  id: string;
  title: string;
  city: string;
  venueName: string;
  guestCountEstimate: number;
  moodBoardUrl: string | null;
}

export async function getEventRecord(eventId: string): Promise<EventRecord | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;

  const { data: event } = await supabase
    .from('events')
    .select('event_id, event_label, city, guest_count_estimate, venue_id, atlas_entitlement_snapshot')
    .eq('event_id', eventId)
    .maybeSingle();

  if (!event) return null;

  let venueName = '';
  const venueId = event.venue_id as string | null;
  if (venueId) {
    const { data: venue } = await supabase
      .from('venues')
      .select('name, room_name')
      .eq('venue_id', venueId)
      .maybeSingle();
    if (venue) {
      venueName = [venue.name, venue.room_name].filter(Boolean).join(' — ');
    }
  }

  const snapshot = (event.atlas_entitlement_snapshot as Record<string, unknown> | null) ?? {};
  const moodBoardUrl = typeof snapshot.mood_board_url === 'string' ? snapshot.mood_board_url : null;

  return {
    id: event.event_id as string,
    title: event.event_label as string,
    city: event.city as string,
    venueName,
    guestCountEstimate: (event.guest_count_estimate as number) ?? 0,
    moodBoardUrl,
  };
}

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

export interface EventRoleContextWithEvent extends EventRoleContext {
  eventId: string;
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

  if (role === 'vendor' || role === 'decorator') {
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
): Promise<{ context: EventRoleContextWithEvent | null; response: NextResponse | null }> {
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

  return { context: context as EventRoleContextWithEvent, response: null };
}