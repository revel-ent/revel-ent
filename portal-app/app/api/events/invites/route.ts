import { NextResponse } from 'next/server';

import { type Role } from '@/lib/auth';
import {
  canAssignRole,
  canManageInvites,
  computeInviteExpiryDate,
  deriveAcceptedUserId,
  generateInviteTokenValue,
  hashInviteToken,
  inferDisplayNameFromEmail,
  normalizeEmail,
  parseInviteExpiryHours,
  parseInviteRole,
  parseInviteRoleProfile
} from '@/lib/invite-lifecycle';
import { buildInviteLink, deliverInviteEmail } from '@/lib/invite-delivery';
import { getSession } from '@/lib/session';
import { getSupabaseAdminClient } from '@/lib/supabase-server';
import { resolveSessionUserUuid } from '@/lib/user-identity';

interface CreateInviteBody {
  email?: unknown;
  displayName?: unknown;
  role?: unknown;
  roleProfile?: unknown;
  expiresInHours?: unknown;
}

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

export async function GET() {
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

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json({ error: 'invite_lifecycle_requires_supabase' }, { status: 503 });
  }

  const { data, error } = await supabase
    .from('invite_tokens')
    .select(
      'token_id,invitee_email,invitee_display_name,target_role,role_profile,status,delivery_channel,delivery_provider,delivered_at,expires_at,accepted_at,revoked_at,created_at,membership_id'
    )
    .eq('event_id', session.eventId)
    .order('created_at', { ascending: false })
    .limit(250);

  if (error) {
    return NextResponse.json({ error: 'invite_list_failed', details: error.message }, { status: 500 });
  }

  const now = Date.now();
  const invites = (data ?? []).map((invite) => {
    const expiresAtMs = new Date(invite.expires_at).getTime();
    const derivedStatus =
      (invite.status === 'generated' || invite.status === 'delivered') && Number.isFinite(expiresAtMs) && now > expiresAtMs
        ? 'expired'
        : invite.status;

    return {
      tokenId: invite.token_id,
      inviteeEmail: invite.invitee_email,
      inviteeDisplayName: invite.invitee_display_name,
      targetRole: invite.target_role,
      roleProfile: invite.role_profile,
      status: derivedStatus,
      deliveryChannel: invite.delivery_channel,
      deliveryProvider: invite.delivery_provider,
      deliveredAt: invite.delivered_at,
      expiresAt: invite.expires_at,
      acceptedAt: invite.accepted_at,
      revokedAt: invite.revoked_at,
      createdAt: invite.created_at,
      membershipId: invite.membership_id
    };
  });

  return NextResponse.json({ source: 'supabase', eventId: session.eventId, invites }, { status: 200 });
}

export async function POST(request: Request) {
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

  let body: CreateInviteBody;

  try {
    body = (await request.json()) as CreateInviteBody;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const inviteeEmail = normalizeEmail(String(body.email ?? ''));
  const targetRole = parseInviteRole(body.role);
  const roleProfile = parseInviteRoleProfile(body.roleProfile);
  const expiresInHours = parseInviteExpiryHours(body.expiresInHours);

  if (!inviteeEmail || !inviteeEmail.includes('@')) {
    return NextResponse.json({ error: 'invalid_email' }, { status: 400 });
  }

  if (!targetRole) {
    return NextResponse.json({ error: 'invalid_role' }, { status: 400 });
  }

  if (!canAssignRole(session.role, targetRole)) {
    return NextResponse.json({ error: 'forbidden_role_assignment' }, { status: 403 });
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json({ error: 'invite_lifecycle_requires_supabase' }, { status: 503 });
  }

  const { data: eventRow, error: eventError } = await supabase
    .from('events')
    .select('event_id,organization_id,event_label')
    .eq('event_id', session.eventId)
    .maybeSingle();

  if (eventError) {
    return NextResponse.json({ error: 'event_lookup_failed', details: eventError.message }, { status: 500 });
  }

  if (!eventRow) {
    return NextResponse.json({ error: 'event_not_found' }, { status: 404 });
  }

  const organizationId = eventRow.organization_id as string;
  const nowIso = new Date().toISOString();
  const actorUserUuid = resolveSessionUserUuid({ userId: session.userId, email: session.email });
  const inviteeUserId = deriveAcceptedUserId(inviteeEmail);
  const displayName =
    typeof body.displayName === 'string' && body.displayName.trim().length
      ? body.displayName.trim()
      : inferDisplayNameFromEmail(inviteeEmail);

  const { data: membershipUpsert, error: membershipUpsertError } = await supabase
    .from('memberships')
    .upsert(
      {
        user_id: inviteeUserId,
        event_id: session.eventId,
        role: targetRole,
        invited_by: actorUserUuid,
        invited_at: nowIso,
        accepted_at: null,
        active: true,
        updated_at: nowIso
      },
      { onConflict: 'user_id,event_id,role' }
    )
    .select('membership_id')
    .maybeSingle();

  if (membershipUpsertError || !membershipUpsert) {
    return NextResponse.json(
      { error: 'membership_upsert_failed', details: membershipUpsertError?.message ?? 'membership_not_returned' },
      { status: 500 }
    );
  }

  const { error: deactivateOtherRolesError } = await supabase
    .from('memberships')
    .update({ active: false, accepted_at: null, updated_at: nowIso })
    .eq('event_id', session.eventId)
    .eq('user_id', inviteeUserId)
    .neq('role', targetRole)
    .eq('active', true);

  if (deactivateOtherRolesError) {
    return NextResponse.json({ error: 'membership_role_cleanup_failed', details: deactivateOtherRolesError.message }, { status: 500 });
  }

  const inviteTokenValue = generateInviteTokenValue();
  const inviteTokenHash = hashInviteToken(inviteTokenValue);
  const expiresAt = computeInviteExpiryDate(expiresInHours).toISOString();

  const { data: inviteRow, error: inviteInsertError } = await supabase
    .from('invite_tokens')
    .insert({
      organization_id: organizationId,
      event_id: session.eventId,
      membership_id: membershipUpsert.membership_id,
      invitee_email: inviteeEmail,
      invitee_display_name: displayName,
      target_role: targetRole,
      role_profile: roleProfile,
      token_hash: inviteTokenHash,
      status: 'generated',
      expires_at: expiresAt,
      created_by_user_id: session.userId,
      created_at: nowIso,
      updated_at: nowIso
    })
    .select('token_id')
    .maybeSingle();

  if (inviteInsertError || !inviteRow) {
    return NextResponse.json(
      { error: 'invite_insert_failed', details: inviteInsertError?.message ?? 'invite_not_returned' },
      { status: 500 }
    );
  }

  const inviteLink = buildInviteLink({
    origin: request.url,
    email: inviteeEmail,
    inviteToken: inviteTokenValue,
    nextPath: '/portal'
  });

  const delivery = await deliverInviteEmail({
    email: inviteeEmail,
    displayName: displayName,
    role: targetRole,
    eventLabel: eventRow.event_label as string | undefined,
    inviterDisplayName: session.displayName,
    inviteToken: inviteTokenValue,
    inviteLink,
    expiresAtIso: expiresAt
  });

  const { error: deliveryUpdateError } = await supabase
    .from('invite_tokens')
    .update({
      status: delivery.delivered ? 'delivered' : 'generated',
      delivery_channel: 'email',
      delivery_provider: delivery.provider,
      delivery_reference: delivery.reference ?? null,
      delivered_at: delivery.delivered ? nowIso : null,
      updated_at: nowIso
    })
    .eq('token_id', inviteRow.token_id);

  if (deliveryUpdateError) {
    await insertAuditEvents(supabase, [
      {
        token_id: inviteRow.token_id,
        organization_id: organizationId,
        event_id: session.eventId,
        membership_id: membershipUpsert.membership_id,
        actor_user_id: session.userId,
        actor_role: session.role,
        event_type: 'invite_delivery_failed',
        payload: { reason: deliveryUpdateError.message, canonicalEvent: 'invite_delivery_failed' }
      }
    ]);

    return NextResponse.json({ error: 'invite_delivery_failed', details: deliveryUpdateError.message }, { status: 500 });
  }

  await insertAuditEvents(supabase, [
    {
      token_id: inviteRow.token_id,
      organization_id: organizationId,
      event_id: session.eventId,
      membership_id: membershipUpsert.membership_id,
      actor_user_id: session.userId,
      actor_role: session.role,
      event_type: 'invite_generated',
      payload: {
        inviteeEmail,
        targetRole,
        roleProfile,
        expiresAt,
        canonicalEvent: 'invite_created'
      }
    },
    ...(delivery.delivered
      ? [
          {
            token_id: inviteRow.token_id,
            organization_id: organizationId,
            event_id: session.eventId,
            membership_id: membershipUpsert.membership_id,
            actor_user_id: session.userId,
            actor_role: session.role,
            event_type: 'invite_delivered' as const,
            payload: {
              channel: 'email',
              provider: delivery.provider,
              reference: delivery.reference ?? null,
              canonicalEvent: 'invite_sent'
            }
          }
        ]
      : [
          {
            token_id: inviteRow.token_id,
            organization_id: organizationId,
            event_id: session.eventId,
            membership_id: membershipUpsert.membership_id,
            actor_user_id: session.userId,
            actor_role: session.role,
            event_type: 'invite_delivery_failed' as const,
            payload: {
              provider: delivery.provider,
              reason: delivery.error ?? 'delivery_failed',
              canonicalEvent: 'invite_delivery_failed'
            }
          }
        ])
  ]);

  return NextResponse.json(
    {
      source: 'supabase',
      invite: {
        tokenId: inviteRow.token_id,
        inviteToken: inviteTokenValue,
        inviteLink,
        inviteeEmail,
        inviteeDisplayName: displayName,
        targetRole,
        roleProfile,
        expiresAt,
        membershipId: membershipUpsert.membership_id,
        status: delivery.delivered ? 'delivered' : 'generated'
      },
      delivery
    },
    { status: 201 }
  );
}
