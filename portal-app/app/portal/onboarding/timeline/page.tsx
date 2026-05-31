'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface TimelineItem {
  phaseCode: string;
  title: string;
  scheduledStartIso: string;
  scheduledEndIso: string;
  escalationHint: string | null;
}

interface GenerateResponse {
  venue: {
    name: string;
    city: string;
  };
  venueIntelligence: {
    sourceConfidence: 'vendor_verified' | 'partially_verified' | 'unverified';
    topConstraints: Array<{
      key: string;
      label: string;
      value: string;
      notes: string | null;
    }>;
    sourceLinks: Array<{ label: string; url: string }>;
  };
  weddingDate: string;
  items: TimelineItem[];
  warnings: string[];
  templateSource: 'database' | 'fallback';
  persistenceMode: 'supabase_configured' | 'simulated';
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

function phaseLabel(code: string): string {
  const map: Record<string, string> = {
    mehndi: 'Mehndi',
    haldi: 'Haldi',
    sangeet: 'Sangeet',
    baraat: 'Baraat',
    ceremony: 'Ceremony',
    reception: 'Reception'
  };

  return map[code] ?? code;
}

function confidenceLabel(value: GenerateResponse['venueIntelligence']['sourceConfidence']): string {
  return value.replace('_', ' ');
}

export default function OnboardingTimelinePage() {
  const router = useRouter();
  const params = useSearchParams();

  const venueId = params.get('venueId') ?? '';
  const guestCount = params.get('guestCount') ?? '300';
  const weddingDate = params.get('weddingDate') ?? '';

  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [approvalMessage, setApprovalMessage] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadTimeline() {
      if (!venueId) {
        setError('Venue selection is missing. Return to Screen 1.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/onboarding/timeline/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ venueId, weddingDate })
        });

        if (!response.ok) {
          throw new Error('Timeline generation failed');
        }

        const payload = (await response.json()) as GenerateResponse;

        if (!cancelled) {
          setResult(payload);
        }
      } catch {
        if (!cancelled) {
          setError('We could not generate your baseline timeline right now. Please retry.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadTimeline();

    return () => {
      cancelled = true;
    };
  }, [venueId, weddingDate]);

  const grouped = useMemo(() => {
    if (!result) {
      return [] as Array<{ phase: string; items: TimelineItem[] }>;
    }

    const byPhase = new Map<string, TimelineItem[]>();

    result.items.forEach((item) => {
      const current = byPhase.get(item.phaseCode) ?? [];
      current.push(item);
      byPhase.set(item.phaseCode, current);
    });

    return Array.from(byPhase.entries()).map(([phase, items]) => ({ phase, items }));
  }, [result]);

  async function onApprove() {
    if (!result) {
      return;
    }

    setApproving(true);
    setApprovalMessage(null);
    setError(null);

    try {
      const response = await fetch('/api/onboarding/timeline/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venueId,
          guestCount,
          weddingDate,
          eventLabel: 'Onboarding Generated Wedding Weekend',
          couplePrimaryName: 'REVEL Couple'
        })
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error ?? 'Approval failed');
      }

      setApprovalMessage(payload.message ?? 'Timeline approved. Entering portal...');
      router.push('/portal');
    } catch {
      setError('Approval failed. Please try again.');
    } finally {
      setApproving(false);
    }
  }

  return (
    <section className="page-wrap">
      <div style={{ maxWidth: 920, margin: '0 auto', display: 'grid', gap: '0.9rem' }}>
        <header className="portal-page-header">
          <span className="badge">Concierge Onboarding · Screen 2 of 4</span>
          <h1 className="page-title">Your Baseline Weekend Timeline</h1>
          <p className="page-subtitle">
            We prepared a starter timeline using your selected venue constraints. Review and approve to enter the portal.
          </p>
        </header>

        {loading ? (
          <article className="card">
            <div className="skeleton skeleton-line wide" />
            <div className="skeleton skeleton-line mid" />
            <div className="skeleton skeleton-line short" />
          </article>
        ) : null}

        {error ? (
          <article className="alert error">
            <strong>{error}</strong>
          </article>
        ) : null}

        {result ? (
          <>
            <article className="card">
              <div className="card-header">
                <h3>{result.venue.name}</h3>
                <span className="chip">Venue Baseline</span>
              </div>
              <p>{result.venue.city}</p>
              <p className="card-muted">
                Template source: {result.templateSource === 'database' ? 'Supabase templates' : 'Fallback baseline'}
              </p>
              <p className="card-muted">
                Confidence: <strong>{confidenceLabel(result.venueIntelligence.sourceConfidence)}</strong>
              </p>

              {result.venueIntelligence.topConstraints.length > 0 ? (
                <div className="stack" style={{ marginTop: '0.6rem' }}>
                  <strong className="item-title">Top venue constraints</strong>
                  <ul className="clean-list">
                    {result.venueIntelligence.topConstraints.map((constraint) => (
                      <li key={constraint.key} className="data-row">
                        <strong className="item-title">{constraint.label}</strong>
                        <p className="item-meta">{constraint.value}</p>
                        {constraint.notes ? <p className="item-note">{constraint.notes}</p> : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {result.venueIntelligence.sourceLinks.length > 0 ? (
                <div className="stack" style={{ marginTop: '0.6rem' }}>
                  <strong className="item-title">Source links</strong>
                  <ul className="clean-list">
                    {result.venueIntelligence.sourceLinks.map((link) => (
                      <li key={link.url} className="data-row">
                        <a href={link.url} target="_blank" rel="noreferrer" className="item-note">
                          {link.label || link.url}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </article>

            {result.warnings.length > 0 ? (
              <article className="card">
                <h3>Important Planning Notes</h3>
                <ul>
                  {result.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </article>
            ) : null}

            <div className="stack">
              {grouped.map((phaseGroup) => (
                <article key={phaseGroup.phase} className="card">
                  <div className="card-header">
                    <h3>{phaseLabel(phaseGroup.phase)}</h3>
                    <span className="chip">Phase</span>
                  </div>
                  {phaseGroup.items.map((item) => (
                    <div key={`${item.phaseCode}-${item.title}-${item.scheduledStartIso}`} className="data-row">
                      <strong className="item-title">{item.title}</strong>
                      <p className="item-meta">
                        {formatTime(item.scheduledStartIso)} - {formatTime(item.scheduledEndIso)}
                      </p>
                      {item.escalationHint ? (
                        <p className="item-note">{item.escalationHint}</p>
                      ) : null}
                    </div>
                  ))}
                </article>
              ))}
            </div>

            {approvalMessage ? (
              <article className="alert success">
                <strong>{approvalMessage}</strong>
              </article>
            ) : null}

            <div className="split">
              <button className="btn secondary" type="button" onClick={() => router.push('/portal/onboarding')}>
                Back to Venue Step
              </button>
              <button className="btn primary" type="button" onClick={onApprove} disabled={approving}>
                {approving ? 'Approving...' : 'Approve & Enter Portal'}
              </button>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
