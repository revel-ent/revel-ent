'use client';

import { useState } from 'react';

import GeneratedTimelinePreview, {
  type GenerateResponse
} from '@/app/portal/components/timeline/GeneratedTimelinePreview';
import { listWeddingTraditions } from '@/lib/wedding-traditions';

interface EventGenerateResponse extends GenerateResponse {
  eventId: string;
  resolvedTradition: string;
  existingTimelineCount: number;
}

const TRADITIONS = listWeddingTraditions();

export default function GenerateTimelineTool() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'previewing' | 'publishing' | 'published' | 'error'>(
    'idle'
  );
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EventGenerateResponse | null>(null);
  const [selectedTradition, setSelectedTradition] = useState<string | null>(null);
  const [publishMessage, setPublishMessage] = useState<string | null>(null);

  async function runGenerate(tradition?: string) {
    setStatus('loading');
    setError(null);

    try {
      const response = await fetch('/api/events/timeline/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tradition ? { tradition } : {})
      });

      const payload = (await response.json()) as EventGenerateResponse | { error: string };

      if (!response.ok || 'error' in payload) {
        throw new Error('error' in payload ? payload.error : 'Timeline generation failed');
      }

      setResult(payload);
      setSelectedTradition(payload.resolvedTradition);
      setStatus('previewing');
    } catch (generateError) {
      setError(generateError instanceof Error ? generateError.message : 'Request failed');
      setStatus('error');
    }
  }

  async function onPublish() {
    setStatus('publishing');
    setError(null);
    setPublishMessage(null);

    try {
      const response = await fetch('/api/events/timeline/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedTradition ? { tradition: selectedTradition } : {})
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.message ?? payload?.error ?? 'Publish failed');
      }

      setPublishMessage(`Published ${payload.timelineCount} timeline items for ${payload.venue}.`);
      setStatus('published');
    } catch (publishError) {
      setError(publishError instanceof Error ? publishError.message : 'Publish failed');
      setStatus('previewing');
    }
  }

  const existingBlocksPublish = (result?.existingTimelineCount ?? 0) > 0;

  return (
    <article className="card">
      <div className="card-header">
        <h3>Generate Timeline</h3>
        <span className="chip">AI Draft</span>
      </div>
      <p>Draft a venue-aware day-of timeline from this event&apos;s guest count, dates, and venue constraints.</p>

      {status === 'idle' ? (
        <button className="btn primary" type="button" onClick={() => runGenerate()}>
          Generate Timeline
        </button>
      ) : null}

      {status === 'loading' ? (
        <div className="stack" style={{ marginTop: '0.9rem' }}>
          <div className="skeleton skeleton-line wide" />
          <div className="skeleton skeleton-line mid" />
        </div>
      ) : null}

      {error ? <p className="alert error">{error}</p> : null}

      {result && (status === 'previewing' || status === 'publishing' || status === 'published') ? (
        <div className="tool-result">
          {existingBlocksPublish ? (
            <p className="alert error">
              This event already has {result.existingTimelineCount} timeline item(s). Publishing is disabled —
              clear the existing timeline first if you need to regenerate.
            </p>
          ) : null}

          <label htmlFor="tradition-select">Tradition</label>
          <select
            id="tradition-select"
            value={selectedTradition ?? result.resolvedTradition}
            onChange={(event) => {
              setSelectedTradition(event.target.value);
              void runGenerate(event.target.value);
            }}
            disabled={status === 'publishing'}
          >
            {TRADITIONS.map((tradition) => (
              <option key={tradition.key} value={tradition.key}>
                {tradition.label}
              </option>
            ))}
          </select>

          <GeneratedTimelinePreview result={result} />

          {publishMessage ? (
            <p className="alert success">
              {publishMessage} Refresh this page to see it on the Event Timeline card below.
            </p>
          ) : (
            <button
              className="btn primary"
              type="button"
              onClick={onPublish}
              disabled={status === 'publishing' || existingBlocksPublish}
            >
              {status === 'publishing' ? 'Publishing...' : 'Publish Timeline'}
            </button>
          )}
        </div>
      ) : null}
    </article>
  );
}
