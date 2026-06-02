import { NextResponse } from 'next/server';

import { defaultPaymentSettings, loadWorkspacePaymentSettings, parseBooleanPatch, parseStringPatch } from '@/lib/atlas-payments';
import { isUuid, parseEventMode } from '@/lib/atlas-commercial';
import { canManageEventCommercialSettings } from '@/lib/auth';
import { getSession } from '@/lib/session';
import { getSupabaseAdminClient } from '@/lib/supabase-server';

interface UpdatePaymentSettingsBody {
  allowCard?: unknown;
  allowAppleGooglePay?: unknown;
  allowAch?: unknown;
  allowZelle?: unknown;
  allowVenmo?: unknown;
  allowCashApp?: unknown;
  stripeAccountId?: unknown;
  zelleHandle?: unknown;
  venmoHandle?: unknown;
  cashAppHandle?: unknown;
  manualPaymentInstructions?: unknown;
  acceptChecks?: unknown;
}

export async function GET() {
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

  const supabase = getSupabaseAdminClient();

  if (!supabase || !isUuid(session.eventId)) {
    return NextResponse.json(
      {
        source: 'simulation',
        settings: defaultPaymentSettings(session.eventId, 'revel_managed')
      },
      { status: 200 }
    );
  }

  try {
    const loaded = await loadWorkspacePaymentSettings(supabase, session.eventId);

    return NextResponse.json(
      {
        source: loaded.source,
        mode: loaded.mode,
        settings: loaded.settings
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'event_not_found') {
      return NextResponse.json({ error: 'event_not_found' }, { status: 404 });
    }

    const details = error instanceof Error ? error.message : 'unknown_error';
    return NextResponse.json({ error: 'payment_settings_read_failed', details }, { status: 500 });
  }
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

  let body: UpdatePaymentSettingsBody;

  try {
    body = (await request.json()) as UpdatePaymentSettingsBody;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  if (body.acceptChecks !== undefined) {
    return NextResponse.json({ error: 'check_payments_not_supported' }, { status: 400 });
  }

  const allowCard = parseBooleanPatch(body.allowCard);
  const allowAppleGooglePay = parseBooleanPatch(body.allowAppleGooglePay);
  const allowAch = parseBooleanPatch(body.allowAch);
  const allowZelle = parseBooleanPatch(body.allowZelle);
  const allowVenmo = parseBooleanPatch(body.allowVenmo);
  const allowCashApp = parseBooleanPatch(body.allowCashApp);

  const stripeAccountId = parseStringPatch(body.stripeAccountId);
  const zelleHandle = parseStringPatch(body.zelleHandle);
  const venmoHandle = parseStringPatch(body.venmoHandle);
  const cashAppHandle = parseStringPatch(body.cashAppHandle);
  const manualPaymentInstructions = parseStringPatch(body.manualPaymentInstructions);

  if (
    (body.allowCard !== undefined && allowCard === undefined) ||
    (body.allowAppleGooglePay !== undefined && allowAppleGooglePay === undefined) ||
    (body.allowAch !== undefined && allowAch === undefined) ||
    (body.allowZelle !== undefined && allowZelle === undefined) ||
    (body.allowVenmo !== undefined && allowVenmo === undefined) ||
    (body.allowCashApp !== undefined && allowCashApp === undefined)
  ) {
    return NextResponse.json({ error: 'invalid_boolean_patch' }, { status: 400 });
  }

  if (
    (body.stripeAccountId !== undefined && stripeAccountId === undefined) ||
    (body.zelleHandle !== undefined && zelleHandle === undefined) ||
    (body.venmoHandle !== undefined && venmoHandle === undefined) ||
    (body.cashAppHandle !== undefined && cashAppHandle === undefined) ||
    (body.manualPaymentInstructions !== undefined && manualPaymentInstructions === undefined)
  ) {
    return NextResponse.json({ error: 'invalid_string_patch' }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase || !isUuid(session.eventId)) {
    const current = defaultPaymentSettings(session.eventId, 'revel_managed');
    const next = {
      ...current,
      allowCard: allowCard ?? current.allowCard,
      allowAppleGooglePay: allowAppleGooglePay ?? current.allowAppleGooglePay,
      allowAch: allowAch ?? current.allowAch,
      allowZelle: allowZelle ?? current.allowZelle,
      allowVenmo: allowVenmo ?? current.allowVenmo,
      allowCashApp: allowCashApp ?? current.allowCashApp,
      stripeAccountId: stripeAccountId ?? current.stripeAccountId,
      zelleHandle: zelleHandle ?? current.zelleHandle,
      venmoHandle: venmoHandle ?? current.venmoHandle,
      cashAppHandle: cashAppHandle ?? current.cashAppHandle,
      manualPaymentInstructions: manualPaymentInstructions ?? current.manualPaymentInstructions,
      updatedAt: new Date().toISOString()
    };

    if (next.allowZelle && !next.zelleHandle) {
      return NextResponse.json({ error: 'zelle_handle_required' }, { status: 400 });
    }

    if (next.allowVenmo && !next.venmoHandle) {
      return NextResponse.json({ error: 'venmo_handle_required' }, { status: 400 });
    }

    if (next.allowCashApp && !next.cashAppHandle) {
      return NextResponse.json({ error: 'cash_app_handle_required' }, { status: 400 });
    }

    if (!next.allowZelle) {
      next.zelleHandle = null;
    }

    if (!next.allowVenmo) {
      next.venmoHandle = null;
    }

    if (!next.allowCashApp) {
      next.cashAppHandle = null;
    }

    return NextResponse.json({ source: 'simulation', settings: next }, { status: 200 });
  }

  let mode: 'revel_managed' | 'independent' = 'revel_managed';

  const { data: eventData, error: eventError } = await supabase
    .from('events')
    .select('atlas_mode')
    .eq('event_id', session.eventId)
    .maybeSingle();

  if (eventError) {
    return NextResponse.json({ error: 'event_mode_read_failed', details: eventError.message }, { status: 500 });
  }

  if (!eventData) {
    return NextResponse.json({ error: 'event_not_found' }, { status: 404 });
  }

  mode = parseEventMode(eventData.atlas_mode) ?? 'revel_managed';

  let current;

  try {
    current = (await loadWorkspacePaymentSettings(supabase, session.eventId)).settings;
  } catch (error) {
    const details = error instanceof Error ? error.message : 'unknown_error';
    return NextResponse.json({ error: 'payment_settings_read_failed', details }, { status: 500 });
  }

  const next = {
    ...current,
    allowCard: allowCard ?? current.allowCard,
    allowAppleGooglePay: allowAppleGooglePay ?? current.allowAppleGooglePay,
    allowAch: allowAch ?? current.allowAch,
    allowZelle: allowZelle ?? current.allowZelle,
    allowVenmo: allowVenmo ?? current.allowVenmo,
    allowCashApp: allowCashApp ?? current.allowCashApp,
    stripeAccountId: stripeAccountId ?? current.stripeAccountId,
    zelleHandle: zelleHandle ?? current.zelleHandle,
    venmoHandle: venmoHandle ?? current.venmoHandle,
    cashAppHandle: cashAppHandle ?? current.cashAppHandle,
    manualPaymentInstructions: manualPaymentInstructions ?? current.manualPaymentInstructions,
    updatedAt: new Date().toISOString()
  };

  if (next.allowZelle && !next.zelleHandle) {
    return NextResponse.json({ error: 'zelle_handle_required' }, { status: 400 });
  }

  if (next.allowVenmo && !next.venmoHandle) {
    return NextResponse.json({ error: 'venmo_handle_required' }, { status: 400 });
  }

  if (next.allowCashApp && !next.cashAppHandle) {
    return NextResponse.json({ error: 'cash_app_handle_required' }, { status: 400 });
  }

  if (!next.allowZelle) {
    next.zelleHandle = null;
  }

  if (!next.allowVenmo) {
    next.venmoHandle = null;
  }

  if (!next.allowCashApp) {
    next.cashAppHandle = null;
  }

  const { data: updated, error: upsertError } = await supabase
    .from('atlas_workspace_payment_settings')
    .upsert(
      {
        event_id: session.eventId,
        allow_card: next.allowCard,
        allow_apple_google_pay: next.allowAppleGooglePay,
        allow_ach: next.allowAch,
        allow_zelle: next.allowZelle,
        allow_venmo: next.allowVenmo,
        allow_cash_app: next.allowCashApp,
        accept_checks: false,
        stripe_account_id: next.stripeAccountId,
        zelle_handle: next.zelleHandle,
        venmo_handle: next.venmoHandle,
        cash_app_handle: next.cashAppHandle,
        manual_payment_instructions: next.manualPaymentInstructions,
        updated_at: next.updatedAt
      },
      { onConflict: 'event_id' }
    )
    .select(
      'event_id,allow_card,allow_apple_google_pay,allow_ach,allow_zelle,allow_venmo,allow_cash_app,accept_checks,stripe_account_id,zelle_handle,venmo_handle,cash_app_handle,manual_payment_instructions,updated_at'
    )
    .maybeSingle();

  if (upsertError) {
    return NextResponse.json({ error: 'payment_settings_write_failed', details: upsertError.message }, { status: 500 });
  }

  if (!updated) {
    return NextResponse.json({ error: 'payment_settings_write_failed' }, { status: 500 });
  }

  return NextResponse.json(
    {
      source: 'supabase',
      mode,
      settings: {
        eventId: updated.event_id,
        allowCard: updated.allow_card,
        allowAppleGooglePay: updated.allow_apple_google_pay,
        allowAch: updated.allow_ach,
        allowZelle: updated.allow_zelle,
        allowVenmo: updated.allow_venmo,
        allowCashApp: updated.allow_cash_app,
        acceptChecks: false,
        stripeAccountId: updated.stripe_account_id,
        zelleHandle: updated.zelle_handle,
        venmoHandle: updated.venmo_handle,
        cashAppHandle: updated.cash_app_handle,
        manualPaymentInstructions: updated.manual_payment_instructions,
        updatedAt: updated.updated_at
      }
    },
    { status: 200 }
  );
}
