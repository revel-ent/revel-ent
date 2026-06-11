import { isKnownRole } from '@/lib/auth';
import {
  deriveAcceptedUserId,
  hashInviteToken,
  inferDisplayNameFromEmail,
  isEventAccessExpired,
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

  const now = new Date();
  const nowIso = now.toISOString();

  // Access entitlement window: valid from acceptance until the wedding ends_on + grace period.
  // This governs both first-time acceptance and returning-user re-login below.
  const { data: eventAccessRow, error: eventAccessError } = await supabase
    .from('events')
    .select('ends_on')
    .eq('event_id', tokenRow.event_id)
    .maybeSingle();

  if (eventAccessError) {
    return { ok: false, error: { error: 'event_lookup_failed', details: eventAccessError.message, status: 500 } };
  }

  if (isEventAccessExpired(eventAccessRow?.ends_on ?? null, now)) {
    return { ok: false, error: { error: 'event_access_ended', status: 403 } };
  }

  if (tokenRow.status === 'revoked') {
    return { ok: false, error: { error: 'invite_revoked', status: 410 } };
  }

  // Returning-user re-login: an already-accepted token re-mints a session for the matching email,
  // as long as the entitlement window is open (checked above) and the membership is still active.
  // This is what lets people return after their short-lived session expires without a fresh code.
  if (tokenRow.status === 'accepted') {
    const { data: membershipRow, error: membershipReadError } = await supabase
      .from('memberships')
      .select('active')
      .eq('membership_id', tokenRow.membership_id)
      .eq('event_id', tokenRow.event_id)
      .maybeSingle();

    if (membershipReadError) {
      return { ok: false, error: { error: 'membership_lookup_failed', details: membershipReadError.message, status: 500 } };
    }

    if (!membershipRow || membershipRow.active !== true) {
      return { ok: false, error: { error: 'invite_revoked', status: 410 } };
    }

    const returningUserId = deriveAcceptedUserId(email);
    const returningDisplayName = tokenRow.invitee_display_name || inferDisplayNameFromEmail(email);

    const returningSessionToken = await signSessionToken({
      userId: returningUserId,
      email,
      displayName: returningDisplayName,
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
        sessionToken: returningSessionToken
      }
    };
  }

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
        acceptedAttemptAt: nowIso,
        canonicalEvent: 'invite_expired'
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
      acceptedAt: nowIso,
      canonicalEvent: 'invite_accepted'
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
