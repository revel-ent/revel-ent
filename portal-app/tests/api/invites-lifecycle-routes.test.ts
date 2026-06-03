import { beforeEach, describe, expect, it, vi } from 'vitest';

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

describe('invite lifecycle routes', () => {
  beforeEach(() => {
    vi.resetModules();
    getSessionMock.mockReset();
    getSupabaseAdminClientMock.mockReset();
    signSessionTokenMock.mockReset();

    getSessionMock.mockResolvedValue({
      userId: 'usr-planner-maulin',
      email: 'maulin@revel-ent.com',
      displayName: 'MC Maulin',
      role: 'planner',
      organizationId: 'org-revel-ent',
      eventId: 'evt-revel-1'
    });
  });

  it('create invite returns 401 when session missing', async () => {
    getSessionMock.mockResolvedValue(null);
    const { POST } = await import('@/app/api/events/invites/route');

    const response = await POST(
      new Request('http://localhost/api/events/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', role: 'vendor' })
      })
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' });
  });

  it('create invite blocks planner assigning admin role', async () => {
    const { POST } = await import('@/app/api/events/invites/route');

    const response = await POST(
      new Request('http://localhost/api/events/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin2@example.com', role: 'admin' })
      })
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: 'forbidden_role_assignment' });
  });

  it('accept invite validates missing fields', async () => {
    const { POST } = await import('@/app/api/invites/accept/route');

    const response = await POST(
      new Request('http://localhost/api/invites/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: '' })
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'missing_fields' });
  });

  it('revoke invite returns 404 when token is not found', async () => {
    getSupabaseAdminClientMock.mockReturnValue({
      from: (table: string) => {
        if (table === 'invite_tokens') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: async () => ({ data: null, error: null })
                })
              })
            })
          };
        }

        return { from: () => null };
      }
    });

    const { POST } = await import('@/app/api/events/invites/[tokenId]/revoke/route');

    const response = await POST(new Request('http://localhost/api/events/invites/token-1/revoke', { method: 'POST' }), {
      params: Promise.resolve({ tokenId: 'token-1' })
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: 'invite_not_found' });
  });

  it('membership role patch blocks planner escalating to admin', async () => {
    getSupabaseAdminClientMock.mockReturnValue({
      from: (table: string) => {
        if (table === 'memberships') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: {
                    membership_id: 'm-1',
                    event_id: 'evt-revel-1',
                    role: 'vendor',
                    user_id: 'usr-vendor-1'
                  },
                  error: null
                })
              })
            })
          };
        }

        return { from: () => null };
      }
    });

    const { PATCH } = await import('@/app/api/events/memberships/[membershipId]/role/route');

    const response = await PATCH(
      new Request('http://localhost/api/events/memberships/m-1/role', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'admin' })
      }),
      { params: Promise.resolve({ membershipId: 'm-1' }) }
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: 'forbidden_role_transition' });
  });
});
