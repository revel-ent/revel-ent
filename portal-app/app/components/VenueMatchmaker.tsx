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
  'Modern venue near Buckhead',
  'Large reception hall, 500+ guests',
];

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
      const data = await res.json() as { results?: VenueResult[]; error?: string };
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
    score >= 70 ? 'venue-card__score--high' : score >= 45 ? 'venue-card__score--mid' : 'venue-card__score--low';

  return (
    <div className="venue-matchmaker">
      <form className="venue-matchmaker__form" onSubmit={handleSubmit}>
        <div className="venue-matchmaker__input-row">
          <input
            className="venue-matchmaker__input"
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder='Describe what you need — "ballroom for 300 guests near Buckhead"'
            maxLength={500}
            disabled={loading}
          />
          <button
            className="btn primary venue-matchmaker__btn"
            type="submit"
            disabled={loading || !prompt.trim()}
          >
            {loading ? 'Searching…' : 'Find Venues'}
          </button>
        </div>

        <div className="venue-matchmaker__chips" aria-label="Quick search starters">
          {QUICK_PROMPTS.map((chip) => (
            <button
              key={chip}
              type="button"
              className="venue-matchmaker__chip"
              onClick={() => handleChip(chip)}
              disabled={loading}
            >
              {chip}
            </button>
          ))}
        </div>
      </form>

      {error ? <p className="venue-matchmaker__error">{error}</p> : null}

      {results !== null && results.length === 0 ? (
        <p className="venue-matchmaker__empty">No venues matched that search. Try a broader description.</p>
      ) : null}

      {results && results.length > 0 ? (
        <div className="venue-matchmaker__grid">
          {results.map((venue) => (
            <article key={venue.id} className="venue-card">
              <div className="venue-card__header">
                <h3 className="venue-card__name">{venue.name}</h3>
                {venue.verified ? <span className="venue-card__verified">Verified</span> : null}
              </div>
              {venue.roomName ? <p className="venue-card__room">{venue.roomName}</p> : null}
              <p className="venue-card__location">
                {venue.city}, {venue.state}
              </p>
              <div className="venue-card__meta">
                <span className="venue-card__capacity">
                  {venue.capacityMin}–{venue.capacityMax} guests
                </span>
                <span className={`venue-card__score ${scoreClass(venue.matchScore)}`}>
                  {venue.matchScore}% match
                </span>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}
