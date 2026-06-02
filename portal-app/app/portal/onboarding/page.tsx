'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type CapacityStatus = 'safe' | 'tight' | 'unsafe';

interface CapacityCheckResponse {
  status: CapacityStatus;
  message: string;
  venue: {
    name: string;
    city: string;
    marketedCapacity: number;
    comfortableRangeMin: number;
    comfortableRangeMax: number;
    notes: string[];
    constraintsSummary: string;
    sourceConfidence: 'vendor_verified' | 'partially_verified' | 'unverified';
  };
  atlasOutdoorPowerCurfew?: {
    triggerKey: string;
    groupedRecommendationKey: string;
    status: 'active' | 'needs_review' | 'suppressed';
    severity: 'info' | 'warning' | 'critical';
    confidence: number;
    fired: boolean;
    title: string;
    message: string;
    cta: string;
    evidence: Record<string, unknown>;
    missingFields: string[];
    fingerprint: string | null;
  } | null;
  atlasEvaluationPersistenceMode?: 'persisted' | 'skipped';
}

interface OnboardingVenue {
  id: string;
  name: string;
  city: string;
  marketedCapacity: number;
  comfortableRangeMin: number;
  comfortableRangeMax: number;
  notes: string[];
  constraintsSummary: string;
  sourceConfidence: 'vendor_verified' | 'partially_verified' | 'unverified';
}

interface OnboardingVenueListResponse {
  venues: OnboardingVenue[];
  source: 'database' | 'fallback';
}

const ONBOARDING_ROLE_OPTIONS = [
  { value: 'couple', label: 'Client (Couple)' },
  { value: 'planner', label: 'Planner' },
  { value: 'decorator', label: 'Decorator' },
  { value: 'vendor', label: 'Vendor' },
  { value: 'guest', label: 'Guest' },
  { value: 'delegate_coordinator', label: 'Family Coordinator' }
] as const;

function getStatusTone(status: CapacityStatus) {
  if (status === 'safe') {
    return { label: 'Comfortable Fit', color: '#275d3d', bg: '#e5f3e8' };
  }

  if (status === 'tight') {
    return { label: 'Needs Review', color: '#7a5602', bg: '#f8efd8' };
  }

  return { label: 'At Risk', color: '#7b241c', bg: '#f8e3df' };
}

export default function ConciergeOnboardingPage() {
  const router = useRouter();
  const [workflowRole, setWorkflowRole] = useState<string>(() => {
    if (typeof window === 'undefined') {
      return 'couple';
    }

    const stored = window.localStorage.getItem('revel.portal.persona');

    if (stored && ONBOARDING_ROLE_OPTIONS.some((option) => option.value === stored)) {
      return stored;
    }

    return 'couple';
  });
  const [venueId, setVenueId] = useState('');
  const [venues, setVenues] = useState<OnboardingVenue[]>([]);
  const [venueSource, setVenueSource] = useState<'database' | 'fallback'>('fallback');
  const [venuesLoading, setVenuesLoading] = useState(true);
  const [guestCount, setGuestCount] = useState('300');
  const [weddingDate, setWeddingDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CapacityCheckResponse | null>(null);

  useEffect(() => {
    let active = true;

    async function loadVenues() {
      setVenuesLoading(true);

      try {
        const response = await fetch('/api/onboarding/venues', { cache: 'no-store' });

        if (!response.ok) {
          throw new Error('Unable to load venues');
        }

        const payload = (await response.json()) as OnboardingVenueListResponse;

        if (!active) {
          return;
        }

        setVenues(payload.venues);
        setVenueSource(payload.source);
        setVenueId((current) => current || payload.venues[0]?.id || '');
      } catch {
        if (active) {
          setVenues([]);
          setVenueId('');
          setError('We could not load Atlas venues right now. Please refresh and try again.');
        }
      } finally {
        if (active) {
          setVenuesLoading(false);
        }
      }
    }

    void loadVenues();

    return () => {
      active = false;
    };
  }, []);

  const selectedVenue = useMemo(
    () => venues.find((venue) => venue.id === venueId) ?? null,
    [venueId, venues]
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/onboarding/venue-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ venueId, guestCount })
      });

      if (!response.ok) {
        setResult(null);
        setError('We could not validate this venue right now. Please try again.');
        return;
      }

      const payload = (await response.json()) as CapacityCheckResponse;
      setResult(payload);
    } catch {
      setResult(null);
      setError('Network issue while validating venue details. Please retry.');
    } finally {
      setLoading(false);
    }
  }

  const tone = result ? getStatusTone(result.status) : null;

  return (
    <section className="page-wrap">
      <div style={{ maxWidth: 860, margin: '0 auto', display: 'grid', gap: '0.95rem' }}>
        <header className="portal-page-header">
          <span className="badge">Concierge Onboarding · Screen 1 of 4</span>
          <h1 className="page-title">Secure Venue Baseline</h1>
          <p className="page-subtitle">
            Select your venue and estimated guest count. We will validate capacity assumptions against Atlas constraints
            and prepare your starting timeline.
          </p>
        </header>

        <section className="card stack">
          <div className="card-header">
            <h3>Who Are You In This Wedding?</h3>
            <span className="chip">Orientation</span>
          </div>
          <p className="card-muted">
            We tailor guidance, next-best actions, and workspace language to your role so planning is faster and
            clearer.
          </p>
          <label htmlFor="workflowRole">I am onboarding as</label>
          <select
            id="workflowRole"
            value={workflowRole}
            onChange={(event) => {
              const nextRole = event.target.value;
              setWorkflowRole(nextRole);
              window.localStorage.setItem('revel.portal.persona', nextRole);
            }}
          >
            {ONBOARDING_ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </section>

        <form className="card tool-form" onSubmit={onSubmit}>
          <label htmlFor="venue">Venue</label>
          <select
            id="venue"
            value={venueId}
            onChange={(event) => setVenueId(event.target.value)}
            required
            disabled={venuesLoading || venues.length === 0}
          >
            {venuesLoading ? <option value="">Loading Atlas venues...</option> : null}
            {!venuesLoading && venues.length === 0 ? <option value="">No venues available</option> : null}
            {venues.map((venue) => (
              <option key={venue.id} value={venue.id}>
                {venue.name} · {venue.city}
              </option>
            ))}
          </select>

          <label htmlFor="guests">Estimated Guest Count</label>
          <input
            id="guests"
            type="number"
            min={10}
            step={1}
            value={guestCount}
            onChange={(event) => setGuestCount(event.target.value)}
            required
          />

          <label htmlFor="wedding-date">Primary Wedding Date</label>
          <input
            id="wedding-date"
            type="date"
            value={weddingDate}
            onChange={(event) => setWeddingDate(event.target.value)}
          />

          <button className="btn primary" type="submit" disabled={loading || venuesLoading || !venueId}>
            {loading ? 'Validating...' : 'Verify and Continue'}
          </button>
        </form>

        {selectedVenue ? (
          <div className="card">
            <div className="card-header">
              <h3>Atlas Snapshot</h3>
              <span className="chip">Trust Layer</span>
            </div>
            <p>{selectedVenue.constraintsSummary}</p>
            <p className="card-muted">
              Comfortable range: {selectedVenue.comfortableRangeMin} - {selectedVenue.comfortableRangeMax} guests
            </p>
            <p className="item-note">Data source: {venueSource === 'database' ? 'Atlas Supabase sync' : 'Fallback seed'}</p>
          </div>
        ) : null}

        {result?.atlasOutdoorPowerCurfew ? (
          <article className="card">
            <div className="card-header">
              <h3>{result.atlasOutdoorPowerCurfew.title}</h3>
              <span className={`status-chip ${result.atlasOutdoorPowerCurfew.severity}`}>{result.atlasOutdoorPowerCurfew.severity}</span>
            </div>
            <p>{result.atlasOutdoorPowerCurfew.message}</p>
            <p className="card-muted">
              Recommendation: <strong>{result.atlasOutdoorPowerCurfew.cta}</strong>
            </p>
            <p className="item-note">
              Confidence: {Math.round(result.atlasOutdoorPowerCurfew.confidence * 100)}% · Persistence: {result.atlasEvaluationPersistenceMode}
            </p>
            {result.atlasOutdoorPowerCurfew.missingFields.length > 0 ? (
              <p className="item-note">
                Needs confirmation: {result.atlasOutdoorPowerCurfew.missingFields.join(', ')}
              </p>
            ) : null}
          </article>
        ) : null}

        {error ? (
          <div className="alert error">
            <strong>{error}</strong>
          </div>
        ) : null}

        {result && tone ? (
          <div className="card stack">
            <div className={`status-chip ${result.status}`}>{tone.label}</div>
            <p className="card-muted">{result.message}</p>
            <ul>
              {result.venue.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
            <button
              className="btn primary"
              type="button"
              onClick={() => {
                const query = new URLSearchParams({ venueId, guestCount });

                if (weddingDate) {
                  query.set('weddingDate', weddingDate);
                }

                router.push(`/portal/onboarding/timeline?${query.toString()}`);
              }}
            >
              Continue to Event Sequence
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
