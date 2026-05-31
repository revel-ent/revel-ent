"use client";

import type { FormEvent } from 'react';
import { useState } from 'react';

interface VenueAnalyzerResponse {
  event: string;
  venue: string;
  roomType: string;
  required: string[];
  riskFlags: string[];
  trustMetadata: {
    sourceType: string;
    reviewedBy: string;
    reviewedOn: string;
    confidenceScore: number;
  };
}

export default function VenueAnalyzerTool() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VenueAnalyzerResponse | null>(null);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    const payload = {
      venueName: String(formData.get('venueName') || ''),
      roomType: String(formData.get('roomType') || ''),
      guestCount: Number(formData.get('guestCount') || 0),
      ceilingHeightFt: Number(formData.get('ceilingHeightFt') || 0)
    };

    try {
      const response = await fetch('/api/ai/venue-analyzer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Unable to generate venue production analysis.');
      }

      const data = (await response.json()) as VenueAnalyzerResponse;
      setResult(data);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <article className="card">
      <div className="card-header">
        <h3>Venue Production Analyzer</h3>
        <span className="chip">Venue Fit</span>
      </div>
      <p>Model constraints and required production elements before execution week.</p>

      <form
        className="tool-form"
        onSubmit={async (event: FormEvent<HTMLFormElement>) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          await handleSubmit(formData);
        }}
      >
        <label htmlFor="venueName">Venue</label>
        <input id="venueName" name="venueName" type="text" defaultValue="DoubleTree Atlanta Northlake" required />

        <label htmlFor="roomType">Room Type</label>
        <input id="roomType" name="roomType" type="text" defaultValue="Grand Ballroom" required />

        <label htmlFor="guestCount">Guest Count</label>
        <input id="guestCount" name="guestCount" type="number" defaultValue={340} min={20} required />

        <label htmlFor="ceilingHeightFt">Ceiling Height (ft)</label>
        <input id="ceilingHeightFt" name="ceilingHeightFt" type="number" defaultValue={22} min={8} required />

        <button className="btn primary" type="submit" disabled={loading}>
          {loading ? 'Analyzing...' : 'Analyze Venue'}
        </button>
      </form>

      {error ? <p className="alert error">{error}</p> : null}

      {result ? (
        <div className="tool-result">
          <div className="data-row">
            <strong className="item-title">{result.event}</strong>
            <p className="item-meta">
              {result.venue} ({result.roomType})
            </p>
            <span className="status-chip safe">
              Confidence {Math.round(result.trustMetadata.confidenceScore * 100)}%
            </span>
          </div>
          <p><strong>Required Elements:</strong></p>
          <ul className="clean-list">
            {result.required.map((item) => (
              <li key={item} className="data-row">{item}</li>
            ))}
          </ul>
          <p><strong>Risk Flags:</strong></p>
          <ul className="clean-list">
            {result.riskFlags.map((flag) => (
              <li key={flag} className="data-row">{flag}</li>
            ))}
          </ul>
          <p className="item-note">
            Reviewed by {result.trustMetadata.reviewedBy} on{' '}
            {new Date(result.trustMetadata.reviewedOn).toLocaleDateString()}.
          </p>
          <p className="item-note">
            This score shows how complete and reliable the current venue details are for planning decisions.
          </p>
        </div>
      ) : null}
    </article>
  );
}
