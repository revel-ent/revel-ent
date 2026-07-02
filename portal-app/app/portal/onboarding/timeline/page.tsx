'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import GeneratedTimelinePreview, {
  type GenerateResponse
} from '@/app/portal/components/timeline/GeneratedTimelinePreview';

export default function OnboardingTimelinePage() {
  const router = useRouter();
  const params = useSearchParams();

  const venueId = params.get('venueId') ?? '';
  const guestCount = params.get('guestCount') ?? '300';
  const weddingDate = params.get('weddingDate') ?? '';
  const tradition = params.get('tradition') ?? '';
  const coupleName = params.get('coupleName') ?? '';

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
          body: JSON.stringify({ venueId, weddingDate, tradition })
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
  }, [venueId, weddingDate, tradition]);

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
          eventLabel: coupleName ? `${coupleName} Wedding Weekend` : 'Wedding Weekend',
          couplePrimaryName: coupleName || 'New Couple'
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
        <div className="portal-hero">
          <header className="portal-page-header">
            <span className="badge">Concierge Onboarding · Step 2 of 2</span>
            <h1 className="page-title">
              {coupleName ? `${coupleName} — Baseline Timeline` : 'Your Baseline Weekend Timeline'}
            </h1>
            <p className="page-subtitle">
              Atlas built this timeline from your venue constraints. Review and approve to enter the portal.
            </p>
          </header>
        </div>

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
            <GeneratedTimelinePreview result={result} />

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
