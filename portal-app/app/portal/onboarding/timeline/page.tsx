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
    <section>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <span className="badge" style={{ marginBottom: '0.8rem', display: 'inline-block' }}>
          Concierge Onboarding · Screen 2 of 4
        </span>
        <h1 style={{ fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          Your Baseline Weekend Timeline
        </h1>
        <p style={{ color: '#4e4339', lineHeight: 1.7 }}>
          We prepared a starter timeline using your selected venue constraints. Review and approve to enter the portal.
        </p>

        {loading ? (
          <article className="card" style={{ marginTop: '1rem' }}>
            <p style={{ margin: 0 }}>Preparing your itinerary...</p>
          </article>
        ) : null}

        {error ? (
          <article className="card" style={{ marginTop: '1rem', borderColor: '#c18476' }}>
            <strong>{error}</strong>
          </article>
        ) : null}

        {result ? (
          <>
            <article className="card" style={{ marginTop: '1rem' }}>
              <h3 style={{ marginTop: 0 }}>{result.venue.name}</h3>
              <p style={{ color: '#4e4339', marginBottom: '0.4rem' }}>{result.venue.city}</p>
              <p style={{ color: '#4e4339', margin: 0 }}>
                Template source: {result.templateSource === 'database' ? 'Supabase templates' : 'Fallback baseline'}
              </p>
            </article>

            {result.warnings.length > 0 ? (
              <article className="card" style={{ marginTop: '0.9rem', borderColor: '#d3b277' }}>
                <h3 style={{ marginTop: 0 }}>Important Planning Notes</h3>
                <ul style={{ color: '#4e4339', lineHeight: 1.6 }}>
                  {result.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </article>
            ) : null}

            <div style={{ display: 'grid', gap: '0.75rem', marginTop: '0.9rem' }}>
              {grouped.map((phaseGroup) => (
                <article key={phaseGroup.phase} className="card">
                  <h3 style={{ marginTop: 0 }}>{phaseLabel(phaseGroup.phase)}</h3>
                  {phaseGroup.items.map((item) => (
                    <div key={`${item.phaseCode}-${item.title}-${item.scheduledStartIso}`} style={{ marginBottom: '0.55rem' }}>
                      <strong>{item.title}</strong>
                      <p style={{ margin: '0.25rem 0', color: '#4e4339' }}>
                        {formatTime(item.scheduledStartIso)} - {formatTime(item.scheduledEndIso)}
                      </p>
                      {item.escalationHint ? (
                        <p style={{ margin: 0, color: '#4e4339' }}>{item.escalationHint}</p>
                      ) : null}
                    </div>
                  ))}
                </article>
              ))}
            </div>

            {approvalMessage ? (
              <article className="card" style={{ marginTop: '0.9rem', borderColor: '#8ab48a' }}>
                <strong>{approvalMessage}</strong>
              </article>
            ) : null}

            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              <button className="btn" type="button" onClick={() => router.push('/portal/onboarding')}>
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
