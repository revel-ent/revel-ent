import { createHash, randomBytes } from 'crypto';

import { isKnownRole, type Role } from '@/lib/auth';
import { resolveSessionUserUuid } from '@/lib/user-identity';

export const INVITE_TOKEN_STATUSES = ['generated', 'delivered', 'accepted', 'expired', 'revoked'] as const;
export type InviteTokenStatus = (typeof INVITE_TOKEN_STATUSES)[number];

export const INVITE_AUDIT_EVENT_TYPES = [
  'invite_generated',
  'invite_delivered',
  'invite_delivery_failed',
  'invite_accepted',
  'invite_expired',
  'invite_revoked',
  'membership_role_changed'
] as const;

export type InviteAuditEventType = (typeof INVITE_AUDIT_EVENT_TYPES)[number];

export type InviteRoleProfile = 'general' | 'decorator' | 'dj_mc' | 'production';

const ALLOWED_INVITE_MANAGER_ROLES: ReadonlySet<Role> = new Set(['admin', 'planner', 'couple']);
const ALLOWED_ROLE_PROFILES: ReadonlySet<InviteRoleProfile> = new Set(['general', 'decorator', 'dj_mc', 'production']);

export function normalizeEmail(input: string): string {
  return input.trim().toLowerCase();
}

export function canManageInvites(role: Role): boolean {
  return ALLOWED_INVITE_MANAGER_ROLES.has(role);
}

export function canAssignRole(actorRole: Role, targetRole: Role): boolean {
  if (actorRole === 'admin') {
    return true;
  }

  if ((actorRole === 'planner' || actorRole === 'couple') && targetRole === 'admin') {
    return false;
  }

  return canManageInvites(actorRole);
}

export function canChangeRole(actorRole: Role, currentRole: Role, nextRole: Role): boolean {
  if (actorRole === 'admin') {
    return true;
  }

  if (!canManageInvites(actorRole)) {
    return false;
  }

  if (actorRole === 'planner' || actorRole === 'couple') {
    return currentRole !== 'admin' && nextRole !== 'admin';
  }

  return false;
}

export function parseInviteRoleProfile(value: unknown): InviteRoleProfile {
  if (typeof value !== 'string') {
    return 'general';
  }

  const normalized = value.trim().toLowerCase() as InviteRoleProfile;
  if (!ALLOWED_ROLE_PROFILES.has(normalized)) {
    return 'general';
  }

  return normalized;
}

export function parseInviteRole(value: unknown): Role | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  return isKnownRole(normalized) ? normalized : null;
}

export function parseInviteExpiryHours(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 168;
  }

  const bounded = Math.floor(value);
  if (bounded < 1) {
    return 1;
  }

  if (bounded > 336) {
    return 336;
  }

  return bounded;
}

export function computeInviteExpiryDate(hours: number): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

export function generateInviteTokenValue(): string {
  return randomBytes(24).toString('hex');
}

export function hashInviteToken(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function deriveInviteeUserId(email: string): string {
  return resolveSessionUserUuid({
    userId: `invite:${normalizeEmail(email)}`,
    email: normalizeEmail(email)
  });
}

export function deriveAcceptedUserId(email: string): string {
  return resolveSessionUserUuid({
    userId: `accepted:${normalizeEmail(email)}`,
    email: normalizeEmail(email)
  });
}

export function isInviteExpired(status: InviteTokenStatus, expiresAt: string | Date): boolean {
  if (status === 'accepted' || status === 'revoked' || status === 'expired') {
    return false;
  }

  const expiryTime = expiresAt instanceof Date ? expiresAt.getTime() : new Date(expiresAt).getTime();
  return Number.isFinite(expiryTime) && Date.now() > expiryTime;
}

export function sanitizeNextPath(input: unknown): string {
  if (typeof input !== 'string') {
    return '/portal';
  }

  const trimmed = input.trim();
  return trimmed.startsWith('/portal') ? trimmed : '/portal';
}

export function inferDisplayNameFromEmail(email: string): string {
  const local = normalizeEmail(email).split('@')[0] || 'Atlas User';
  const cleaned = local.replace(/[._-]+/g, ' ').trim();

  if (!cleaned) {
    return 'Atlas User';
  }

  return cleaned
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
