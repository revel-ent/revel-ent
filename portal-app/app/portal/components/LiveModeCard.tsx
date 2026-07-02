"use client";

import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';

interface LiveStep {
  id: string;
  title: string;
  startsAtIso: string;
  endsAtIso: string;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
  instructions: string;
}

interface LiveResponse {
  eventId: string;
  source: 'mock' | 'supabase';
  current: LiveStep | null;
  next: LiveStep | null;
  canManage: boolean;
}

function fmt(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export default function LiveModeCard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LiveResponse | null>(null);
  const [note, setNote] = useState('');
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadLive() {
      try {
        const response = await fetch('/api/events/live');

        if (!response.ok) {
          throw new Error('Unable to load live mode.');
        }

        const data = (await response.json()) as LiveResponse;

        if (isMounted) {
          setResult(data);
        }
      } catch (liveError) {
        if (isMounted) {
          setError(liveError instanceof Error ? liveError.message : 'Request failed');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadLive();

    return () => {
      isMounted = false;
    };
  }, []);

  async function submitUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!result?.current) {
      return;
    }

    setUpdateMessage(null);

    const response = await fetch('/api/events/live/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stepId: result.current.id,
        status: 'delayed',
        note: note || 'Marked delayed from live mode.'
      })
    });

    const payload = await response.json();

    if (!response.ok) {
      setUpdateMessage('Could not submit update right now.');
      return;
    }

    setUpdateMessage(
      `Update sent in ${payload.mode} mode at ${new Date(payload.update.updatedAt).toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit'
      })}.`
    );
    setNote('');
  }

  return (
    <article className="card">
      <div className="card-header">
        <h3>Live Mode</h3>
        <span className="chip">Execution</span>
      </div>
      <p>What&apos;s happening now and what&apos;s next, for real-time day-of execution.</p>

      {loading ? (
        <div className="stack" style={{ marginTop: '0.9rem' }}>
          <div className="skeleton skeleton-line wide" />
          <div className="skeleton skeleton-line mid" />
          <div className="skeleton skeleton-line short" />
        </div>
      ) : null}
      {error ? <p className="alert error">{error}</p> : null}

      {result && result.source === 'mock' ? (
        <div className="tool-result">
          <p className="item-note">
            Live mode activates once your day-of timeline is published — usually a few days before the event.
            Nothing to track yet.
          </p>
        </div>
      ) : null}

      {result && result.source !== 'mock' ? (
        <div className="tool-result">
          <div className="data-row">
            <div className="item-title-row">
              <strong className="item-title">Now</strong>
              {result.current ? <span className={`status-chip ${result.current.status}`}>{result.current.status.replace('_', ' ')}</span> : null}
            </div>
            <p className="item-meta">
              {result.current
                ? `${result.current.title} (${fmt(result.current.startsAtIso)} - ${fmt(result.current.endsAtIso)})`
                : 'No active step is currently in progress. We will surface the next critical action as soon as it starts.'}
            </p>
          </div>

          <div className="data-row">
            <strong className="item-title">Next</strong>
            <p className="item-meta">
              {result.next
                ? `${result.next.title} at ${fmt(result.next.startsAtIso)}`
                : 'No upcoming step is scheduled yet. Your timeline feed will update automatically as operations are confirmed.'}
            </p>
          </div>

          {result.canManage ? (
            <form className="tool-form" onSubmit={submitUpdate}>
              <label htmlFor="liveNote">Delay note (optional)</label>
              <input
                id="liveNote"
                type="text"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="e.g., procession start moved by 10 minutes"
              />
              <button className="btn primary" type="submit">
                Mark Current Step Delayed
              </button>
            </form>
          ) : null}

          {updateMessage ? <p className="alert success">{updateMessage}</p> : null}
        </div>
      ) : null}
    </article>
  );
}
