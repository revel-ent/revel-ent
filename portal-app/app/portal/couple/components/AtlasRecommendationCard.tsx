"use client";

import { useEffect, useState } from 'react';

interface AtlasRecommendationItem {
  id: string;
  triggerKey: string;
  groupedRecommendationKey: string;
  severity: 'info' | 'warning' | 'critical';
  confidence: number;
  status: string;
  recommendationPayload: {
    title: string;
    message: string;
    cta: string;
  };
  missingFields: string[];
}

interface AtlasRecommendationResponse {
  eventId: string;
  source: 'database' | 'fallback';
  items: AtlasRecommendationItem[];
}

export default function AtlasRecommendationCard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AtlasRecommendationResponse | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadRecommendations() {
      try {
        const response = await fetch('/api/onboarding/recommendations', { cache: 'no-store' });

        if (!response.ok) {
          throw new Error('Unable to load Atlas recommendations.');
        }

        const payload = (await response.json()) as AtlasRecommendationResponse;

        if (isMounted) {
          setResult(payload);
        }
      } catch (fetchError) {
        if (isMounted) {
          setError(fetchError instanceof Error ? fetchError.message : 'Request failed');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadRecommendations();

    return () => {
      isMounted = false;
    };
  }, []);

  const topRecommendation = result?.items[0] ?? null;

  // Don't render the card at all if loading finished and there's nothing to show.
  if (!loading && !topRecommendation) return null;

  return (
    <article className="card">
      <div className="card-header">
        <h3>Atlas Recommendation</h3>
        <span className="chip">Atlas Intelligence</span>
      </div>
      <p>Venue-driven guidance and upgrade prompts tied to your current event context.</p>

      {loading ? (
        <div className="stack" style={{ marginTop: '0.9rem' }}>
          <div className="skeleton skeleton-line wide" />
          <div className="skeleton skeleton-line mid" />
          <div className="skeleton skeleton-line short" />
        </div>
      ) : null}

      {error ? <p className="alert error">{error}</p> : null}

      {!loading && !error ? (
        topRecommendation ? (
          <div className="tool-result">
            <div className="data-row">
              <div className="item-title-row">
                <strong className="item-title">{topRecommendation.recommendationPayload.title}</strong>
                <span className={`status-chip ${topRecommendation.severity}`}>{topRecommendation.severity}</span>
              </div>
              <p className="item-meta">{topRecommendation.recommendationPayload.message}</p>
              <p className="item-note">CTA: {topRecommendation.recommendationPayload.cta}</p>
              <p className="item-note">Confidence: {Math.round(topRecommendation.confidence * 100)}%</p>
              {topRecommendation.missingFields.length > 0 ? (
                <p className="item-note">Needs confirmation: {topRecommendation.missingFields.join(', ')}</p>
              ) : null}
            </div>
          </div>
        ) : (
          <p className="item-note">No active Atlas recommendations yet. Run onboarding venue checks to generate one.</p>
        )
      ) : null}
    </article>
  );
}