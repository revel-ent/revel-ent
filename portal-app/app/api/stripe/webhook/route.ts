import { NextResponse } from 'next/server';
import type Stripe from 'stripe';

import { getStripeServerClient, getStripeWebhookSecret } from '@/lib/atlas-stripe';
import { isUuid, parseWorkspacePlan } from '@/lib/atlas-commercial';
import { markPaymentMilestoneComplete } from '@/lib/couple-domains';
import { getClientPlanForEvent } from '@/lib/mock-client-milestones';
import { dispatchMessageToRecipients } from '@/lib/notifications';
import { getEventStakeholderEmails } from '@/lib/event-stakeholders';
import { getSupabaseAdminClient } from '@/lib/supabase-server';

function getMetadataEventId(metadata: Record<string, string> | null | undefined): string | null {
  const value = metadata?.eventId;
  if (!value || !isUuid(value)) {
    return null;
  }

  return value;
}

async function findEventIdFromPaymentIntent(supabase: ReturnType<typeof getSupabaseAdminClient>, paymentIntentId: string): Promise<string | null> {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from('atlas_workspace_stripe_checkout_sessions')
    .select('event_id')
    .eq('stripe_payment_intent_id', paymentIntentId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return null;
  }

  return data?.event_id ?? null;
}

async function updateBillingState(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  eventId: string,
  nextState: 'active' | 'past_due' | 'canceled'
) {
  if (!supabase) {
    return;
  }

  await supabase
    .from('events')
    .update({ atlas_billing_state: nextState, updated_at: new Date().toISOString() })
    .eq('event_id', eventId);
}

async function recordWebhook(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  payload: {
    stripeEventId: string;
    stripeEventType: string;
    livemode: boolean;
    eventId: string | null;
    status: 'processed' | 'ignored' | 'errored' | 'duplicate';
    errorMessage: string | null;
    rawPayload: Record<string, unknown>;
  }
) {
  if (!supabase) {
    return;
  }

  await supabase.from('atlas_workspace_stripe_webhook_events').upsert(
    {
      stripe_event_id: payload.stripeEventId,
      stripe_event_type: payload.stripeEventType,
      livemode: payload.livemode,
      event_id: payload.eventId,
      processing_status: payload.status,
      error_message: payload.errorMessage,
      payload: payload.rawPayload,
      processed_at: new Date().toISOString()
    },
    { onConflict: 'stripe_event_id' }
  );
}

function getBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (configured && configured.trim().length > 0) {
    return configured.replace(/\/$/, '');
  }

  return 'https://atlas.revel-ent.com';
}

function normalizePortalPath(pathname: string): string {
  return pathname.startsWith('/') ? pathname : `/${pathname}`;
}

function buildMusicQuestionnaireReminder(params: {
  eventId: string;
  eventTitle?: string;
  dueDateLabel?: string;
}): { subject: string; message: string } {
  const dueLine = params.dueDateLabel
    ? `Please complete it by ${params.dueDateLabel}.`
    : 'Please complete it within 7 days of your deposit confirmation.';
  const portalLink = `${getBaseUrl()}${normalizePortalPath('/portal/couple')}`;

  return {
    subject: `Atlas Action Required: Music Questionnaire | ${params.eventTitle ?? params.eventId}`,
    message: [
      `Great news: the 30% booking deposit has been received for ${params.eventTitle ?? 'your event'}.`,
      '',
      'Next required step: complete the Music Questionnaire in Atlas.',
      dueLine,
      '',
      'Please include your preferred percentage split for:',
      '- Bhangra (newer)',
      '- Bhangra (old school)',
      '- Bollywood (newer)',
      '- Bollywood (older)',
      '- Old school hip-hop',
      '- Current hip-hop & Top 40',
      '- House',
      '- Latin',
      '- Other (optional)',
      '',
      'Also add:',
      '- Other genre details',
      '- Dance-off ideas or hosting notes',
      '- Additional notes about artists, genres, and transitions',
      '',
      `Open Atlas: ${portalLink}`,
      '',
      'This reminder was sent to your current planning distribution list in Atlas so the couple, planner, and decorator stay aligned.'
    ].join('\n')
  };
}

async function sendDepositQuestionnaireReminder(params: {
  eventId: string;
  eventTitle?: string;
  amountCents?: number;
}) {
  const plan = getClientPlanForEvent(params.eventId);
  if (!plan) {
    return;
  }

  const depositMilestone = plan.paymentMilestones.find((item) => item.percent === 30);
  if (!depositMilestone) {
    return;
  }

  const receivedCents = params.amountCents ?? 0;
  const expectedDepositCents = Math.round(depositMilestone.amount * 100);
  if (receivedCents !== expectedDepositCents) {
    return;
  }

  const recipients = getEventStakeholderEmails(params.eventId);
  if (recipients.length === 0) {
    return;
  }

  const reminder = buildMusicQuestionnaireReminder({
    eventId: params.eventId,
    eventTitle: params.eventTitle,
    dueDateLabel: 'June 11, 2026'
  });

  await dispatchMessageToRecipients({
    channel: 'email',
    recipients,
    subject: reminder.subject,
    message: reminder.message
  });
}

export async function POST(request: Request) {
  const stripe = getStripeServerClient();
  const webhookSecret = getStripeWebhookSecret();

  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: 'stripe_webhook_not_configured' }, { status: 503 });
  }

  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'missing_stripe_signature' }, { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: 'invalid_stripe_signature' }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json({ error: 'supabase_not_configured' }, { status: 503 });
  }

  const { data: existingWebhook, error: existingWebhookError } = await supabase
    .from('atlas_workspace_stripe_webhook_events')
    .select('stripe_event_id')
    .eq('stripe_event_id', event.id)
    .maybeSingle();

  if (existingWebhookError) {
    return NextResponse.json({ error: 'webhook_read_failed', details: existingWebhookError.message }, { status: 500 });
  }

  if (existingWebhook) {
    return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
  }

  let relatedEventId: string | null = null;
  let processingStatus: 'processed' | 'ignored' | 'errored' | 'duplicate' = 'ignored';
  let errorMessage: string | null = null;

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      relatedEventId = getMetadataEventId(session.metadata);

      if (relatedEventId) {
        const workspacePlan = parseWorkspacePlan(session.metadata?.workspacePlan ?? null);

        await updateBillingState(supabase, relatedEventId, 'active');

        if (typeof session.customer === 'string') {
          await supabase.from('atlas_workspace_stripe_customers').upsert(
            {
              event_id: relatedEventId,
              stripe_customer_id: session.customer,
              updated_at: new Date().toISOString()
            },
            { onConflict: 'event_id' }
          );
        }

        await supabase.from('atlas_workspace_stripe_checkout_sessions').upsert(
          {
            event_id: relatedEventId,
            stripe_checkout_session_id: session.id,
            stripe_customer_id: typeof session.customer === 'string' ? session.customer : null,
            stripe_payment_intent_id:
              typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id ?? null,
            workspace_plan: workspacePlan,
            amount_cents: session.amount_total ?? null,
            currency: session.currency ?? 'usd',
            status: 'completed',
            checkout_url: session.url,
            payment_status: session.payment_status,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'stripe_checkout_session_id' }
        );

        processingStatus = 'processed';
      }
    } else if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      relatedEventId = getMetadataEventId(paymentIntent.metadata);

      if (!relatedEventId && paymentIntent.id) {
        relatedEventId = await findEventIdFromPaymentIntent(supabase, paymentIntent.id);
      }

      if (relatedEventId) {
        await updateBillingState(supabase, relatedEventId, 'active');

        await supabase
          .from('atlas_workspace_stripe_checkout_sessions')
          .update({ status: 'paid', payment_status: 'paid', updated_at: new Date().toISOString() })
          .eq('stripe_payment_intent_id', paymentIntent.id);

        await markPaymentMilestoneComplete(relatedEventId, 'pay-deposit');

        await sendDepositQuestionnaireReminder({
          eventId: relatedEventId,
          eventTitle: paymentIntent.metadata?.eventTitle,
          amountCents: paymentIntent.amount_received ?? paymentIntent.amount
        });

        processingStatus = 'processed';
      }
    } else if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      relatedEventId = getMetadataEventId(paymentIntent.metadata);

      if (!relatedEventId && paymentIntent.id) {
        relatedEventId = await findEventIdFromPaymentIntent(supabase, paymentIntent.id);
      }

      if (relatedEventId) {
        await updateBillingState(supabase, relatedEventId, 'past_due');

        await supabase
          .from('atlas_workspace_stripe_checkout_sessions')
          .update({ status: 'payment_failed', payment_status: 'unpaid', updated_at: new Date().toISOString() })
          .eq('stripe_payment_intent_id', paymentIntent.id);

        processingStatus = 'processed';
      }
    } else if (event.type === 'charge.refunded') {
      const charge = event.data.object as Stripe.Charge;
      relatedEventId = getMetadataEventId(charge.metadata);

      if (!relatedEventId && typeof charge.payment_intent === 'string') {
        relatedEventId = await findEventIdFromPaymentIntent(supabase, charge.payment_intent);
      }

      if (relatedEventId) {
        await updateBillingState(supabase, relatedEventId, 'canceled');

        if (typeof charge.payment_intent === 'string') {
          await supabase
            .from('atlas_workspace_stripe_checkout_sessions')
            .update({ status: 'refunded', updated_at: new Date().toISOString() })
            .eq('stripe_payment_intent_id', charge.payment_intent);
        }

        processingStatus = 'processed';
      }
    }
  } catch (eventError) {
    processingStatus = 'errored';
    errorMessage = eventError instanceof Error ? eventError.message : 'stripe_webhook_processing_error';
  }

  await recordWebhook(supabase, {
    stripeEventId: event.id,
    stripeEventType: event.type,
    livemode: event.livemode,
    eventId: relatedEventId,
    status: processingStatus,
    errorMessage,
    rawPayload: event as unknown as Record<string, unknown>
  });

  if (processingStatus === 'errored') {
    return NextResponse.json({ error: 'stripe_webhook_processing_error', details: errorMessage }, { status: 500 });
  }

  return NextResponse.json({ received: true, processed: processingStatus }, { status: 200 });
}
