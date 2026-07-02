'use client';

import { useState } from 'react';

interface PolicyFact {
  label: string;
  confirmed: boolean;
}

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
  /** Licensed/owned photo URL, when available. Falls back to the gradient + monogram cover. */
  photoUrl?: string;
  /** Curfew, catering, and fire/effects policy — drawn from logged venue facts, not guessed. */
  policyFacts?: PolicyFact[];
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
  const [location, setLocation] = useState('');
  const [eventType, setEventType] = useState('');
  const [guestCount, setGuestCount] = useState('');
  const [budget, setBudget] = useState('');
  const [sortBy, setSortBy] = useState('best');
  const [results, setResults] = useState<VenueResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function search(overridePrompt?: string) {
    const text = (overridePrompt ?? prompt).trim();
    const parts = [
      location && `Location: ${location}`,
      eventType && `Event type: ${eventType}`,
      guestCount && `Guest count: ${guestCount}`,
      budget && `Budget: ${budget}`,
      text,
    ].filter(Boolean);
    const fullPrompt = parts.join('. ');
    if (!fullPrompt) return;

    setLoading(true);
    setError('');
    setResults(null);

    try {
      const res = await fetch('/api/public/venue-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: fullPrompt }),
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
    void search();
  }

  function handleChip(chip: string) {
    setPrompt(chip);
    void search(chip);
  }

  const scoreClass = (score: number) =>
    score >= 75 ? 'vm-badge--high' : score >= 50 ? 'vm-badge--mid' : 'vm-badge--low';

  const canSearch = !loading && (!!prompt.trim() || !!location || !!eventType || !!guestCount || !!budget);

  return (
    <div className="vm">
      <form className="vm-search" onSubmit={handleSubmit}>
        {/* Main text input */}
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
            placeholder='Describe your event — "Indian wedding, 500 guests, late-night curfew, budget $150K"'
            maxLength={500}
            disabled={loading}
          />
        </div>

        {/* Filter row + submit */}
        <div className="vm-filter-row">
          <label className="vm-filter-select">
            <span className="vm-filter-icon" aria-hidden="true">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
              </svg>
            </span>
            <select className="vm-filter-sel" value={location} onChange={(e) => setLocation(e.target.value)} disabled={loading}>
              <option value="">All Georgia</option>
              <option value="Atlanta, GA">Atlanta</option>
              <option value="Buckhead, GA">Buckhead</option>
              <option value="Alpharetta, GA">Alpharetta</option>
              <option value="Gwinnett, GA">Gwinnett</option>
              <option value="Braselton, GA">Braselton</option>
            </select>
          </label>

          <label className="vm-filter-select">
            <span className="vm-filter-icon" aria-hidden="true">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </span>
            <select className="vm-filter-sel" value={eventType} onChange={(e) => setEventType(e.target.value)} disabled={loading}>
              <option value="">Event Type</option>
              <option value="Wedding">Wedding</option>
              <option value="Indian Wedding">Indian Wedding</option>
              <option value="South Asian Wedding">South Asian Wedding</option>
              <option value="Outdoor Ceremony">Outdoor Ceremony</option>
              <option value="Corporate Event">Corporate Event</option>
              <option value="Social Gala">Social Gala</option>
            </select>
          </label>

          <label className="vm-filter-select">
            <span className="vm-filter-icon" aria-hidden="true">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="9" cy="8" r="3" /><path d="M3 20c0-3 3-5 6-5s6 2 6 5" /><path d="M16 6a3 3 0 0 1 0 6M21 20c0-2.2-1.4-3.9-3.5-4.6" />
              </svg>
            </span>
            <select className="vm-filter-sel" value={guestCount} onChange={(e) => setGuestCount(e.target.value)} disabled={loading}>
              <option value="">Guest Count</option>
              <option value="under 100 guests">Under 100</option>
              <option value="100–250 guests">100 – 250</option>
              <option value="250–500 guests">250 – 500</option>
              <option value="500–800 guests">500 – 800</option>
              <option value="800+ guests">800+</option>
            </select>
          </label>

          <label className="vm-filter-select">
            <span className="vm-filter-icon" aria-hidden="true">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/><circle cx="16.5" cy="13.5" r="1"/></svg>
            </span>
            <select className="vm-filter-sel" value={budget} onChange={(e) => setBudget(e.target.value)} disabled={loading}>
              <option value="">Any Budget</option>
              <option value="under $75K">Under $75K</option>
              <option value="$75K–$150K">$75K – $150K</option>
              <option value="$150K–$200K">$150K – $200K</option>
              <option value="$200K+">$200K+</option>
            </select>
          </label>

          <label className="vm-filter-select">
            <span className="vm-filter-icon" aria-hidden="true">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M7 12h10M10 18h4"/></svg>
            </span>
            <select className="vm-filter-sel" value={sortBy} onChange={(e) => setSortBy(e.target.value)} disabled={loading}>
              <option value="best">Sort: Best Match</option>
              <option value="capacity">Sort: Capacity</option>
              <option value="distance">Sort: Distance</option>
            </select>
          </label>

          <button className="btn primary vm-btn vm-find-btn" type="submit" disabled={!canSearch}>
            {loading ? 'Matching…' : 'Find Matches →'}
          </button>
        </div>

        {/* Quick chip suggestions */}
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
        <div className="vm-carousel">
          {results.map((venue, index) => (
            <article key={venue.id} className="vm-card">
              <div className={`vm-card-cover ${venue.photoUrl ? 'vm-card-cover--photo' : COVERS[index % COVERS.length]}`}>
                <span className={`vm-badge ${scoreClass(venue.matchScore)}`}>{venue.matchScore}% Match</span>
                {venue.photoUrl ? (
                  <img className="vm-card-photo" src={venue.photoUrl} alt={venue.name} loading="lazy" />
                ) : (
                  <span className="vm-card-initials" aria-hidden="true">
                    {initials(venue.name)}
                  </span>
                )}
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
                {venue.policyFacts && venue.policyFacts.length > 0 ? (
                  <ul className="vm-card-facts">
                    {venue.policyFacts.map((fact) => (
                      <li key={fact.label} className="vm-card-fact">
                        {fact.label}
                        {!fact.confirmed ? <span className="vm-card-fact__unconfirmed"> (unconfirmed)</span> : null}
                      </li>
                    ))}
                  </ul>
                ) : null}
                <a className="btn primary vm-card-cta" href="/portal/onboarding">
                  Start Planning →
                </a>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}
