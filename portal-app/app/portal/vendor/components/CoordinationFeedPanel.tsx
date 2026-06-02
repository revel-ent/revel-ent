"use client";

import { useEffect, useState } from 'react';

interface CoordinationItem {
  id: string;
  owner: string;
  role: 'planner' | 'vendor' | 'ops';
  status: 'pending' | 'acknowledged' | 'executed';
  timestamp: string;
  update: string;
}

export default function CoordinationFeedPanel() {
  const [items, setItems] = useState<CoordinationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadFeed() {
      try {
        const response = await fetch('/api/ops/coordination-feed');

        if (!response.ok) {
          throw new Error('Unable to load coordination feed.');
        }

        const data = (await response.json()) as { items: CoordinationItem[] };
        setItems(data.items || []);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Request failed');
      } finally {
        setLoading(false);
      }
    }

    void loadFeed();
  }, []);

  return (
    <article className="card">
      <div className="card-header">
        <h3>Coordination Feed</h3>
        <span className="chip">Assigned Updates</span>
      </div>
      <p>Real-time timeline and operational updates for your assigned event.</p>

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
          {items.length === 0 ? <p>No coordination updates are pending right now. New operational notes will appear here in real time.</p> : null}
          <ul className="feed-list">
            {items.map((item) => (
              <li key={item.id} className="feed-item">
                <div className="item-title-row">
                  <span className="item-title">{item.owner}</span>
                  <span className={`status-chip ${item.status}`}>{item.status.toUpperCase()}</span>
                </div>
                <p className="item-meta">{new Date(item.timestamp).toLocaleString()}</p>
                <p className="item-note">{item.update}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}
