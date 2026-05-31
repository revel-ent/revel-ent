"use client";

import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';

type DeliveryChannel = 'email' | 'whatsapp' | 'both';

interface SendAttempt {
  recipient: string;
  status: 'sent' | 'simulated' | 'failed';
  detail: string;
}

interface DispatchResult {
  channel: 'email' | 'whatsapp';
  attempts: SendAttempt[];
}

interface ToolResponse {
  mode: 'dry-run' | 'dispatch';
  channel: DeliveryChannel;
  recipients: string[];
  recipientGroups?: {
    email: string[];
    whatsapp: string[];
    unclassified: string[];
  };
  summaryText: string;
  itemCount: number;
  sendResults?: DispatchResult[];
}

function parseRecipients(raw: string): string[] {
  return raw
    .split(/[\n,;]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function createSummaryFilename(): string {
  const date = new Date().toISOString().slice(0, 10);
  return `revel-ops-summary-${date}.txt`;
}

export default function OperationsDispatchTool() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ToolResponse | null>(null);
  const [recipientInput, setRecipientInput] = useState(
    'info@revel-ent.com, +17065774914'
  );
  const [customIntro, setCustomIntro] = useState(
    'Please review the latest event operations updates and acknowledge blockers immediately.'
  );
  const [channel, setChannel] = useState<DeliveryChannel>('both');

  const canExport = Boolean(result?.summaryText);

  const sendStatusSummary = useMemo(() => {
    if (!result?.sendResults) {
      return null;
    }

    const totals = result.sendResults.flatMap((entry) => entry.attempts).reduce(
      (acc, attempt) => {
        acc[attempt.status] += 1;
        return acc;
      },
      { sent: 0, simulated: 0, failed: 0 }
    );

    return totals;
  }, [result]);

  async function submit(mode: 'dry-run' | 'dispatch') {
    setLoading(true);
    setError(null);

    try {
      const recipients = parseRecipients(recipientInput);

      if (recipients.length === 0) {
        throw new Error('Add at least one recipient email or phone number.');
      }

      const response = await fetch('/api/ops/dispatch-updates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipients,
          channel,
          customIntro,
          dryRun: mode === 'dry-run'
        })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error || 'Unable to process operations update.');
      }

      const payload = (await response.json()) as ToolResponse;
      setResult(payload);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }

  function handleExport() {
    if (!result?.summaryText) {
      return;
    }

    const blob = new Blob([result.summaryText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = createSummaryFilename();
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <article className="card">
      <div className="card-header">
        <h3>Operations Update Dispatch</h3>
        <span className="chip">Planner Ops</span>
      </div>
      <p>Generate clean event summaries and push them through email or WhatsApp in one workflow.</p>

      <form
        className="tool-form"
        onSubmit={async (event: FormEvent<HTMLFormElement>) => {
          event.preventDefault();
          await submit('dry-run');
        }}
      >
        <label htmlFor="dispatchRecipients">Recipients (comma, semicolon, or newline separated)</label>
        <textarea
          id="dispatchRecipients"
          name="dispatchRecipients"
          value={recipientInput}
          onChange={(event) => setRecipientInput(event.target.value)}
          rows={3}
          required
        />

        <label htmlFor="dispatchChannel">Channel</label>
        <select
          id="dispatchChannel"
          name="dispatchChannel"
          value={channel}
          onChange={(event) => setChannel(event.target.value as DeliveryChannel)}
        >
          <option value="both">Email + WhatsApp</option>
          <option value="email">Email only</option>
          <option value="whatsapp">WhatsApp only</option>
        </select>

        <label htmlFor="dispatchIntro">Intro line</label>
        <textarea
          id="dispatchIntro"
          name="dispatchIntro"
          value={customIntro}
          onChange={(event) => setCustomIntro(event.target.value)}
          rows={3}
        />

        <div className="split">
          <button className="btn secondary" type="submit" disabled={loading}>
            {loading ? 'Working...' : 'Preview Summary'}
          </button>
          <button
            className="btn primary"
            type="button"
            onClick={async () => {
              await submit('dispatch');
            }}
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Update'}
          </button>
          <button className="btn secondary" type="button" onClick={handleExport} disabled={!canExport}>
            Export Summary
          </button>
        </div>
      </form>

      {error ? <p className="alert error">{error}</p> : null}

      {result ? (
        <div className="tool-result">
          <div className="data-row">
            <div className="item-title-row">
              <strong className="item-title">Dispatch Summary</strong>
              <span className={`status-chip ${result.mode === 'dispatch' ? 'sent' : 'simulated'}`}>{result.mode}</span>
            </div>
            <p className="item-meta">Feed entries included: {result.itemCount}</p>
            <p className="item-meta">Recipients: {result.recipients.join(', ')}</p>
          </div>

          {result.recipientGroups ? (
            <p>
              <strong>Recipient groups:</strong> Email {result.recipientGroups.email.length} | WhatsApp {result.recipientGroups.whatsapp.length} | Unclassified {result.recipientGroups.unclassified.length}
            </p>
          ) : null}

          {sendStatusSummary ? (
            <p>
              <strong>Delivery status:</strong> Sent {sendStatusSummary.sent} | Simulated {sendStatusSummary.simulated} | Failed {sendStatusSummary.failed}
            </p>
          ) : null}

          {result.sendResults?.map((entry) => (
            <div key={entry.channel} className="data-row">
              <p>
                <strong>{entry.channel.toUpperCase()} results</strong>
              </p>
              <ul className="clean-list">
                {entry.attempts.map((attempt) => (
                  <li key={`${entry.channel}-${attempt.recipient}`} className="data-row">
                    <div className="item-title-row">
                      <span>{attempt.recipient}</span>
                      <span className={`status-chip ${attempt.status}`}>{attempt.status.toUpperCase()}</span>
                    </div>
                    <p className="item-note">{attempt.detail}</p>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <p>
            <strong>Summary preview:</strong>
          </p>
          <pre
            style={{
              whiteSpace: 'pre-wrap',
              background: '#f7f1e8',
              padding: '0.9rem',
              borderRadius: '0.5rem',
              border: '1px solid rgba(189, 161, 123, 0.48)'
            }}
          >
            {result.summaryText}
          </pre>
        </div>
      ) : null}
    </article>
  );
}