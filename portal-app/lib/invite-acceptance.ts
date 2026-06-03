import { isKnownRole } from '@/lib/auth';
import {
  deriveAcceptedUserId,
  hashInviteToken,
  inferDisplayNameFromEmail,
  normalizeEmail,
  sanitizeNextPath
} from '@/lib/invite-lifecycle';
import { signSessionToken } from '@/lib/session-token';
import { getSupabaseAdminClient } from '@/lib/supabase-server';

interface AcceptInviteInput {
  email: string;
  inviteToken: string;
  next?: unknown;
}

export interface AcceptInviteSuccess {
  source: 'supabase';
  accepted: true;
  eventId: string;
  organizationId: string;
  role: string;
  nextPath: string;
  sessionToken: string;
}

export interface AcceptInviteFailure {
  error: string;
  details?: string;
  status: number;
}

export type AcceptInviteResult =
  | { ok: true; value: AcceptInviteSuccess }
  | { ok: false; error: AcceptInviteFailure };

export async function acceptInviteWithToken(input: AcceptInviteInput): Promise<AcceptInviteResult> {
  const email = normalizeEmail(input.email || '');
  const inviteToken = (input.inviteToken || '').trim();
  const nextPath = sanitizeNextPath(input.next);

  if (!email || !email.includes('@') || !inviteToken) {
    return { ok: false, error: { error: 'missing_fields', status: 400 } };
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return { ok: false, error: { error: 'invite_lifecycle_requires_supabase', status: 503 } };
  }

  const tokenHash = hashInviteToken(inviteToken);

  const { data: tokenRow, error: tokenReadError } = await supabase
    .from('invite_tokens')
    .select(
      'token_id,organization_id,event_id,membership_id,invitee_email,invitee_display_name,target_role,status,expires_at,accepted_at'
    )
    .eq('token_hash', tokenHash)
    .maybeSingle();

  if (tokenReadError) {
    return { ok: false, error: { error: 'invite_lookup_failed', details: tokenReadError.message, status: 500 } };
  }

  if (!tokenRow) {
    return { ok: false, error: { error: 'invalid_invite_token', status: 404 } };
  }

  if (normalizeEmail(tokenRow.invitee_email) !== email) {
    return { ok: false, error: { error: 'invite_email_mismatch', status: 403 } };
  }

  if (!isKnownRole(tokenRow.target_role)) {
    return { ok: false, error: { error: 'invalid_invite_role', status: 500 } };
  }

  if (tokenRow.status === 'revoked') {
    return { ok: false, error: { error: 'invite_revoked', status: 410 } };
  }

  if (tokenRow.status === 'accepted') {
    return { ok: false, error: { error: 'invite_already_accepted', status: 409 } };
  }

  const now = new Date();
  const nowIso = now.toISOString();
  const expiresAt = new Date(tokenRow.expires_at);

  if (tokenRow.status === 'expired' || now.getTime() > expiresAt.getTime()) {
    const { error: expireUpdateError } = await supabase
      .from('invite_tokens')
      .update({ status: 'expired', updated_at: nowIso })
      .eq('token_id', tokenRow.token_id);

    if (expireUpdateError) {
      return { ok: false, error: { error: 'invite_expire_failed', details: expireUpdateError.message, status: 500 } };
    }

    const { error: expireAuditError } = await supabase.from('invite_audit_events').insert({
      token_id: tokenRow.token_id,
      organization_id: tokenRow.organization_id,
      event_id: tokenRow.event_id,
      membership_id: tokenRow.membership_id,
      actor_user_id: null,
      actor_role: null,
      event_type: 'invite_expired',
      payload: {
        acceptedAttemptAt: nowIso
      }
    });

    if (expireAuditError) {
      return { ok: false, error: { error: 'invite_audit_write_failed', details: expireAuditError.message, status: 500 } };
    }

    return { ok: false, error: { error: 'invite_expired', status: 410 } };
  }

  const acceptedUserId = deriveAcceptedUserId(email);

  const { error: membershipUpdateError } = await supabase
    .from('memberships')
    .update({
      user_id: acceptedUserId,
      role: tokenRow.target_role,
      accepted_at: nowIso,
      active: true,
      updated_at: nowIso
    })
    .eq('membership_id', tokenRow.membership_id)
    .eq('event_id', tokenRow.event_id);

  if (membershipUpdateError) {
    return { ok: false, error: { error: 'membership_accept_failed', details: membershipUpdateError.message, status: 500 } };
  }

  const { error: tokenUpdateError } = await supabase
    .from('invite_tokens')
    .update({
      status: 'accepted',
      accepted_at: nowIso,
      accepted_by_user_id: acceptedUserId,
      updated_at: nowIso
    })
    .eq('token_id', tokenRow.token_id);

  if (tokenUpdateError) {
    return { ok: false, error: { error: 'invite_accept_failed', details: tokenUpdateError.message, status: 500 } };
  }

  const { error: auditInsertError } = await supabase.from('invite_audit_events').insert({
    token_id: tokenRow.token_id,
    organization_id: tokenRow.organization_id,
    event_id: tokenRow.event_id,
    membership_id: tokenRow.membership_id,
    actor_user_id: acceptedUserId,
    actor_role: tokenRow.target_role,
    event_type: 'invite_accepted',
    payload: {
      inviteeEmail: email,
      acceptedAt: nowIso
    }
  });

  if (auditInsertError) {
    return { ok: false, error: { error: 'invite_audit_write_failed', details: auditInsertError.message, status: 500 } };
  }

  const displayName = tokenRow.invitee_display_name || inferDisplayNameFromEmail(email);

  const sessionToken = await signSessionToken({
    userId: acceptedUserId,
    email,
    displayName,
    role: tokenRow.target_role,
    organizationId: tokenRow.organization_id,
    eventId: tokenRow.event_id,
    lastActiveEventId: tokenRow.event_id
  });

  return {
    ok: true,
    value: {
      source: 'supabase',
      accepted: true,
      eventId: tokenRow.event_id,
      organizationId: tokenRow.organization_id,
      role: tokenRow.target_role,
      nextPath,
      sessionToken
    }
  };
}
