import { beforeEach, describe, expect, it, vi } from 'vitest';

const getSupabaseAdminClientMock = vi.fn();
const getStripeServerClientMock = vi.fn();
const getStripeWebhookSecretMock = vi.fn();
const dispatchMessageToRecipientsMock = vi.fn();

vi.mock('@/lib/supabase-server', () => ({
  getSupabaseAdminClient: getSupabaseAdminClientMock
}));

vi.mock('@/lib/atlas-stripe', () => ({
  getStripeServerClient: getStripeServerClientMock,
  getStripeWebhookSecret: getStripeWebhookSecretMock
}));

vi.mock('@/lib/notifications', () => ({
  dispatchMessageToRecipients: dispatchMessageToRecipientsMock
}));

describe('stripe webhook route', () => {
  beforeEach(() => {
    vi.resetModules();
    getSupabaseAdminClientMock.mockReset();
    getStripeServerClientMock.mockReset();
    getStripeWebhookSecretMock.mockReset();
    dispatchMessageToRecipientsMock.mockReset();
    dispatchMessageToRecipientsMock.mockResolvedValue([]);

    getStripeWebhookSecretMock.mockReturnValue('whsec_test_123');
    getStripeServerClientMock.mockReturnValue({
      webhooks: {
        constructEvent: vi.fn()
      }
    });
  });

  it('returns 400 when signature is missing', async () => {
    const { POST } = await import('@/app/api/stripe/webhook/route');

    const response = await POST(new Request('http://localhost/api/stripe/webhook', { method: 'POST', body: '{}' }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'missing_stripe_signature' });
  });

  it('returns duplicate when event has already been processed', async () => {
    const constructEventMock = vi.fn().mockReturnValue({
      id: 'evt_123',
      type: 'checkout.session.completed',
      livemode: false,
      data: { object: { id: 'cs_123', metadata: { eventId: '0f1d7d0a-7c8f-4f5f-9c89-9c8b2f3e1a11' } } }
    });

    getStripeServerClientMock.mockReturnValue({
      webhooks: {
        constructEvent: constructEventMock
      }
    });

    getSupabaseAdminClientMock.mockReturnValue({
      from: (table: string) => {
        if (table === 'atlas_workspace_stripe_webhook_events') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: { stripe_event_id: 'evt_123' }, error: null })
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

    const { POST } = await import('@/app/api/stripe/webhook/route');

    const response = await POST(
      new Request('http://localhost/api/stripe/webhook', {
        method: 'POST',
        headers: { 'stripe-signature': 'test_sig' },
        body: '{}'
      })
    );

    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.received).toBe(true);
    expect(payload.duplicate).toBe(true);
  });

  it('processes checkout.session.completed and updates billing state', async () => {
    const event = {
      id: 'evt_checkout_123',
      type: 'checkout.session.completed',
      livemode: false,
      data: {
        object: {
          id: 'cs_test_123',
          customer: 'cus_test_123',
          payment_intent: 'pi_test_123',
          amount_total: 14900,
          currency: 'usd',
          payment_status: 'paid',
          status: 'complete',
          url: 'https://checkout.stripe.com/pay/cs_test_123',
          metadata: {
            eventId: '0f1d7d0a-7c8f-4f5f-9c89-9c8b2f3e1a11',
            workspacePlan: 'essential'
          }
        }
      }
    };

    const constructEventMock = vi.fn().mockReturnValue(event);

    getStripeServerClientMock.mockReturnValue({
      webhooks: {
        constructEvent: constructEventMock
      }
    });

    const webhookUpsertMock = vi.fn().mockResolvedValue({ error: null });
    const customerUpsertMock = vi.fn().mockResolvedValue({ error: null });
    const checkoutUpsertMock = vi.fn().mockResolvedValue({ error: null });

    getSupabaseAdminClientMock.mockReturnValue({
      from: (table: string) => {
        if (table === 'atlas_workspace_stripe_webhook_events') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: null, error: null })
              })
            }),
            upsert: webhookUpsertMock
          };
        }

        if (table === 'events') {
          return {
            update: () => ({
              eq: async () => ({ data: null, error: null })
            })
          };
        }

        if (table === 'atlas_workspace_stripe_customers') {
          return {
            upsert: customerUpsertMock
          };
        }

        if (table === 'atlas_workspace_stripe_checkout_sessions') {
          return {
            upsert: checkoutUpsertMock
          };
        }

        return {
          update: () => ({
            eq: async () => ({ data: null, error: null })
          }),
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: null, error: null })
            })
          })
        };
      }
    });

    const { POST } = await import('@/app/api/stripe/webhook/route');

    const response = await POST(
      new Request('http://localhost/api/stripe/webhook', {
        method: 'POST',
        headers: { 'stripe-signature': 'test_sig' },
        body: JSON.stringify({ any: 'payload' })
      })
    );

    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.received).toBe(true);
    expect(payload.processed).toBe('processed');
    expect(customerUpsertMock).toHaveBeenCalledTimes(1);
    expect(checkoutUpsertMock).toHaveBeenCalledTimes(1);
    expect(webhookUpsertMock).toHaveBeenCalledTimes(1);
  });

  it('sends music questionnaire reminder after matching 30% deposit payment intent success', async () => {
    const event = {
      id: 'evt_payment_intent_123',
      type: 'payment_intent.succeeded',
      livemode: false,
      data: {
        object: {
          id: 'pi_test_123',
          amount: 531000,
          amount_received: 531000,
          metadata: {
            eventId: 'b3c9e1f2-4a7d-4e8b-a1c2-d5e6f7a8b9c0',
            eventTitle: 'Akshay & Rani Patel Wedding Weekend'
          }
        }
      }
    };

    getStripeServerClientMock.mockReturnValue({
      webhooks: {
        constructEvent: vi.fn().mockReturnValue(event)
      }
    });

    const webhookUpsertMock = vi.fn().mockResolvedValue({ error: null });

    getSupabaseAdminClientMock.mockReturnValue({
      from: (table: string) => {
        if (table === 'atlas_workspace_stripe_webhook_events') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: null, error: null })
              })
            }),
            upsert: webhookUpsertMock
          };
        }

        if (table === 'events') {
          return {
            update: () => ({
              eq: async () => ({ data: null, error: null })
            })
          };
        }

        if (table === 'atlas_workspace_stripe_checkout_sessions') {
          return {
            update: () => ({
              eq: async () => ({ data: null, error: null })
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

    const { POST } = await import('@/app/api/stripe/webhook/route');

    const response = await POST(
      new Request('http://localhost/api/stripe/webhook', {
        method: 'POST',
        headers: { 'stripe-signature': 'test_sig' },
        body: JSON.stringify({ any: 'payload' })
      })
    );

    expect(response.status).toBe(200);
    expect(dispatchMessageToRecipientsMock).toHaveBeenCalledTimes(1);
    expect(dispatchMessageToRecipientsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        channel: 'email',
        recipients: expect.arrayContaining([
          'akshay.rani1128@gmail.com',
          'events@amtopmplanners.com',
          'dcevents.us@gmail.com'
        ])
      })
    );
  });
});
