'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { ATLAS_VENUE_SEEDS } from '@/lib/atlas-venues';

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
}

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
  const [venueId, setVenueId] = useState(ATLAS_VENUE_SEEDS[0]?.id ?? '');
  const [guestCount, setGuestCount] = useState('300');
  const [weddingDate, setWeddingDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CapacityCheckResponse | null>(null);

  const selectedVenue = useMemo(
    () => ATLAS_VENUE_SEEDS.find((venue) => venue.id === venueId) ?? null,
    [venueId]
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
    <section>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <span className="badge" style={{ marginBottom: '0.8rem', display: 'inline-block' }}>
          Concierge Onboarding · Screen 1 of 4
        </span>
        <h1 style={{ fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          Secure Venue Baseline
        </h1>
        <p style={{ color: '#4e4339', lineHeight: 1.7, marginBottom: '1.25rem' }}>
          Select your venue and estimated guest count. We will validate capacity assumptions against Atlas constraints
          and prepare your starting timeline.
        </p>

        <form className="card" onSubmit={onSubmit} style={{ display: 'grid', gap: '0.85rem' }}>
          <label htmlFor="venue">Venue</label>
          <select id="venue" value={venueId} onChange={(event) => setVenueId(event.target.value)} required>
            {ATLAS_VENUE_SEEDS.map((venue) => (
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

          <button className="btn primary" type="submit" disabled={loading}>
            {loading ? 'Validating...' : 'Verify and Continue'}
          </button>
        </form>

        {selectedVenue ? (
          <div className="card" style={{ marginTop: '0.9rem' }}>
            <h3 style={{ marginTop: 0 }}>Atlas Snapshot</h3>
            <p style={{ color: '#4e4339' }}>{selectedVenue.constraintsSummary}</p>
            <p style={{ marginBottom: 0, color: '#4e4339' }}>
              Comfortable range: {selectedVenue.comfortableRangeMin} - {selectedVenue.comfortableRangeMax} guests
            </p>
          </div>
        ) : null}

        {error ? (
          <div className="card" style={{ marginTop: '0.9rem', borderColor: '#c18476' }}>
            <strong>{error}</strong>
          </div>
        ) : null}

        {result && tone ? (
          <div className="card" style={{ marginTop: '0.9rem' }}>
            <div
              className="badge"
              style={{
                background: tone.bg,
                borderColor: 'transparent',
                color: tone.color,
                marginBottom: '0.75rem'
              }}
            >
              {tone.label}
            </div>
            <p style={{ marginTop: 0, color: '#2f2720' }}>{result.message}</p>
            <ul style={{ marginTop: '0.4rem', color: '#4e4339', lineHeight: 1.6 }}>
              {result.venue.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
            <button
              className="btn primary"
              type="button"
              style={{ marginTop: '0.55rem' }}
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
