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
      <h3>Coordination Feed</h3>
      <p>Real-time timeline and operational updates for your assigned event.</p>

      {loading ? <p>Loading feed...</p> : null}
      {error ? <p style={{ color: '#7a1f1f' }}>{error}</p> : null}

      {!loading && !error ? (
        <div className="tool-result">
          {items.length === 0 ? <p>No updates yet.</p> : null}
          <ul>
            {items.map((item) => (
              <li key={item.id}>
                <strong>{item.status.toUpperCase()}</strong> | {item.owner} | {new Date(item.timestamp).toLocaleString()}
                <br />
                {item.update}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}
