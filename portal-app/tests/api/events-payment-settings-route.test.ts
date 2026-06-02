import { beforeEach, describe, expect, it, vi } from 'vitest';

const getSessionMock = vi.fn();
const getSupabaseAdminClientMock = vi.fn();

vi.mock('@/lib/session', () => ({
  getSession: getSessionMock
}));

vi.mock('@/lib/supabase-server', () => ({
  getSupabaseAdminClient: getSupabaseAdminClientMock
}));

describe('events payment settings route', () => {
  beforeEach(() => {
    vi.resetModules();
    getSessionMock.mockReset();
    getSupabaseAdminClientMock.mockReset();

    getSessionMock.mockResolvedValue({
      userId: 'usr-planner-maulin',
      email: 'maulin@revel-ent.com',
      displayName: 'MC Maulin',
      role: 'planner',
      eventId: 'evt-revel-2026-11-15'
    });

    getSupabaseAdminClientMock.mockReturnValue(null);
  });

  it('GET returns 401 when unauthenticated', async () => {
    getSessionMock.mockResolvedValue(null);
    const { GET } = await import('@/app/api/events/payment-settings/route');

    const response = await GET();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' });
  });

  it('GET returns 403 for disallowed role', async () => {
    getSessionMock.mockResolvedValue({
      userId: 'usr-vendor-heckno',
      email: 'heckno@revel-ent.com',
      displayName: 'DJ Heckno',
      role: 'vendor',
      eventId: 'evt-revel-2026-11-15'
    });

    const { GET } = await import('@/app/api/events/payment-settings/route');
    const response = await GET();

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: 'Forbidden' });
  });

  it('GET returns simulation defaults when supabase is unavailable', async () => {
    const { GET } = await import('@/app/api/events/payment-settings/route');
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.source).toBe('simulation');
    expect(payload.settings.acceptChecks).toBe(false);
    expect(payload.settings.allowCard).toBe(true);
  });

  it('POST rejects check payment setting updates', async () => {
    const { POST } = await import('@/app/api/events/payment-settings/route');

    const response = await POST(
      new Request('http://localhost/api/events/payment-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acceptChecks: true })
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'check_payments_not_supported' });
  });

  it('POST requires manual rail handle when enabling zelle', async () => {
    const { POST } = await import('@/app/api/events/payment-settings/route');

    const response = await POST(
      new Request('http://localhost/api/events/payment-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allowZelle: true })
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'zelle_handle_required' });
  });

  it('POST updates simulation state when supabase is unavailable', async () => {
    const { POST } = await import('@/app/api/events/payment-settings/route');

    const response = await POST(
      new Request('http://localhost/api/events/payment-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allowZelle: true,
          zelleHandle: 'finance@revel-ent.com',
          manualPaymentInstructions: 'Use memo: Event 2026-11-15'
        })
      })
    );

    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.source).toBe('simulation');
    expect(payload.settings.allowZelle).toBe(true);
    expect(payload.settings.zelleHandle).toBe('finance@revel-ent.com');
    expect(payload.settings.acceptChecks).toBe(false);
  });

  it('GET reads persisted payment settings via supabase', async () => {
    getSessionMock.mockResolvedValue({
      userId: 'usr-admin-1',
      email: 'admin@revel-ent.com',
      displayName: 'Admin',
      role: 'admin',
      eventId: '0f1d7d0a-7c8f-4f5f-9c89-9c8b2f3e1a11'
    });

    const eventMaybeSingleMock = vi.fn().mockResolvedValue({
      data: { atlas_mode: 'independent' },
      error: null
    });

    const settingsMaybeSingleMock = vi.fn().mockResolvedValue({
      data: {
        event_id: '0f1d7d0a-7c8f-4f5f-9c89-9c8b2f3e1a11',
        allow_card: true,
        allow_apple_google_pay: true,
        allow_ach: true,
        allow_zelle: false,
        allow_venmo: false,
        allow_cash_app: false,
        accept_checks: false,
        stripe_account_id: 'acct_123',
        zelle_handle: null,
        venmo_handle: null,
        cash_app_handle: null,
        manual_payment_instructions: null,
        updated_at: '2026-06-02T10:00:00.000Z'
      },
      error: null
    });

    getSupabaseAdminClientMock.mockReturnValue({
      from: (table: string) => {
        if (table === 'events') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: eventMaybeSingleMock
              })
            })
          };
        }

        if (table === 'atlas_workspace_payment_settings') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: settingsMaybeSingleMock
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

    const { GET } = await import('@/app/api/events/payment-settings/route');
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.source).toBe('supabase');
    expect(payload.mode).toBe('independent');
    expect(payload.settings.stripeAccountId).toBe('acct_123');
    expect(payload.settings.acceptChecks).toBe(false);
  });

  it('POST upserts persisted payment settings via supabase', async () => {
    getSessionMock.mockResolvedValue({
      userId: 'usr-admin-1',
      email: 'admin@revel-ent.com',
      displayName: 'Admin',
      role: 'admin',
      eventId: '0f1d7d0a-7c8f-4f5f-9c89-9c8b2f3e1a11'
    });

    const eventMaybeSingleMock = vi.fn().mockResolvedValue({
      data: { atlas_mode: 'independent' },
      error: null
    });

    const settingsMaybeSingleMock = vi.fn().mockResolvedValue({
      data: {
        event_id: '0f1d7d0a-7c8f-4f5f-9c89-9c8b2f3e1a11',
        allow_card: true,
        allow_apple_google_pay: true,
        allow_ach: true,
        allow_zelle: false,
        allow_venmo: false,
        allow_cash_app: false,
        accept_checks: false,
        stripe_account_id: null,
        zelle_handle: null,
        venmo_handle: null,
        cash_app_handle: null,
        manual_payment_instructions: null,
        updated_at: '2026-06-02T10:00:00.000Z'
      },
      error: null
    });

    const upsertMaybeSingleMock = vi.fn().mockResolvedValue({
      data: {
        event_id: '0f1d7d0a-7c8f-4f5f-9c89-9c8b2f3e1a11',
        allow_card: true,
        allow_apple_google_pay: true,
        allow_ach: true,
        allow_zelle: true,
        allow_venmo: true,
        allow_cash_app: false,
        accept_checks: false,
        stripe_account_id: 'acct_live_1',
        zelle_handle: 'finance@revel-ent.com',
        venmo_handle: '@revelent',
        cash_app_handle: null,
        manual_payment_instructions: 'Use event id in memo',
        updated_at: '2026-06-02T10:05:00.000Z'
      },
      error: null
    });

    getSupabaseAdminClientMock.mockReturnValue({
      from: (table: string) => {
        if (table === 'events') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: eventMaybeSingleMock
              })
            })
          };
        }

        if (table === 'atlas_workspace_payment_settings') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: settingsMaybeSingleMock
              })
            }),
            upsert: () => ({
              select: () => ({
                maybeSingle: upsertMaybeSingleMock
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

    const { POST } = await import('@/app/api/events/payment-settings/route');
    const response = await POST(
      new Request('http://localhost/api/events/payment-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allowZelle: true,
          allowVenmo: true,
          stripeAccountId: 'acct_live_1',
          zelleHandle: 'finance@revel-ent.com',
          venmoHandle: '@revelent',
          manualPaymentInstructions: 'Use event id in memo'
        })
      })
    );

    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.source).toBe('supabase');
    expect(payload.settings.allowZelle).toBe(true);
    expect(payload.settings.allowVenmo).toBe(true);
    expect(payload.settings.stripeAccountId).toBe('acct_live_1');
    expect(payload.settings.acceptChecks).toBe(false);
  });
});
