'use client';

import { useState } from 'react';

const OPTIONS = [
  { id: 'couple', label: 'Couple', benefit: 'Get clarity on what to approve first and where to save budget stress.' },
  { id: 'planner', label: 'Planner', benefit: 'Run timeline, risks, and dispatch in one operational flow.' },
  { id: 'decorator', label: 'Decorator', benefit: 'Map decor vision to real venue/power constraints sooner.' },
  { id: 'vendor', label: 'Vendor', benefit: 'See assigned tasks and timing updates without group-chat confusion.' },
  { id: 'delegate_coordinator', label: 'Family Coordinator', benefit: 'Operate day-of with guided prompts and clean next actions.' },
  { id: 'guest', label: 'Guest', benefit: 'Get logistics answers quickly without interrupting the family.' }
] as const;

export default function ProfileIntentPanel() {
  const [intent, setIntent] = useState<(typeof OPTIONS)[number]['id']>('couple');
  const selected = OPTIONS.find((option) => option.id === intent) ?? OPTIONS[0];

  return (
    <section className="card intent-panel">
      <div className="card-header">
        <h3>Entry Preference</h3>
        <span className="chip">Personalized Guidance</span>
      </div>
      <p>Set your primary role so the portal opens with guidance matched to your responsibilities.</p>

      <label htmlFor="intentSelect">I am planning as</label>
      <select
        id="intentSelect"
        value={intent}
        onChange={(event) => {
          const next = event.target.value as (typeof OPTIONS)[number]['id'];
          setIntent(next);
          window.localStorage.setItem('revel.portal.persona', next);
        }}
      >
        {OPTIONS.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>

      <div className="alert">
        <strong>How this helps:</strong> {selected.benefit}
      </div>
    </section>
  );
}
