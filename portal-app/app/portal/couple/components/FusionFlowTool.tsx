"use client";

import type { FormEvent } from 'react';
import { useState } from 'react';

interface FusionFlowResponse {
  event: string;
  assumptions: string[];
  timelineMoments: Array<{
    phase: string;
    musicDirection: string;
    lightingState: string;
  }>;
  nextBestAction: string;
  confidence: number;
}

export default function FusionFlowTool() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FusionFlowResponse | null>(null);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    const payload = {
      cultureBlend: String(formData.get('cultureBlend') || ''),
      vibeGoal: String(formData.get('vibeGoal') || ''),
      mustPlayTracks: String(formData.get('mustPlayTracks') || ''),
      guestCount: Number(formData.get('guestCount') || 0)
    };

    try {
      const response = await fetch('/api/ai/fusion-flow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Unable to generate Fusion Flow plan.');
      }

      const data = (await response.json()) as FusionFlowResponse;
      setResult(data);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <article className="card">
      <h3>Fusion Flow Experience Architect</h3>
      <p>Generate a custom event arc with cultural transitions and lighting cues.</p>

      <form
        className="tool-form"
        onSubmit={async (event: FormEvent<HTMLFormElement>) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          await handleSubmit(formData);
        }}
      >
        <label htmlFor="cultureBlend">Culture Blend</label>
        <input id="cultureBlend" name="cultureBlend" type="text" defaultValue="Gujarati + Italian" required />

        <label htmlFor="vibeGoal">Vibe Goal</label>
        <input id="vibeGoal" name="vibeGoal" type="text" defaultValue="Elegant start, explosive dance floor" required />

        <label htmlFor="mustPlayTracks">Must-Play Tracks</label>
        <input id="mustPlayTracks" name="mustPlayTracks" type="text" defaultValue="Track A, Track B, Track C" required />

        <label htmlFor="guestCount">Guest Count</label>
        <input id="guestCount" name="guestCount" type="number" defaultValue={320} min={20} required />

        <button className="btn primary" type="submit" disabled={loading}>
          {loading ? 'Generating...' : 'Generate Plan'}
        </button>
      </form>

      {error ? <p style={{ color: '#7a1f1f' }}>{error}</p> : null}

      {result ? (
        <div className="tool-result">
          <p><strong>Event:</strong> {result.event}</p>
          <p><strong>Confidence:</strong> {Math.round(result.confidence * 100)}%</p>
          <p><strong>Assumptions:</strong></p>
          <ul>
            {result.assumptions.map((assumption) => (
              <li key={assumption}>{assumption}</li>
            ))}
          </ul>
          <p><strong>Timeline Moments:</strong></p>
          <ul>
            {result.timelineMoments.map((moment) => (
              <li key={moment.phase}>
                <strong>{moment.phase}:</strong> {moment.musicDirection} | {moment.lightingState}
              </li>
            ))}
          </ul>
          <p><strong>Next Action:</strong> {result.nextBestAction}</p>
        </div>
      ) : null}
    </article>
  );
}
