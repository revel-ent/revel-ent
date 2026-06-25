'use client';

import { useEffect, useRef, useState } from 'react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AssistantResponse {
  reply: string;
  source: 'gemini' | 'fallback';
  role: string;
}

const SUGGESTED_PROMPTS = [
  'What does my timeline look like?',
  'What still needs my attention?',
  'When are my next payments due?',
  'Summarize where this event stands.'
];

export default function AssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function send(question: string) {
    const trimmed = question.trim();

    if (!trimmed || loading) {
      return;
    }

    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: trimmed }];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages })
      });

      const payload = (await response.json()) as AssistantResponse & { error?: string };

      if (!response.ok) {
        throw new Error(payload?.error ?? 'The assistant could not respond.');
      }

      setPreviewMode(payload.source === 'fallback');
      setMessages((current) => [...current, { role: 'assistant', content: payload.reply }]);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Request failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="page-wrap">
      <div style={{ maxWidth: 820, margin: '0 auto', display: 'grid', gap: '0.9rem' }}>
        <header className="portal-page-header">
          <span className="badge">Atlas AI</span>
          <h1 className="page-title">Wedding Assistant</h1>
          <p className="page-subtitle">
            Ask about your timeline, tasks, and payments. Answers come from this event&apos;s real data, scoped to your
            role.
          </p>
        </header>

        {previewMode ? (
          <article className="alert">
            <strong>Preview mode:</strong> conversational answers are off until an AI key is configured. You will still
            get a direct readout of your event data.
          </article>
        ) : null}

        <article className="card" style={{ display: 'grid', gap: '0.75rem' }}>
          {messages.length === 0 ? (
            <div className="stack">
              <p className="card-muted">Try one of these to get started:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    className="btn secondary"
                    onClick={() => send(prompt)}
                    disabled={loading}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className="data-row"
              style={{
                justifySelf: message.role === 'user' ? 'end' : 'start',
                maxWidth: '88%',
                background: message.role === 'user' ? 'rgba(99, 102, 241, 0.12)' : 'rgba(148, 163, 184, 0.12)',
                borderRadius: '0.75rem',
                padding: '0.6rem 0.8rem'
              }}
            >
              <strong className="item-title">{message.role === 'user' ? 'You' : 'Atlas'}</strong>
              <p className="item-meta" style={{ whiteSpace: 'pre-wrap' }}>
                {message.content}
              </p>
            </div>
          ))}

          {loading ? (
            <div className="data-row" style={{ justifySelf: 'start' }}>
              <strong className="item-title">Atlas</strong>
              <p className="item-meta">Thinking…</p>
            </div>
          ) : null}

          <div ref={endRef} />
        </article>

        {error ? (
          <article className="alert error">
            <strong>{error}</strong>
          </article>
        ) : null}

        <form
          className="split"
          onSubmit={(event) => {
            event.preventDefault();
            send(input);
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask about your wedding…"
            aria-label="Ask the wedding assistant"
            disabled={loading}
            style={{ flex: 1 }}
          />
          <button className="btn primary" type="submit" disabled={loading || !input.trim()}>
            {loading ? 'Sending…' : 'Send'}
          </button>
        </form>
      </div>
    </section>
  );
}
