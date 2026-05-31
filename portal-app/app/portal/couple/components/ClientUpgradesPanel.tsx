'use client';

import { useState } from 'react';
import { type ClientEventPlan, formatCurrency } from '@/lib/mock-client-milestones';

interface Props {
  plan: ClientEventPlan;
}

export default function ClientUpgradesPanel({ plan }: Props) {
  const [requested, setRequested] = useState<Set<string>>(() => new Set());

  function toggleRequest(id: string) {
    setRequested((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  const categories = Array.from(new Set(plan.upgrades.map((u) => u.category)));

  return (
    <div className="client-panel">
      <div className="client-panel__header">
        <div>
          <h2 className="client-panel__title">Optional Upgrades</h2>
          <p className="client-panel__sub">
            Enhancements available for your event. Request interest and we will follow up with details.
          </p>
        </div>
        {requested.size > 0 && (
          <div className="upgrade-interest-badge">
            {requested.size} item{requested.size > 1 ? 's' : ''} flagged
          </div>
        )}
      </div>

      {categories.map((cat) => (
        <div key={cat} className="upgrade-category">
          <h3 className="upgrade-category__label">{cat}</h3>
          <ul className="upgrade-list">
            {plan.upgrades
              .filter((u) => u.category === cat)
              .map((upgrade) => {
                const isRequested = requested.has(upgrade.id);
                return (
                  <li key={upgrade.id} className={`upgrade-item${isRequested ? ' upgrade-item--selected' : ''}`}>
                    <div className="upgrade-item__body">
                      <div className="upgrade-item__row">
                        <span className="upgrade-item__title">
                          {upgrade.title}
                          {upgrade.popular && <span className="upgrade-popular-badge">Popular</span>}
                        </span>
                        <span className="upgrade-item__price">
                          {formatCurrency(upgrade.price)}
                          {upgrade.unit !== 'flat' && <span className="upgrade-item__unit"> / {upgrade.unit}</span>}
                        </span>
                      </div>
                      <p className="upgrade-item__desc">{upgrade.description}</p>
                    </div>
                    <button
                      className={`btn btn--sm${isRequested ? ' btn--selected' : ' btn--outline'}`}
                      onClick={() => toggleRequest(upgrade.id)}
                      aria-pressed={isRequested}
                    >
                      {isRequested ? '✓ Interested' : 'I\'m Interested'}
                    </button>
                  </li>
                );
              })}
          </ul>
        </div>
      ))}

      {requested.size > 0 && (
        <div className="upgrade-submit-bar">
          <p className="upgrade-submit-note">
            Your team will reach out to discuss pricing, availability, and details for the items you flagged.
          </p>
          <button
            className="btn primary"
            onClick={() => {
              // In production: POST to /api/upgrade-requests
              alert(`Upgrade interest submitted for ${requested.size} item(s). Your REVEL team will follow up within 1 business day.`);
              setRequested(new Set());
            }}
          >
            Submit Upgrade Interest
          </button>
        </div>
      )}
    </div>
  );
}
