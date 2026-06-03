import { NextResponse } from 'next/server';

import { type Role } from '@/lib/auth';
import { canChangeRole, canManageInvites, parseInviteRole } from '@/lib/invite-lifecycle';
import { getSession } from '@/lib/session';
import { getSupabaseAdminClient } from '@/lib/supabase-server';

interface UpdateRoleBody {
  role?: unknown;
  reason?: unknown;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ membershipId: string }> }
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!session.eventId) {
    return NextResponse.json({ error: 'Missing event context' }, { status: 400 });
  }

  if (!canManageInvites(session.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { membershipId } = await params;

  if (!membershipId) {
    return NextResponse.json({ error: 'missing_membership_id' }, { status: 400 });
  }

  let body: UpdateRoleBody;

  try {
    body = (await request.json()) as UpdateRoleBody;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const nextRole = parseInviteRole(body.role);

  if (!nextRole) {
    return NextResponse.json({ error: 'invalid_role' }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json({ error: 'invite_lifecycle_requires_supabase' }, { status: 503 });
  }

  const { data: membershipRow, error: membershipReadError } = await supabase
    .from('memberships')
    .select('membership_id,event_id,role,user_id')
    .eq('membership_id', membershipId)
    .maybeSingle();

  if (membershipReadError) {
    return NextResponse.json({ error: 'membership_lookup_failed', details: membershipReadError.message }, { status: 500 });
  }

  if (!membershipRow) {
    return NextResponse.json({ error: 'membership_not_found' }, { status: 404 });
  }

  if (membershipRow.event_id !== session.eventId) {
    return NextResponse.json({ error: 'forbidden_event_scope' }, { status: 403 });
  }

  const currentRole = membershipRow.role as Role;

  if (!canChangeRole(session.role, currentRole, nextRole)) {
    return NextResponse.json({ error: 'forbidden_role_transition' }, { status: 403 });
  }

  const nowIso = new Date().toISOString();

  const { data: updatedMembership, error: membershipUpdateError } = await supabase
    .from('memberships')
    .update({ role: nextRole, updated_at: nowIso })
    .eq('membership_id', membershipId)
    .eq('event_id', session.eventId)
    .select('membership_id,event_id,role,user_id')
    .maybeSingle();

  if (membershipUpdateError || !updatedMembership) {
    return NextResponse.json(
      { error: 'membership_role_update_failed', details: membershipUpdateError?.message ?? 'membership_not_returned' },
      { status: 500 }
    );
  }

  const { data: eventRow, error: eventLookupError } = await supabase
    .from('events')
    .select('organization_id')
    .eq('event_id', session.eventId)
    .maybeSingle();

  if (eventLookupError || !eventRow) {
    return NextResponse.json(
      { error: 'event_lookup_failed', details: eventLookupError?.message ?? 'event_not_found' },
      { status: 500 }
    );
  }

  const { error: auditInsertError } = await supabase.from('invite_audit_events').insert({
    token_id: null,
    organization_id: eventRow.organization_id,
    event_id: session.eventId,
    membership_id: membershipId,
    actor_user_id: session.userId,
    actor_role: session.role,
    event_type: 'membership_role_changed',
    payload: {
      reason: typeof body.reason === 'string' ? body.reason.trim() : null,
      previousRole: currentRole,
      nextRole
    }
  });

  if (auditInsertError) {
    return NextResponse.json({ error: 'invite_audit_write_failed', details: auditInsertError.message }, { status: 500 });
  }

  return NextResponse.json(
    {
      source: 'supabase',
      membershipId: updatedMembership.membership_id,
      eventId: updatedMembership.event_id,
      role: updatedMembership.role
    },
    { status: 200 }
  );
}
