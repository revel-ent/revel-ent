import { NextResponse } from 'next/server';

import {
  getStripeServerClient,
  getWorkspacePriceCents,
  getWorkspaceProductLabel,
  resolveStripeRedirectUrls
} from '@/lib/atlas-stripe';
import { isUuid, parseEventMode, parseWorkspacePlan } from '@/lib/atlas-commercial';
import { canManageEventCommercialSettings } from '@/lib/auth';
import type { AtlasWorkspacePlan } from '@/lib/atlas-types';
import { getSession } from '@/lib/session';
import { getSupabaseAdminClient } from '@/lib/supabase-server';

interface CheckoutBody {
  workspacePlan?: unknown;
  successUrl?: unknown;
  cancelUrl?: unknown;
}

function resolvePlanFromBodyAndEvent(
  requestedPlan: unknown,
  currentPlan: unknown
): { value: AtlasWorkspacePlan | null; valid: boolean } {
  if (requestedPlan === undefined) {
    const parsedCurrent = parseWorkspacePlan(currentPlan);
    return { value: parsedCurrent ?? 'essential', valid: true };
  }

  const parsed = parseWorkspacePlan(requestedPlan);
  return { value: parsed, valid: Boolean(parsed) };
}

export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!session.eventId) {
    return NextResponse.json({ error: 'Missing event context' }, { status: 400 });
  }

  if (!canManageEventCommercialSettings(session.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: CheckoutBody = {};

  try {
    body = (await request.json()) as CheckoutBody;
  } catch {
    body = {};
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase || !isUuid(session.eventId)) {
    const requestedPlan = parseWorkspacePlan(body.workspacePlan) ?? 'essential';

    return NextResponse.json(
      {
        source: 'simulation',
        eventId: session.eventId,
        workspacePlan: requestedPlan,
        amountCents: getWorkspacePriceCents(requestedPlan),
        checkoutUrl: `/portal/couple?stripe_checkout=simulated&plan=${requestedPlan}`
      },
      { status: 200 }
    );
  }

  const { data: eventRow, error: eventError } = await supabase
    .from('events')
    .select('event_id,atlas_mode,atlas_workspace_plan')
    .eq('event_id', session.eventId)
    .maybeSingle();

  if (eventError) {
    return NextResponse.json({ error: 'event_read_failed', details: eventError.message }, { status: 500 });
  }

  if (!eventRow) {
    return NextResponse.json({ error: 'event_not_found' }, { status: 404 });
  }

  const mode = parseEventMode(eventRow.atlas_mode) ?? 'revel_managed';

  if (mode !== 'independent') {
    return NextResponse.json({ error: 'checkout_requires_independent_mode' }, { status: 400 });
  }

  const planResolution = resolvePlanFromBodyAndEvent(body.workspacePlan, eventRow.atlas_workspace_plan);

  if (!planResolution.valid || !planResolution.value) {
    return NextResponse.json({ error: 'invalid_workspace_plan' }, { status: 400 });
  }

  const workspacePlan = planResolution.value;
  const amountCents = getWorkspacePriceCents(workspacePlan);

  const { data: paymentSettings, error: paymentSettingsError } = await supabase
    .from('atlas_workspace_payment_settings')
    .select('allow_card,allow_ach')
    .eq('event_id', session.eventId)
    .maybeSingle();

  if (paymentSettingsError) {
    return NextResponse.json({ error: 'payment_settings_read_failed', details: paymentSettingsError.message }, { status: 500 });
  }

  if (paymentSettings && !paymentSettings.allow_card && !paymentSettings.allow_ach) {
    return NextResponse.json({ error: 'stripe_rails_disabled' }, { status: 400 });
  }

  const stripe = getStripeServerClient();

  if (!stripe) {
    return NextResponse.json({ error: 'stripe_not_configured' }, { status: 503 });
  }

  const { successUrl, cancelUrl } = resolveStripeRedirectUrls(request, {
    successUrl: body.successUrl,
    cancelUrl: body.cancelUrl
  });

  const { data: customerRow, error: customerReadError } = await supabase
    .from('atlas_workspace_stripe_customers')
    .select('stripe_customer_id')
    .eq('event_id', session.eventId)
    .maybeSingle();

  if (customerReadError) {
    return NextResponse.json({ error: 'stripe_customer_read_failed', details: customerReadError.message }, { status: 500 });
  }

  let stripeCustomerId = customerRow?.stripe_customer_id ?? null;

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: session.email,
      name: session.displayName,
      metadata: {
        eventId: session.eventId
      }
    });

    stripeCustomerId = customer.id;

    const { error: customerWriteError } = await supabase.from('atlas_workspace_stripe_customers').upsert(
      {
        event_id: session.eventId,
        stripe_customer_id: stripeCustomerId,
        created_by_user_id: session.userId,
        updated_by_user_id: session.userId,
        updated_at: new Date().toISOString()
      },
      { onConflict: 'event_id' }
    );

    if (customerWriteError) {
      return NextResponse.json({ error: 'stripe_customer_write_failed', details: customerWriteError.message }, { status: 500 });
    }
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer: stripeCustomerId,
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
    payment_method_types: ['card', 'us_bank_account'],
    metadata: {
      eventId: session.eventId,
      workspacePlan,
      initiatedByUserId: session.userId
    },
    payment_intent_data: {
      metadata: {
        eventId: session.eventId,
        workspacePlan
      }
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: amountCents,
          product_data: {
            name: getWorkspaceProductLabel(workspacePlan),
            description: 'One-time billing for independent wedding workspace access'
          }
        }
      }
    ]
  });

  if (!checkoutSession.url) {
    return NextResponse.json({ error: 'stripe_checkout_url_missing' }, { status: 502 });
  }

  const { error: sessionWriteError } = await supabase.from('atlas_workspace_stripe_checkout_sessions').upsert(
    {
      event_id: session.eventId,
      stripe_checkout_session_id: checkoutSession.id,
      stripe_customer_id: stripeCustomerId,
      stripe_payment_intent_id:
        typeof checkoutSession.payment_intent === 'string' ? checkoutSession.payment_intent : checkoutSession.payment_intent?.id ?? null,
      workspace_plan: workspacePlan,
      amount_cents: amountCents,
      currency: checkoutSession.currency ?? 'usd',
      status: 'open',
      checkout_url: checkoutSession.url,
      payment_status: checkoutSession.payment_status,
      initiated_by_user_id: session.userId,
      updated_at: new Date().toISOString()
    },
    { onConflict: 'stripe_checkout_session_id' }
  );

  if (sessionWriteError) {
    return NextResponse.json({ error: 'stripe_checkout_persist_failed', details: sessionWriteError.message }, { status: 500 });
  }

  return NextResponse.json(
    {
      source: 'stripe',
      eventId: session.eventId,
      workspacePlan,
      amountCents,
      checkoutSessionId: checkoutSession.id,
      checkoutUrl: checkoutSession.url
    },
    { status: 200 }
  );
}
