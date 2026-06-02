'use client';

import { useEffect, useMemo, useState } from 'react';

type PaymentSettings = {
  eventId: string;
  allowCard: boolean;
  allowAppleGooglePay: boolean;
  allowAch: boolean;
  allowZelle: boolean;
  allowVenmo: boolean;
  allowCashApp: boolean;
  acceptChecks: false;
  stripeAccountId: string | null;
  zelleHandle: string | null;
  venmoHandle: string | null;
  cashAppHandle: string | null;
  manualPaymentInstructions: string | null;
  updatedAt: string | null;
};

function emptySettings(): PaymentSettings {
  return {
    eventId: '',
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

export default function WorkspacePaymentSettingsPanel() {
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/events/payment-settings', { cache: 'no-store' });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error ?? 'payment_settings_load_failed');
        }

        if (!mounted) {
          return;
        }

        setSettings((payload?.settings ?? emptySettings()) as PaymentSettings);
      } catch (loadError) {
        if (!mounted) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : 'payment_settings_load_failed');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  const disabled = useMemo(() => loading || saving || !settings, [loading, saving, settings]);

  function patchBoolean<K extends keyof Pick<PaymentSettings, 'allowCard' | 'allowAppleGooglePay' | 'allowAch' | 'allowZelle' | 'allowVenmo' | 'allowCashApp'>>(
    key: K,
    value: boolean
  ) {
    setSettings((current) => {
      if (!current) return current;
      return { ...current, [key]: value };
    });
  }

  function patchString<K extends keyof Pick<PaymentSettings, 'stripeAccountId' | 'zelleHandle' | 'venmoHandle' | 'cashAppHandle' | 'manualPaymentInstructions'>>(
    key: K,
    value: string
  ) {
    setSettings((current) => {
      if (!current) return current;
      return { ...current, [key]: value || null };
    });
  }

  async function saveSettings() {
    if (!settings) {
      return;
    }

    setSaving(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch('/api/events/payment-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allowCard: settings.allowCard,
          allowAppleGooglePay: settings.allowAppleGooglePay,
          allowAch: settings.allowAch,
          allowZelle: settings.allowZelle,
          allowVenmo: settings.allowVenmo,
          allowCashApp: settings.allowCashApp,
          stripeAccountId: settings.stripeAccountId,
          zelleHandle: settings.zelleHandle,
          venmoHandle: settings.venmoHandle,
          cashAppHandle: settings.cashAppHandle,
          manualPaymentInstructions: settings.manualPaymentInstructions
        })
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error ?? 'payment_settings_save_failed');
      }

      setSettings((payload?.settings ?? settings) as PaymentSettings);
      setNotice('Payment settings updated. Checks remain disabled by policy.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'payment_settings_save_failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="client-panel">
      <div className="client-panel__header">
        <div>
          <h2 className="client-panel__title">Workspace Payment Methods</h2>
          <p className="client-panel__sub">Stripe rails are primary. Manual rails are optional and must include valid handles.</p>
        </div>
      </div>

      {loading ? <p className="card-muted">Loading payment settings...</p> : null}
      {error ? <p className="payment-settings-error">Unable to save settings: {error}</p> : null}
      {notice ? <p className="payment-settings-success">{notice}</p> : null}

      {settings ? (
        <>
          <div className="payment-settings-grid">
            <label className="payment-rail-toggle">
              <input
                type="checkbox"
                checked={settings.allowCard}
                onChange={(event) => patchBoolean('allowCard', event.target.checked)}
                disabled={disabled}
              />
              <span>Credit / debit card (Stripe)</span>
            </label>

            <label className="payment-rail-toggle">
              <input
                type="checkbox"
                checked={settings.allowAppleGooglePay}
                onChange={(event) => patchBoolean('allowAppleGooglePay', event.target.checked)}
                disabled={disabled || !settings.allowCard}
              />
              <span>Apple Pay / Google Pay</span>
            </label>

            <label className="payment-rail-toggle">
              <input
                type="checkbox"
                checked={settings.allowAch}
                onChange={(event) => patchBoolean('allowAch', event.target.checked)}
                disabled={disabled}
              />
              <span>ACH bank transfer (Stripe)</span>
            </label>

            <label className="payment-rail-toggle">
              <input
                type="checkbox"
                checked={settings.allowZelle}
                onChange={(event) => patchBoolean('allowZelle', event.target.checked)}
                disabled={disabled}
              />
              <span>Zelle (manual)</span>
            </label>

            <label className="payment-rail-toggle">
              <input
                type="checkbox"
                checked={settings.allowVenmo}
                onChange={(event) => patchBoolean('allowVenmo', event.target.checked)}
                disabled={disabled}
              />
              <span>Venmo (manual)</span>
            </label>

            <label className="payment-rail-toggle">
              <input
                type="checkbox"
                checked={settings.allowCashApp}
                onChange={(event) => patchBoolean('allowCashApp', event.target.checked)}
                disabled={disabled}
              />
              <span>Cash App (manual)</span>
            </label>
          </div>

          <div className="payment-settings-fields">
            <label>
              Stripe connected account ID
              <input
                className="input"
                type="text"
                value={settings.stripeAccountId ?? ''}
                onChange={(event) => patchString('stripeAccountId', event.target.value)}
                disabled={disabled}
                placeholder="acct_..."
              />
            </label>

            <label>
              Zelle handle
              <input
                className="input"
                type="text"
                value={settings.zelleHandle ?? ''}
                onChange={(event) => patchString('zelleHandle', event.target.value)}
                disabled={disabled || !settings.allowZelle}
                placeholder="finance@yourdomain.com"
              />
            </label>

            <label>
              Venmo handle
              <input
                className="input"
                type="text"
                value={settings.venmoHandle ?? ''}
                onChange={(event) => patchString('venmoHandle', event.target.value)}
                disabled={disabled || !settings.allowVenmo}
                placeholder="@yourhandle"
              />
            </label>

            <label>
              Cash App handle
              <input
                className="input"
                type="text"
                value={settings.cashAppHandle ?? ''}
                onChange={(event) => patchString('cashAppHandle', event.target.value)}
                disabled={disabled || !settings.allowCashApp}
                placeholder="$yourcashtag"
              />
            </label>

            <label className="payment-settings-textarea-wrap">
              Manual payment instructions
              <textarea
                className="input payment-settings-textarea"
                value={settings.manualPaymentInstructions ?? ''}
                onChange={(event) => patchString('manualPaymentInstructions', event.target.value)}
                disabled={disabled}
                rows={4}
                placeholder="Example: Include event ID in memo and send confirmation screenshot to coordinator."
              />
            </label>
          </div>

          <div className="payment-settings-footer">
            <span className="payment-settings-policy">Checks are permanently disabled by policy.</span>
            <button className="btn" type="button" onClick={() => void saveSettings()} disabled={disabled}>
              {saving ? 'Saving...' : 'Save Payment Settings'}
            </button>
          </div>
        </>
      ) : null}
    </section>
  );
}
