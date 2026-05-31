"use client";

import type { FormEvent } from 'react';
import { useState } from 'react';

interface ConciergeResponse {
  eventId: string;
  question: string;
  answer: string;
}

export default function GuestConciergeTool() {
  const [question, setQuestion] = useState('Where should I park for the baraat?');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ConciergeResponse | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/guest/concierge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      });

      if (!response.ok) {
        throw new Error('Unable to fetch concierge response.');
      }

      const data = (await response.json()) as ConciergeResponse;
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
        <h3>Guest AI Concierge</h3>
        <span className="chip">Read-Only Guidance</span>
      </div>
      <p>Ask event questions about logistics, timing, and cultural guidance.</p>

      <form className="tool-form" onSubmit={onSubmit}>
        <label htmlFor="guestQuestion">Question</label>
        <input
          id="guestQuestion"
          name="guestQuestion"
          type="text"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          required
        />

        <button className="btn primary" type="submit" disabled={loading}>
          {loading ? 'Thinking...' : 'Ask Concierge'}
        </button>
      </form>

      {error ? <p className="alert error">{error}</p> : null}

      {result ? (
        <div className="tool-result">
          <div className="data-row">
            <strong className="item-title">Question</strong>
            <p className="item-meta">{result.question}</p>
          </div>
          <div className="alert">
            <strong>Answer:</strong> {result.answer}
          </div>
        </div>
      ) : null}
    </article>
  );
}
