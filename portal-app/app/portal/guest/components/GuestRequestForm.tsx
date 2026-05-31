'use client';

import { useState } from 'react';

function toFriendlyPersistenceMessage(errorCode: string): string {
  if (errorCode === 'persistence_unavailable' || errorCode === 'persistence_not_configured') {
    return 'Persistence is not configured yet for this environment. Add Supabase env vars and run migrations to enable durable guest requests.';
  }

  return errorCode;
}

export default function GuestRequestForm({ songRequestLimit }: { songRequestLimit: number }) {
  const [songRequest, setSongRequest] = useState('');
  const [dietaryRequest, setDietaryRequest] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submitRequest(requestType: 'song' | 'dietary', details: string) {
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch('/api/guest/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestType, details })
      });
      const data = (await response.json()) as { message?: string; error?: string };

      if (!response.ok) {
        throw new Error(toFriendlyPersistenceMessage(data.error || 'Unable to save request'));
      }

      setMessage(data.message || 'Request submitted.');
      if (requestType === 'song') setSongRequest('');
      if (requestType === 'dietary') setDietaryRequest('');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Request failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="guest-request-grid">
      <div className="data-row">
        <strong className="item-title">Song Request</strong>
        <p className="item-meta">Limit {songRequestLimit} per guest. Requests are reviewed by DJ/MC and planner team.</p>
        <div className="tool-form">
          <input
            value={songRequest}
            onChange={(event) => setSongRequest(event.target.value)}
            placeholder="Example: Gallan Goodiyan for family dance"
          />
          <button
            className="btn btn--outline"
            disabled={saving || songRequest.trim().length < 3}
            onClick={() => submitRequest('song', songRequest)}
            type="button"
          >
            Submit Song
          </button>
        </div>
      </div>

      <div className="data-row">
        <strong className="item-title">Dietary Request</strong>
        <p className="item-meta">Share allergy or meal constraints for planner and catering coordination.</p>
        <div className="tool-form">
          <input
            value={dietaryRequest}
            onChange={(event) => setDietaryRequest(event.target.value)}
            placeholder="Example: Nut allergy, vegetarian Jain"
          />
          <button
            className="btn btn--outline"
            disabled={saving || dietaryRequest.trim().length < 3}
            onClick={() => submitRequest('dietary', dietaryRequest)}
            type="button"
          >
            Submit Dietary
          </button>
        </div>
      </div>

      {message ? <p className="alert">{message}</p> : null}
      {error ? <p className="alert error">{error}</p> : null}
    </div>
  );
}
