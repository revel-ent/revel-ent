import type { SupabaseClient } from '@supabase/supabase-js';

import type { AtlasEventMode, AtlasWorkspacePaymentSettings } from '@/lib/atlas-types';

export function defaultPaymentSettings(eventId: string, mode: AtlasEventMode): AtlasWorkspacePaymentSettings {
  return {
    eventId,
    allowCard: true,
    allowAppleGooglePay: true,
    allowAch: true,
    allowZelle: false,
    allowVenmo: false,
    allowCashApp: false,
    acceptChecks: false,
    stripeAccountId: null,
    zelleHandle: null,
    venmoHandle: null,
    cashAppHandle: null,
    manualPaymentInstructions: null,
    updatedAt: null
  };
}

export function parseBooleanPatch(value: unknown): boolean | undefined {
  if (value === undefined) {
    return undefined;
  }

  return typeof value === 'boolean' ? value : undefined;
}

export function parseStringPatch(value: unknown): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export interface LoadWorkspacePaymentSettingsResult {
  source: 'supabase' | 'default';
  mode: AtlasEventMode;
  settings: AtlasWorkspacePaymentSettings;
}

export async function loadWorkspacePaymentSettings(
  supabase: SupabaseClient,
  eventId: string
): Promise<LoadWorkspacePaymentSettingsResult> {
  const { data: eventData, error: eventError } = await supabase
    .from('events')
    .select('atlas_mode')
    .eq('event_id', eventId)
    .maybeSingle();

  if (eventError) {
    throw new Error(`event_mode_read_failed:${eventError.message}`);
  }

  if (!eventData) {
    throw new Error('event_not_found');
  }

  const mode: AtlasEventMode = eventData.atlas_mode === 'independent' ? 'independent' : 'revel_managed';

  const { data: settingsData, error: settingsError } = await supabase
    .from('atlas_workspace_payment_settings')
    .select(
      'event_id,allow_card,allow_apple_google_pay,allow_ach,allow_zelle,allow_venmo,allow_cash_app,accept_checks,stripe_account_id,zelle_handle,venmo_handle,cash_app_handle,manual_payment_instructions,updated_at'
    )
    .eq('event_id', eventId)
    .maybeSingle();

  if (settingsError) {
    throw new Error(`payment_settings_read_failed:${settingsError.message}`);
  }

  if (!settingsData) {
    return {
      source: 'default',
      mode,
      settings: defaultPaymentSettings(eventId, mode)
    };
  }

  return {
    source: 'supabase',
    mode,
    settings: {
      eventId: settingsData.event_id,
      allowCard: settingsData.allow_card,
      allowAppleGooglePay: settingsData.allow_apple_google_pay,
      allowAch: settingsData.allow_ach,
      allowZelle: settingsData.allow_zelle,
      allowVenmo: settingsData.allow_venmo,
      allowCashApp: settingsData.allow_cash_app,
      acceptChecks: false,
      stripeAccountId: settingsData.stripe_account_id,
      zelleHandle: settingsData.zelle_handle,
      venmoHandle: settingsData.venmo_handle,
      cashAppHandle: settingsData.cash_app_handle,
      manualPaymentInstructions: settingsData.manual_payment_instructions,
      updatedAt: settingsData.updated_at
    }
  };
}
