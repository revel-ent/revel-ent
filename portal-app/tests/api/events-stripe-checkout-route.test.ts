import { beforeEach, describe, expect, it, vi } from 'vitest';

const getSessionMock = vi.fn();
const getSupabaseAdminClientMock = vi.fn();
const getStripeServerClientMock = vi.fn();

vi.mock('@/lib/session', () => ({
  getSession: getSessionMock
}));

vi.mock('@/lib/supabase-server', () => ({
  getSupabaseAdminClient: getSupabaseAdminClientMock
}));

vi.mock('@/lib/atlas-stripe', async () => {
  const actual = await vi.importActual<typeof import('@/lib/atlas-stripe')>('@/lib/atlas-stripe');

  return {
    ...actual,
    getStripeServerClient: getStripeServerClientMock
  };
});

describe('events stripe checkout route', () => {
  beforeEach(() => {
    vi.resetModules();
    getSessionMock.mockReset();
    getSupabaseAdminClientMock.mockReset();
    getStripeServerClientMock.mockReset();

    getSessionMock.mockResolvedValue({
      userId: 'usr-planner-maulin',
      email: 'maulin@revel-ent.com',
      displayName: 'MC Maulin',
      role: 'planner',
      eventId: 'evt-revel-2026-11-15'
    });

    getSupabaseAdminClientMock.mockReturnValue(null);
  });

  it('returns 401 when unauthenticated', async () => {
    getSessionMock.mockResolvedValue(null);

    const { POST } = await import('@/app/api/events/stripe/checkout/route');
    const response = await POST(new Request('http://localhost/api/events/stripe/checkout', { method: 'POST' }));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' });
  });

  it('returns simulation payload when supabase is unavailable', async () => {
    const { POST } = await import('@/app/api/events/stripe/checkout/route');

    const response = await POST(
      new Request('http://localhost/api/events/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspacePlan: 'pro' })
      })
    );

    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.source).toBe('simulation');
    expect(payload.workspacePlan).toBe('pro');
    expect(payload.amountCents).toBe(34900);
  });

  it('rejects checkout when mode is revel-managed', async () => {
    getSessionMock.mockResolvedValue({
      userId: 'usr-admin-1',
      email: 'admin@revel-ent.com',
      displayName: 'Admin',
      role: 'admin',
      eventId: '0f1d7d0a-7c8f-4f5f-9c89-9c8b2f3e1a11'
    });

    getSupabaseAdminClientMock.mockReturnValue({
      from: (table: string) => {
        if (table === 'events') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: {
                    event_id: '0f1d7d0a-7c8f-4f5f-9c89-9c8b2f3e1a11',
                    atlas_mode: 'revel_managed',
                    atlas_workspace_plan: null
                  },
                  error: null
                })
              })
            })
          };
        }

        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: null, error: null })
            })
          })
        };
      }
    });

    const { POST } = await import('@/app/api/events/stripe/checkout/route');

    const response = await POST(new Request('http://localhost/api/events/stripe/checkout', { method: 'POST' }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'checkout_requires_independent_mode' });
  });

  it('creates stripe checkout session and persists records', async () => {
    getSessionMock.mockResolvedValue({
      userId: 'usr-admin-1',
      email: 'admin@revel-ent.com',
      displayName: 'Admin',
      role: 'admin',
      eventId: '0f1d7d0a-7c8f-4f5f-9c89-9c8b2f3e1a11'
    });

    const customerUpsertMock = vi.fn().mockResolvedValue({ error: null });
    const checkoutUpsertMock = vi.fn().mockResolvedValue({ error: null });

    getSupabaseAdminClientMock.mockReturnValue({
      from: (table: string) => {
        if (table === 'events') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: {
                    event_id: '0f1d7d0a-7c8f-4f5f-9c89-9c8b2f3e1a11',
                    atlas_mode: 'independent',
                    atlas_workspace_plan: 'essential'
                  },
                  error: null
                })
              })
            })
          };
        }

        if (table === 'atlas_workspace_payment_settings') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: {
                    allow_card: true,
                    allow_ach: true
                  },
                  error: null
                })
              })
            })
          };
        }

        if (table === 'atlas_workspace_stripe_customers') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: null, error: null })
              })
            }),
            upsert: customerUpsertMock
          };
        }

        if (table === 'atlas_workspace_stripe_checkout_sessions') {
          return {
            upsert: checkoutUpsertMock
          };
        }

        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: null, error: null })
            })
          })
        };
      }
    });

    const checkoutCreateMock = vi.fn().mockResolvedValue({
      id: 'cs_test_123',
      url: 'https://checkout.stripe.com/pay/cs_test_123',
      currency: 'usd',
      payment_status: 'unpaid',
      payment_intent: 'pi_test_123'
    });

    getStripeServerClientMock.mockReturnValue({
      customers: {
        create: vi.fn().mockResolvedValue({ id: 'cus_test_123' })
      },
      checkout: {
        sessions: {
          create: checkoutCreateMock
        }
      }
    });

    const { POST } = await import('@/app/api/events/stripe/checkout/route');

    const response = await POST(
      new Request('http://localhost/api/events/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspacePlan: 'premium' })
      })
    );

    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.source).toBe('stripe');
    expect(payload.workspacePlan).toBe('premium');
    expect(payload.amountCents).toBe(74900);
    expect(payload.checkoutSessionId).toBe('cs_test_123');
    expect(checkoutCreateMock).toHaveBeenCalledTimes(1);
    expect(customerUpsertMock).toHaveBeenCalledTimes(1);
    expect(checkoutUpsertMock).toHaveBeenCalledTimes(1);
  });
});
