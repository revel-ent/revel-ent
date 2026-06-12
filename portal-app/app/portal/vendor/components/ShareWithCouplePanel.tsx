'use client';

import { useState } from 'react';

export default function ShareWithCouplePanel() {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    setStatus('saving');
    setErrorMsg('');

    try {
      const res = await fetch('/api/events/mood-board', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() })
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? 'Failed to save');
      }

      setStatus('saved');
      setUrl('');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  }

  return (
    <article className="card decorator-share-panel">
      <div className="card-header">
        <h3>Share Vision Board with Couple</h3>
        <span className="chip">Decorator</span>
      </div>
      <p className="decorator-share-panel__body">
        Paste a link to your mood board — Google Drive, Canva, or Google Slides are all supported. It will appear instantly on the couple&apos;s dashboard.
      </p>

      <form className="decorator-share-panel__form" onSubmit={(e) => void handleSubmit(e)}>
        <label className="decorator-share-panel__label" htmlFor="moodBoardUrl">
          Vision board link
        </label>
        <div className="decorator-share-panel__row">
          <input
            id="moodBoardUrl"
            className="decorator-share-panel__input"
            type="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (status !== 'idle') setStatus('idle');
            }}
            placeholder="https://drive.google.com/file/d/… or canva.com/design/…"
            required
            disabled={status === 'saving'}
          />
          <button
            className="btn primary decorator-share-panel__btn"
            type="submit"
            disabled={status === 'saving' || !url.trim()}
          >
            {status === 'saving' ? 'Sharing…' : 'Share'}
          </button>
        </div>

        {status === 'saved' ? (
          <p className="decorator-share-panel__success">
            Vision board shared — the couple can now view it on their dashboard.
          </p>
        ) : null}
        {status === 'error' ? (
          <p className="alert error">{errorMsg}</p>
        ) : null}
      </form>

      <p className="decorator-share-panel__hint">
        Accepted formats: Google Drive share link, Canva design link, Google Slides share link. Links are automatically converted to embeds.
      </p>
    </article>
  );
}
