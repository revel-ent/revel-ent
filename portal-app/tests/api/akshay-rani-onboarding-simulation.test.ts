import { beforeEach, describe, expect, it, vi } from 'vitest';

import { canAccessRoute, type Role } from '@/lib/auth';

const getSessionMock = vi.fn();
const getSupabaseAdminClientMock = vi.fn();
const signSessionTokenMock = vi.fn();

vi.mock('@/lib/session', () => ({
  getSession: getSessionMock
}));

vi.mock('@/lib/supabase-server', () => ({
  getSupabaseAdminClient: getSupabaseAdminClientMock
}));

vi.mock('@/lib/session-token', async () => {
  const actual = await vi.importActual('@/lib/session-token');
  return {
    ...actual,
    signSessionToken: signSessionTokenMock
  };
});

type EventRow = {
  event_id: string;
  organization_id: string;
};

type MembershipRow = {
  membership_id: string;
  user_id: string;
  event_id: string;
  role: string;
  invited_by: string | null;
  invited_at: string | null;
  accepted_at: string | null;
  active: boolean;
  updated_at: string;
};

type InviteTokenRow = {
  token_id: string;
  organization_id: string;
  event_id: string;
  membership_id: string;
  invitee_email: string;
  invitee_display_name: string | null;
  target_role: string;
  role_profile: string;
  token_hash: string;
  status: 'generated' | 'delivered' | 'accepted' | 'expired' | 'revoked';
  delivery_channel: string;
  delivery_provider: string | null;
  delivery_reference: string | null;
  delivered_at: string | null;
  expires_at: string;
  accepted_at: string | null;
  accepted_by_user_id: string | null;
  revoked_at: string | null;
  revoked_by_user_id: string | null;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
};

type InviteAuditRow = {
  token_id: string | null;
  organization_id: string;
  event_id: string;
  membership_id: string | null;
  actor_user_id: string | null;
  actor_role: string | null;
  event_type: string;
  payload: Record<string, unknown>;
};

type Filter = {
  kind: 'eq' | 'neq';
  column: string;
  value: unknown;
};

function applyFilters<T extends Record<string, unknown>>(rows: T[], filters: Filter[]): T[] {
  return rows.filter((row) =>
    filters.every((filter) => {
      if (filter.kind === 'eq') {
        return row[filter.column] === filter.value;
      }

      return row[filter.column] !== filter.value;
    })
  );
}

function makeSelectMaybeSingle<T extends Record<string, unknown>>(rows: T[]) {
  const filters: Filter[] = [];

  const builder = {
    eq(column: string, value: unknown) {
      filters.push({ kind: 'eq', column, value });
      return builder;
    },
    maybeSingle: async () => {
      const row = applyFilters(rows, filters)[0] ?? null;
      return { data: row, error: null };
    }
  };

  return builder;
}

function makeUpdateBuilder<T extends Record<string, unknown>>(
  rows: T[],
  patch: Partial<T>,
  rowResult: (row: T) => Record<string, unknown>
) {
  const filters: Filter[] = [];

  const apply = () => {
    const matched = applyFilters(rows, filters);
    matched.forEach((row) => Object.assign(row, patch));
    return matched;
  };

  const builder = {
    eq(column: string, value: unknown) {
      filters.push({ kind: 'eq', column, value });
      return builder;
    },
    neq(column: string, value: unknown) {
      filters.push({ kind: 'neq', column, value });
      return builder;
    },
    select() {
      return {
        maybeSingle: async () => {
          const row = apply()[0] ?? null;
          return { data: row ? rowResult(row) : null, error: null };
        }
      };
    },
    then(resolve: (value: { data: null; error: null }) => unknown) {
      apply();
      return Promise.resolve({ data: null, error: null }).then(resolve);
    }
  };

  return builder;
}

function createInMemorySupabase(state: {
  events: EventRow[];
  memberships: MembershipRow[];
  inviteTokens: InviteTokenRow[];
  inviteAuditEvents: InviteAuditRow[];
}) {
  let membershipCounter = 100;
  let tokenCounter = 500;

  return {
    from(table: string) {
      if (table === 'events') {
        return {
          select: () => makeSelectMaybeSingle(state.events)
        };
      }

      if (table === 'memberships') {
        return {
          upsert: (row: Record<string, unknown>) => ({
            select: () => ({
              maybeSingle: async () => {
                const existing = state.memberships.find(
                  (m) => m.user_id === row.user_id && m.event_id === row.event_id && m.role === row.role
                );

                if (existing) {
                  Object.assign(existing, row);
                  return { data: { membership_id: existing.membership_id }, error: null };
                }

                membershipCounter += 1;
                const membership: MembershipRow = {
                  membership_id: `m-${membershipCounter}`,
                  user_id: String(row.user_id),
                  event_id: String(row.event_id),
                  role: String(row.role),
                  invited_by: (row.invited_by as string) ?? null,
                  invited_at: (row.invited_at as string) ?? null,
                  accepted_at: (row.accepted_at as string) ?? null,
                  active: Boolean(row.active),
                  updated_at: String(row.updated_at)
                };

                state.memberships.push(membership);
                return { data: { membership_id: membership.membership_id }, error: null };
              }
            })
          }),
          update: (patch: Record<string, unknown>) =>
            makeUpdateBuilder(state.memberships, patch, (row) => ({
              membership_id: row.membership_id,
              event_id: row.event_id,
              role: row.role,
              user_id: row.user_id
            })),
          select: () => makeSelectMaybeSingle(state.memberships)
        };
      }

      if (table === 'invite_tokens') {
        return {
          insert: (row: Record<string, unknown>) => ({
            select: () => ({
              maybeSingle: async () => {
                tokenCounter += 1;
                const token: InviteTokenRow = {
                  token_id: `tok-${tokenCounter}`,
                  organization_id: String(row.organization_id),
                  event_id: String(row.event_id),
                  membership_id: String(row.membership_id),
                  invitee_email: String(row.invitee_email),
                  invitee_display_name: (row.invitee_display_name as string) ?? null,
                  target_role: String(row.target_role),
                  role_profile: String(row.role_profile ?? 'general'),
                  token_hash: String(row.token_hash),
                  status: 'generated',
                  delivery_channel: 'email',
                  delivery_provider: null,
                  delivery_reference: null,
                  delivered_at: null,
                  expires_at: String(row.expires_at),
                  accepted_at: null,
                  accepted_by_user_id: null,
                  revoked_at: null,
                  revoked_by_user_id: null,
                  created_by_user_id: String(row.created_by_user_id),
                  created_at: String(row.created_at),
                  updated_at: String(row.updated_at)
                };

                state.inviteTokens.push(token);
                return { data: { token_id: token.token_id }, error: null };
              }
            })
          }),
          update: (patch: Record<string, unknown>) =>
            makeUpdateBuilder(state.inviteTokens, patch, (row) => ({
              token_id: row.token_id,
              organization_id: row.organization_id,
              event_id: row.event_id,
              membership_id: row.membership_id,
              invitee_email: row.invitee_email,
              invitee_display_name: row.invitee_display_name,
              target_role: row.target_role,
              role_profile: row.role_profile,
              status: row.status,
              accepted_at: row.accepted_at,
              expires_at: row.expires_at
            })),
          select: () => makeSelectMaybeSingle(state.inviteTokens)
        };
      }

      if (table === 'invite_audit_events') {
        return {
          insert: async (rows: Record<string, unknown> | Array<Record<string, unknown>>) => {
            const list = Array.isArray(rows) ? rows : [rows];
            list.forEach((row) => {
              state.inviteAuditEvents.push({
                token_id: (row.token_id as string) ?? null,
                organization_id: String(row.organization_id),
                event_id: String(row.event_id),
                membership_id: (row.membership_id as string) ?? null,
                actor_user_id: (row.actor_user_id as string) ?? null,
                actor_role: (row.actor_role as string) ?? null,
                event_type: String(row.event_type),
                payload: (row.payload as Record<string, unknown>) ?? {}
              });
            });

            return { error: null };
          }
        };
      }

      throw new Error(`Unsupported table in test supabase mock: ${table}`);
    }
  };
}

describe('Akshay & Rani onboarding simulation', () => {
  beforeEach(() => {
    vi.resetModules();
    getSessionMock.mockReset();
    getSupabaseAdminClientMock.mockReset();
    signSessionTokenMock.mockReset();
    signSessionTokenMock.mockResolvedValue('simulated-session-token');
  });

  it('validates full invite lifecycle for all required stakeholders', async () => {
    const eventId = 'b3c9e1f2-4a7d-4e8b-a1c2-d5e6f7a8b9c0';
    const organizationId = 'org-revel-ent';

    const state = {
      events: [{ event_id: eventId, organization_id: organizationId }],
      memberships: [] as MembershipRow[],
      inviteTokens: [] as InviteTokenRow[],
      inviteAuditEvents: [] as InviteAuditRow[]
    };

    getSupabaseAdminClientMock.mockReturnValue(createInMemorySupabase(state));

    let currentSession = {
      userId: 'usr-admin-jigar',
      email: 'jigar@revel-ent.com',
      displayName: 'Jigar',
      role: 'admin' as Role,
      organizationId,
      eventId
    };

    getSessionMock.mockImplementation(async () => currentSession);

    const { POST: createInvite } = await import('@/app/api/events/invites/route');
    const { POST: acceptInvite } = await import('@/app/api/invites/accept/route');

    const stakeholders = [
      { name: 'Akshay', email: 'akshay.rani1128@gmail.com', role: 'couple', profile: 'general', workspace: '/portal/couple', by: 'admin' },
      { name: 'Rani', email: 'rani.patel@example.com', role: 'couple', profile: 'general', workspace: '/portal/couple', by: 'akshay' },
      { name: 'Anokhi', email: 'anokhi.planner@example.com', role: 'planner', profile: 'general', workspace: '/portal/planner', by: 'akshay' },
      { name: 'Venue Coordinator', email: 'venue.coordinator@example.com', role: 'venue_coordinator', profile: 'general', workspace: '/portal/venue', by: 'anokhi' },
      { name: 'Decorator', email: 'decorator@example.com', role: 'vendor', profile: 'decorator', workspace: '/portal/vendor', by: 'anokhi' },
      { name: 'Photographer', email: 'photographer@example.com', role: 'vendor', profile: 'general', workspace: '/portal/vendor', by: 'anokhi' },
      { name: 'Videographer', email: 'videographer@example.com', role: 'vendor', profile: 'general', workspace: '/portal/vendor', by: 'anokhi' },
      { name: 'Caterer', email: 'caterer@example.com', role: 'vendor', profile: 'general', workspace: '/portal/vendor', by: 'anokhi' },
      { name: 'DJ/MC', email: 'djmc@example.com', role: 'vendor', profile: 'dj_mc', workspace: '/portal/vendor', by: 'anokhi' },
      { name: 'Production', email: 'production@example.com', role: 'vendor', profile: 'production', workspace: '/portal/vendor', by: 'anokhi' }
    ] as const;

    const report: Array<{ name: string; tokenId: string; membershipId: string }> = [];

    for (const stakeholder of stakeholders) {
      if (stakeholder.by === 'admin') {
        currentSession = {
          userId: 'usr-admin-jigar',
          email: 'jigar@revel-ent.com',
          displayName: 'Jigar',
          role: 'admin',
          organizationId,
          eventId
        };
      } else if (stakeholder.by === 'akshay') {
        currentSession = {
          userId: 'usr-akshay-couple',
          email: 'akshay.rani1128@gmail.com',
          displayName: 'Akshay',
          role: 'couple',
          organizationId,
          eventId
        };
      } else {
        currentSession = {
          userId: 'usr-anokhi-planner',
          email: 'anokhi.planner@example.com',
          displayName: 'Anokhi',
          role: 'planner',
          organizationId,
          eventId
        };
      }

      const createResponse = await createInvite(
        new Request('http://localhost/api/events/invites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: stakeholder.email,
            displayName: stakeholder.name,
            role: stakeholder.role,
            roleProfile: stakeholder.profile,
            expiresInHours: 72
          })
        })
      );

      expect(createResponse.status).toBe(201);
      const createPayload = await createResponse.json();

      const acceptResponse = await acceptInvite(
        new Request('http://localhost/api/invites/accept', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: stakeholder.email,
            inviteToken: createPayload.invite.inviteToken,
            next: '/portal'
          })
        })
      );

      expect(acceptResponse.status).toBe(200);
      const acceptPayload = await acceptResponse.json();

      const tokenRow = state.inviteTokens.find((row) => row.token_id === createPayload.invite.tokenId);
      const membershipRow = state.memberships.find((row) => row.membership_id === createPayload.invite.membershipId);
      const audits = state.inviteAuditEvents.filter((row) => row.token_id === createPayload.invite.tokenId);

      expect(Boolean(tokenRow)).toBe(true);
      expect(tokenRow?.status).toBe('accepted');
      expect(Boolean(tokenRow?.delivered_at)).toBe(true);
      expect(Boolean(tokenRow?.accepted_at)).toBe(true);

      expect(Boolean(membershipRow)).toBe(true);
      expect(membershipRow?.active).toBe(true);
      expect(Boolean(membershipRow?.accepted_at)).toBe(true);
      expect(membershipRow?.role).toBe(stakeholder.role);

      expect(acceptPayload.accepted).toBe(true);
      expect(acceptPayload.organizationId).toBe(organizationId);
      expect(acceptPayload.eventId).toBe(eventId);
      expect(acceptPayload.role).toBe(stakeholder.role);

      expect(canAccessRoute(stakeholder.role, stakeholder.workspace)).toBe(true);

      expect(audits.some((row) => row.event_type === 'invite_generated')).toBe(true);
      expect(audits.some((row) => row.event_type === 'invite_delivered')).toBe(true);
      expect(audits.some((row) => row.event_type === 'invite_accepted')).toBe(true);

      report.push({
        name: stakeholder.name,
        tokenId: createPayload.invite.tokenId,
        membershipId: createPayload.invite.membershipId
      });

      if (stakeholder.name === 'Akshay') {
        currentSession = {
          userId: 'usr-akshay-couple',
          email: 'akshay.rani1128@gmail.com',
          displayName: 'Akshay',
          role: 'couple',
          organizationId,
          eventId
        };
      }

      if (stakeholder.name === 'Anokhi') {
        currentSession = {
          userId: 'usr-anokhi-planner',
          email: 'anokhi.planner@example.com',
          displayName: 'Anokhi',
          role: 'planner',
          organizationId,
          eventId
        };
      }
    }

    expect(report).toHaveLength(10);

    const roleProfiles = state.inviteTokens.filter((row) => row.target_role === 'vendor').map((row) => row.role_profile);
    expect(roleProfiles).toContain('decorator');
    expect(roleProfiles).toContain('dj_mc');
    expect(roleProfiles).toContain('production');
  });
});
