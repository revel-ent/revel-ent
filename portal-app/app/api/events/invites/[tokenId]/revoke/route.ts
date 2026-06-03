import { NextResponse } from 'next/server';

import { type Role } from '@/lib/auth';
import { canAssignRole, canManageInvites } from '@/lib/invite-lifecycle';
import { getSession } from '@/lib/session';
import { getSupabaseAdminClient } from '@/lib/supabase-server';

interface AuditEventInsert {
  token_id?: string | null;
  organization_id: string;
  event_id: string;
  membership_id?: string | null;
  actor_user_id?: string | null;
  actor_role?: Role;
  event_type:
    | 'invite_generated'
    | 'invite_delivered'
    | 'invite_delivery_failed'
    | 'invite_accepted'
    | 'invite_expired'
    | 'invite_revoked'
    | 'membership_role_changed';
  payload?: Record<string, unknown>;
}

async function insertAuditEvents(supabase: ReturnType<typeof getSupabaseAdminClient>, rows: AuditEventInsert[]): Promise<void> {
  if (!supabase || !rows.length) {
    return;
  }

  const payload = rows.map((row) => ({
    token_id: row.token_id ?? null,
    organization_id: row.organization_id,
    event_id: row.event_id,
    membership_id: row.membership_id ?? null,
    actor_user_id: row.actor_user_id ?? null,
    actor_role: row.actor_role ?? null,
    event_type: row.event_type,
    payload: row.payload ?? {}
  }));

  const { error } = await supabase.from('invite_audit_events').insert(payload);

  if (error) {
    throw new Error(error.message);
  }
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ tokenId: string }> }
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

  const { tokenId } = await params;

  if (!tokenId) {
    return NextResponse.json({ error: 'missing_token_id' }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json({ error: 'invite_lifecycle_requires_supabase' }, { status: 503 });
  }

  const { data: tokenRow, error: tokenReadError } = await supabase
    .from('invite_tokens')
    .select('token_id,organization_id,event_id,membership_id,target_role,status,accepted_at')
    .eq('token_id', tokenId)
    .eq('event_id', session.eventId)
    .maybeSingle();

  if (tokenReadError) {
    return NextResponse.json({ error: 'invite_lookup_failed', details: tokenReadError.message }, { status: 500 });
  }

  if (!tokenRow) {
    return NextResponse.json({ error: 'invite_not_found' }, { status: 404 });
  }

  if (!canAssignRole(session.role, tokenRow.target_role as Role)) {
    return NextResponse.json({ error: 'forbidden_role_assignment' }, { status: 403 });
  }

  if (tokenRow.status === 'revoked') {
    return NextResponse.json({ source: 'supabase', status: 'revoked' }, { status: 200 });
  }

  const nowIso = new Date().toISOString();

  const { error: revokeError } = await supabase
    .from('invite_tokens')
    .update({
      status: 'revoked',
      revoked_at: nowIso,
      revoked_by_user_id: session.userId,
      updated_at: nowIso
    })
    .eq('token_id', tokenRow.token_id);

  if (revokeError) {
    return NextResponse.json({ error: 'invite_revoke_failed', details: revokeError.message }, { status: 500 });
  }

  let membershipDeactivated = false;

  if (tokenRow.accepted_at) {
    const { error: membershipDeactivateError } = await supabase
      .from('memberships')
      .update({ active: false, updated_at: nowIso })
      .eq('membership_id', tokenRow.membership_id);

    if (membershipDeactivateError) {
      return NextResponse.json({ error: 'membership_revoke_failed', details: membershipDeactivateError.message }, { status: 500 });
    }

    membershipDeactivated = true;
  }

  await insertAuditEvents(supabase, [
    {
      token_id: tokenRow.token_id,
      organization_id: tokenRow.organization_id,
      event_id: tokenRow.event_id,
      membership_id: tokenRow.membership_id,
      actor_user_id: session.userId,
      actor_role: session.role,
      event_type: 'invite_revoked',
      payload: {
        membershipDeactivated,
        acceptedPreviously: Boolean(tokenRow.accepted_at)
      }
    }
  ]);

  return NextResponse.json(
    {
      source: 'supabase',
      tokenId: tokenRow.token_id,
      status: 'revoked',
      membershipDeactivated
    },
    { status: 200 }
  );
}
