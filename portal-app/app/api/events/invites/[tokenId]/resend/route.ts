import { NextResponse } from 'next/server';

import { type Role } from '@/lib/auth';
import {
  canAssignRole,
  canManageInvites,
  computeInviteExpiryDate,
  generateInviteTokenValue,
  hashInviteToken,
  parseInviteExpiryHours
} from '@/lib/invite-lifecycle';
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
  request: Request,
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
    .select(
      'token_id,organization_id,event_id,membership_id,invitee_email,invitee_display_name,target_role,role_profile,status,expires_at'
    )
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

  if (tokenRow.status === 'accepted') {
    return NextResponse.json({ error: 'invite_already_accepted' }, { status: 409 });
  }

  if (tokenRow.status === 'revoked') {
    return NextResponse.json({ error: 'invite_already_revoked' }, { status: 409 });
  }

  const nowIso = new Date().toISOString();
  const maybeHours = (() => {
    try {
      const url = new URL(request.url);
      const fromQuery = url.searchParams.get('expiresInHours');
      return fromQuery ? Number(fromQuery) : undefined;
    } catch {
      return undefined;
    }
  })();

  const expiresAt = computeInviteExpiryDate(parseInviteExpiryHours(maybeHours)).toISOString();

  const { error: revokePreviousError } = await supabase
    .from('invite_tokens')
    .update({ status: 'revoked', revoked_at: nowIso, revoked_by_user_id: session.userId, updated_at: nowIso })
    .eq('token_id', tokenRow.token_id);

  if (revokePreviousError) {
    return NextResponse.json({ error: 'invite_revoke_failed', details: revokePreviousError.message }, { status: 500 });
  }

  const nextTokenValue = generateInviteTokenValue();
  const nextTokenHash = hashInviteToken(nextTokenValue);

  const { data: inserted, error: nextInsertError } = await supabase
    .from('invite_tokens')
    .insert({
      organization_id: tokenRow.organization_id,
      event_id: tokenRow.event_id,
      membership_id: tokenRow.membership_id,
      invitee_email: tokenRow.invitee_email,
      invitee_display_name: tokenRow.invitee_display_name,
      target_role: tokenRow.target_role,
      role_profile: tokenRow.role_profile,
      token_hash: nextTokenHash,
      status: 'generated',
      expires_at: expiresAt,
      created_by_user_id: session.userId,
      created_at: nowIso,
      updated_at: nowIso
    })
    .select('token_id')
    .maybeSingle();

  if (nextInsertError || !inserted) {
    return NextResponse.json(
      { error: 'invite_reissue_failed', details: nextInsertError?.message ?? 'invite_not_returned' },
      { status: 500 }
    );
  }

  const { error: deliveryUpdateError } = await supabase
    .from('invite_tokens')
    .update({
      status: 'delivered',
      delivery_channel: 'email',
      delivery_provider: 'application_simulated',
      delivery_reference: `sim_${inserted.token_id}`,
      delivered_at: nowIso,
      updated_at: nowIso
    })
    .eq('token_id', inserted.token_id);

  if (deliveryUpdateError) {
    await insertAuditEvents(supabase, [
      {
        token_id: inserted.token_id,
        organization_id: tokenRow.organization_id,
        event_id: tokenRow.event_id,
        membership_id: tokenRow.membership_id,
        actor_user_id: session.userId,
        actor_role: session.role,
        event_type: 'invite_delivery_failed',
        payload: { reason: deliveryUpdateError.message }
      }
    ]);

    return NextResponse.json({ error: 'invite_delivery_failed', details: deliveryUpdateError.message }, { status: 500 });
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
      payload: { reason: 'resend_replaced' }
    },
    {
      token_id: inserted.token_id,
      organization_id: tokenRow.organization_id,
      event_id: tokenRow.event_id,
      membership_id: tokenRow.membership_id,
      actor_user_id: session.userId,
      actor_role: session.role,
      event_type: 'invite_generated',
      payload: { reason: 'resend', expiresAt }
    },
    {
      token_id: inserted.token_id,
      organization_id: tokenRow.organization_id,
      event_id: tokenRow.event_id,
      membership_id: tokenRow.membership_id,
      actor_user_id: session.userId,
      actor_role: session.role,
      event_type: 'invite_delivered',
      payload: { channel: 'email', provider: 'application_simulated' }
    }
  ]);

  return NextResponse.json(
    {
      source: 'supabase',
      invite: {
        tokenId: inserted.token_id,
        inviteToken: nextTokenValue,
        inviteeEmail: tokenRow.invitee_email,
        targetRole: tokenRow.target_role,
        roleProfile: tokenRow.role_profile,
        expiresAt,
        status: 'delivered'
      }
    },
    { status: 200 }
  );
}
