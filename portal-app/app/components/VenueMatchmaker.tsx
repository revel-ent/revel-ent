'use client';

import { useState } from 'react';

interface VenueResult {
  id: string;
  name: string;
  roomName: string | null;
  city: string;
  state: string;
  capacityMin: number;
  capacityMax: number;
  verified: boolean;
  matchScore: number;
}

const QUICK_PROMPTS = [
  'Ballroom for 300 guests in Atlanta',
  'Outdoor ceremony space, 150 guests',
  'Indian wedding, 500+ guests near Buckhead',
  'Intimate venue for 120 guests',
];

const COVERS = ['cover-a', 'cover-b', 'cover-c', 'cover-d', 'cover-e', 'cover-f'];

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

function tagFor(v: VenueResult): string {
  if (v.matchScore >= 80) return 'Strong Fit';
  if (v.capacityMax >= 500) return 'Large Capacity';
  if (v.capacityMax <= 150) return 'Intimate Setting';
  if (v.verified) return 'Verified Venue';
  return 'Worth a Look';
}

export default function VenueMatchmaker() {
  const [prompt, setPrompt] = useState('');
  const [results, setResults] = useState<VenueResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function search(searchPrompt: string) {
    const trimmed = searchPrompt.trim();
    if (!trimmed) return;
    setLoading(true);
    setError('');
    setResults(null);

    try {
      const res = await fetch('/api/public/venue-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: trimmed }),
      });
      const data = (await res.json()) as { results?: VenueResult[]; error?: string };
      if (!res.ok) throw new Error(data.error || 'Search failed');
      setResults(data.results ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    void search(prompt);
  }

  function handleChip(chip: string) {
    setPrompt(chip);
    void search(chip);
  }

  const scoreClass = (score: number) =>
    score >= 75 ? 'vm-badge--high' : score >= 50 ? 'vm-badge--mid' : 'vm-badge--low';

  return (
    <div className="vm">
      <form className="vm-search" onSubmit={handleSubmit}>
        <div className="vm-input-row">
          <span className="vm-input-icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4-4" />
            </svg>
          </span>
          <input
            className="vm-input"
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder='Describe your event — "ballroom for 300 guests near Buckhead"'
            maxLength={500}
            disabled={loading}
          />
          <button className="btn primary vm-btn" type="submit" disabled={loading || !prompt.trim()}>
            {loading ? 'Matching…' : 'Find Matches'}
          </button>
        </div>

        <div className="vm-chips" aria-label="Quick searches">
          {QUICK_PROMPTS.map((chip) => (
            <button key={chip} type="button" className="vm-chip" onClick={() => handleChip(chip)} disabled={loading}>
              {chip}
            </button>
          ))}
        </div>
      </form>

      {error ? <p className="vm-error">{error}</p> : null}

      {results !== null && results.length === 0 ? (
        <p className="vm-empty">No venues matched that search yet. Try a broader description.</p>
      ) : null}

      {results && results.length > 0 ? (
        <div className="vm-grid">
          {results.map((venue, index) => (
            <article key={venue.id} className="vm-card">
              <div className={`vm-card-cover ${COVERS[index % COVERS.length]}`}>
                <span className={`vm-badge ${scoreClass(venue.matchScore)}`}>{venue.matchScore}% Match</span>
                <span className="vm-card-initials" aria-hidden="true">
                  {initials(venue.name)}
                </span>
                {venue.verified ? <span className="vm-verified">Verified</span> : null}
              </div>
              <div className="vm-card-body">
                <h3 className="vm-card-name">{venue.name}</h3>
                <p className="vm-card-loc">
                  {venue.roomName ? `${venue.roomName} · ` : ''}
                  {venue.city}, {venue.state}
                </p>
                <div className="vm-card-meta">
                  <span className="vm-card-cap">
                    {venue.capacityMin}–{venue.capacityMax} guests
                  </span>
                  <span className="vm-tag">{tagFor(venue)}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}
