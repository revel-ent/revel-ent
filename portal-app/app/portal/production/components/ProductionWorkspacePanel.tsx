'use client';

import { useEffect, useState } from 'react';

import {
  type CueStatus,
  type EquipmentStatus,
  type ProductionWorkspaceProjection,
  type VenueRiskFlag
} from '@/lib/production-domains';

interface WorkspacePayload {
  workspace: ProductionWorkspaceProjection;
}

function badgeClass(status: string) {
  if (status === 'complete' || status === 'ready' || status === 'acknowledged') {
    return 'todo-badge todo-badge--done';
  }

  if (status === 'blocked' || status === 'open') {
    return 'todo-badge todo-badge--action';
  }

  return 'todo-badge todo-badge--upcoming';
}

export default function ProductionWorkspacePanel() {
  const [data, setData] = useState<ProductionWorkspaceProjection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/events/production/workspace', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Unable to load production workspace.');
      }

      const payload = (await response.json()) as WorkspacePayload;
      setData(payload.workspace);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load production workspace.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function acknowledgeRisk(risk: VenueRiskFlag, acknowledged: boolean) {
    const response = await fetch(`/api/events/venue-intelligence/risks/${risk.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acknowledged, mitigationNote: acknowledged ? `Acknowledged by production at ${new Date().toLocaleTimeString()}.` : '' })
    });

    if (response.ok) {
      void refresh();
    }
  }

  async function updateEquipment(itemId: string, status: EquipmentStatus) {
    const response = await fetch(`/api/events/equipment/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });

    if (response.ok) {
      void refresh();
    }
  }

  async function updateCue(cueId: string, status: CueStatus) {
    const response = await fetch(`/api/events/run-of-show/${cueId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status,
        actualAtIso: status === 'complete' ? new Date().toISOString() : null
      })
    });

    if (response.ok) {
      void refresh();
    }
  }

  if (loading) {
    return <div className="portal-notice">Loading production workspace...</div>;
  }

  if (error || !data) {
    return <div className="portal-notice">{error ?? 'Production workspace is unavailable right now.'}</div>;
  }

  return (
    <div className="couple-dashboard-grid concierge-detail-stack">
      <section className="concierge-hero" aria-label="Production hero summary">
        <p className="concierge-hero__kicker">Production Status</p>
        <h2 className="concierge-hero__title">{data.hero.title}</h2>
        <p className="concierge-hero__body">{data.hero.detail}</p>
        <a className="btn primary concierge-hero__cta" href={data.hero.ctaTarget}>
          {data.hero.ctaLabel}
        </a>
      </section>

      <section className="client-panel" id="production-venue" aria-label="Venue intelligence risks">
        <div className="client-panel__header">
          <div>
            <h2 className="client-panel__title">Venue Intelligence</h2>
            <p className="client-panel__sub">Constraints and risks that impact production execution.</p>
          </div>
          <span className="todo-badge todo-badge--upcoming">
            {data.venue.summary.openCriticalCount} critical open
          </span>
        </div>

        <ul className="milestone-list">
          {data.venue.riskFlags.map((risk) => (
            <li key={risk.id} className={`milestone-item${risk.status === 'acknowledged' ? ' milestone-item--done' : ''}`}>
              <div className="milestone-item__body">
                <div className="milestone-item__row">
                  <span className="milestone-item__label">{risk.title}</span>
                  <span className={badgeClass(risk.status)}>{risk.status}</span>
                </div>
                <p className="milestone-note">{risk.detail}</p>
                <p className="item-note">Mitigation: {risk.mitigationGuidance}</p>
                <div className="split">
                  <button className="btn btn--sm btn--outline" type="button" onClick={() => void acknowledgeRisk(risk, true)}>
                    Acknowledge
                  </button>
                  <button className="btn btn--sm btn--ghost" type="button" onClick={() => void acknowledgeRisk(risk, false)}>
                    Reopen
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="client-panel" id="production-equipment" aria-label="Equipment manifest">
        <div className="client-panel__header">
          <div>
            <h2 className="client-panel__title">Equipment Manifest</h2>
            <p className="client-panel__sub">Operational readiness linked to venue and cue dependencies.</p>
          </div>
          <span className="todo-badge todo-badge--upcoming">{data.equipment.summary.blockedCount} blocked</span>
        </div>

        <ul className="milestone-list">
          {data.equipment.items.map((item) => (
            <li key={item.id} className={`milestone-item${item.status === 'complete' ? ' milestone-item--done' : ''}`}>
              <div className="milestone-item__body">
                <div className="milestone-item__row">
                  <span className="milestone-item__label">{item.label}</span>
                  <span className={badgeClass(item.status)}>{item.status}</span>
                </div>
                {item.note ? <p className="milestone-note">{item.note}</p> : null}
                <div className="split">
                  <button className="btn btn--sm btn--outline" type="button" onClick={() => void updateEquipment(item.id, 'ready')}>
                    Mark Ready
                  </button>
                  <button className="btn btn--sm btn--ghost" type="button" onClick={() => void updateEquipment(item.id, 'complete')}>
                    Mark Complete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="client-panel" id="production-cues" aria-label="Run of show cue board">
        <div className="client-panel__header">
          <div>
            <h2 className="client-panel__title">Run-of-Show Cue Board</h2>
            <p className="client-panel__sub">Cue state and dependency health for the next execution moments.</p>
          </div>
          <span className="todo-badge todo-badge--upcoming">{data.cueBoard.summary.blockedCount} blocked cues</span>
        </div>

        <ul className="milestone-list">
          {data.cueBoard.cues.map((cue) => (
            <li key={cue.id} className={`milestone-item${cue.status === 'complete' ? ' milestone-item--done' : ''}`}>
              <div className="milestone-item__body">
                <div className="milestone-item__row">
                  <span className="milestone-item__label">{cue.title}</span>
                  <span className={badgeClass(cue.status)}>{cue.status}</span>
                </div>
                <div className="milestone-item__row milestone-item__row--meta">
                  <span className="milestone-date">Phase: {cue.phase}</span>
                  <span className="milestone-date">Owner: {cue.ownerLabel}</span>
                </div>
                {cue.blockingReasons.length > 0 ? (
                  <p className="milestone-note">Blocked by: {cue.blockingReasons.join(' · ')}</p>
                ) : null}
                <div className="split">
                  <button className="btn btn--sm btn--outline" type="button" onClick={() => void updateCue(cue.id, 'in_progress')}>
                    Start Cue
                  </button>
                  <button className="btn btn--sm btn--ghost" type="button" onClick={() => void updateCue(cue.id, 'complete')}>
                    Mark Complete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="client-panel" aria-label="Production action queue">
        <div className="client-panel__header">
          <div>
            <h2 className="client-panel__title">Action Queue</h2>
            <p className="client-panel__sub">Ordered actions based on current blockers and upcoming execution dependencies.</p>
          </div>
        </div>
        <ul className="milestone-list">
          {data.nextActions.map((action) => (
            <li key={action.id} className="milestone-item">
              <div className="milestone-item__body">
                <div className="milestone-item__row">
                  <span className="milestone-item__label">{action.label}</span>
                  <a className="btn btn--sm btn--outline" href={action.target}>
                    Open
                  </a>
                </div>
                <p className="milestone-note">{action.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
