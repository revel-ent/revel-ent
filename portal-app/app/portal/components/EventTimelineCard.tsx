"use client";

import { useEffect, useState } from 'react';

interface TimelineStep {
  id: string;
  phase: string;
  title: string;
  startsAtIso: string;
  endsAtIso: string;
  status: 'pending' | 'ready' | 'in_progress' | 'completed' | 'delayed' | 'blocked';
  ownerLabel: string;
  instructions: string;
  readOnly: boolean;
}

interface TimelineResponse {
  eventId: string;
  role: string;
  conflicts: Array<{ id: string; message: string; severity: string }>;
  timeline: TimelineStep[];
}

function formatSlot(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);

  return `${start.toLocaleString([], {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit'
  })} - ${end.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit'
  })}`;
}

export default function EventTimelineCard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<TimelineStep[]>([]);
  const [conflicts, setConflicts] = useState<TimelineResponse['conflicts']>([]);

  useEffect(() => {
    async function loadTimeline() {
      try {
        const response = await fetch('/api/events/timeline');

        if (!response.ok) {
          throw new Error('Unable to load timeline.');
        }

        const data = (await response.json()) as TimelineResponse;
        setTimeline(data.timeline || []);
        setConflicts(data.conflicts || []);
      } catch (timelineError) {
        setError(timelineError instanceof Error ? timelineError.message : 'Request failed');
      } finally {
        setLoading(false);
      }
    }

    void loadTimeline();
  }, []);

  return (
    <article className="card">
      <div className="card-header">
        <h3>Event Timeline</h3>
        <span className="chip">Role Scoped</span>
      </div>
      <p>A role-scoped view of what is happening now and what is next.</p>

      {loading ? (
        <div className="stack" style={{ marginTop: '0.9rem' }}>
          <div className="skeleton skeleton-line wide" />
          <div className="skeleton skeleton-line mid" />
          <div className="skeleton skeleton-line wide" />
        </div>
      ) : null}
      {error ? <p className="alert error">{error}</p> : null}

      {!loading && !error ? (
        <div className="tool-result">
          {conflicts.length > 0 ? (
            <div className="alert">
              <strong>Timeline checks:</strong> {conflicts.map((conflict) => conflict.message).join(' ')}
            </div>
          ) : null}
          {timeline.length === 0 ? <p>No timeline available yet.</p> : null}
          <ul className="timeline-list">
            {timeline.map((step) => (
              <li key={step.id} className="timeline-item">
                <div className="item-title-row">
                  <strong className="item-title">{step.title}</strong>
                  <span className={`status-chip ${step.status}`}>{step.status.replace('_', ' ')}</span>
                </div>
                <p className="item-meta">
                  {formatSlot(step.startsAtIso, step.endsAtIso)} | Owner: {step.ownerLabel}
                </p>
                <p className="item-note">{step.instructions}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}
