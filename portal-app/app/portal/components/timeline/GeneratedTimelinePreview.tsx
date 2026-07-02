'use client';

import { useMemo } from 'react';

import { getPhaseLabel } from '@/lib/wedding-traditions';

export interface TimelineItem {
  phaseCode: string;
  title: string;
  scheduledStartIso: string;
  scheduledEndIso: string;
  escalationHint: string | null;
}

export interface TimelineValidationFinding {
  checkKey: string;
  status: 'active' | 'needs_review' | 'suppressed';
  severity: 'info' | 'warning' | 'critical';
  confidence: number;
  fired: boolean;
  title: string;
  message: string;
  cta: string;
  missingFields: string[];
  relatedPhaseCodes: string[];
}

// The common subset both /api/onboarding/timeline/generate and /api/events/timeline/generate
// return — each adds its own extra fields on top (persistenceMode vs. eventId/conflicts/etc.),
// but this component only ever needs this shape, so it works for either caller.
export interface GenerateResponse {
  venue: {
    name: string;
    city: string;
  };
  venueIntelligence: {
    sourceConfidence: 'vendor_verified' | 'partially_verified' | 'unverified';
    topConstraints: Array<{
      key: string;
      label: string;
      value: string;
      notes: string | null;
    }>;
    sourceLinks: Array<{ label: string; url: string }>;
  };
  weddingDate: string;
  items: TimelineItem[];
  warnings: string[];
  validationFindings?: TimelineValidationFinding[];
  templateSource: 'database' | 'fallback';
  tradition?: string;
  traditionLabel?: string;
}

export function formatTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

export function phaseLabel(code: string): string {
  return getPhaseLabel(code);
}

export function confidenceLabel(value: GenerateResponse['venueIntelligence']['sourceConfidence']): string {
  return value.replace('_', ' ');
}

export default function GeneratedTimelinePreview({ result }: { result: GenerateResponse }) {
  const grouped = useMemo(() => {
    const byPhase = new Map<string, TimelineItem[]>();

    result.items.forEach((item) => {
      const current = byPhase.get(item.phaseCode) ?? [];
      current.push(item);
      byPhase.set(item.phaseCode, current);
    });

    return Array.from(byPhase.entries()).map(([phase, items]) => ({ phase, items }));
  }, [result]);

  return (
    <>
      <article className="card">
        <div className="card-header">
          <h3>{result.venue.name}</h3>
          <span className="chip">Venue Baseline</span>
        </div>
        <p>{result.venue.city}</p>
        {result.traditionLabel ? (
          <p className="card-muted">
            Tradition: <strong>{result.traditionLabel}</strong>
          </p>
        ) : null}
        <p className="card-muted">
          Template source: {result.templateSource === 'database' ? 'Supabase templates' : 'Fallback baseline'}
        </p>
        <p className="card-muted">
          Confidence: <strong>{confidenceLabel(result.venueIntelligence.sourceConfidence)}</strong>
        </p>

        {result.venueIntelligence.topConstraints.length > 0 ? (
          <div className="stack" style={{ marginTop: '0.6rem' }}>
            <strong className="item-title">Top venue constraints</strong>
            <ul className="clean-list">
              {result.venueIntelligence.topConstraints.map((constraint) => (
                <li key={constraint.key} className="data-row">
                  <strong className="item-title">{constraint.label}</strong>
                  <p className="item-meta">{constraint.value}</p>
                  {constraint.notes ? <p className="item-note">{constraint.notes}</p> : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {result.venueIntelligence.sourceLinks.length > 0 ? (
          <div className="stack" style={{ marginTop: '0.6rem' }}>
            <strong className="item-title">Source links</strong>
            <ul className="clean-list">
              {result.venueIntelligence.sourceLinks.map((link) => (
                <li key={link.url} className="data-row">
                  <a href={link.url} target="_blank" rel="noreferrer" className="item-note">
                    {link.label || link.url}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </article>

      {result.warnings.length > 0 ? (
        <article className="card">
          <h3>Important Planning Notes</h3>
          <ul>
            {result.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </article>
      ) : null}

      {result.validationFindings && result.validationFindings.some((finding) => finding.status !== 'suppressed') ? (
        <div className="stack">
          {result.validationFindings
            .filter((finding) => finding.status !== 'suppressed')
            .map((finding) => (
              <article className="card" key={finding.checkKey}>
                <div className="card-header">
                  <h3>{finding.title}</h3>
                  <span className={`status-chip ${finding.severity}`}>{finding.severity}</span>
                </div>
                <p>{finding.message}</p>
                <p className="card-muted">
                  Recommendation: <strong>{finding.cta}</strong>
                </p>
                <p className="item-note">Confidence: {Math.round(finding.confidence * 100)}%</p>
                {finding.missingFields.length > 0 ? (
                  <p className="item-note">Needs confirmation: {finding.missingFields.join(', ')}</p>
                ) : null}
              </article>
            ))}
        </div>
      ) : null}

      <div className="stack">
        {grouped.map((phaseGroup) => (
          <article key={phaseGroup.phase} className="card">
            <div className="card-header">
              <h3>{phaseLabel(phaseGroup.phase)}</h3>
              <span className="chip">Phase</span>
            </div>
            {phaseGroup.items.map((item) => (
              <div key={`${item.phaseCode}-${item.title}-${item.scheduledStartIso}`} className="data-row">
                <strong className="item-title">{item.title}</strong>
                <p className="item-meta">
                  {formatTime(item.scheduledStartIso)} - {formatTime(item.scheduledEndIso)}
                </p>
                {item.escalationHint ? <p className="item-note">{item.escalationHint}</p> : null}
              </div>
            ))}
          </article>
        ))}
      </div>
    </>
  );
}
