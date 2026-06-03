'use client';

import { useEffect, useState } from 'react';

import { type ApprovalProjection } from '@/lib/couple-domains';

function approvalStatusLabel(status: ApprovalProjection['approvals'][number]['status']): string {
  if (status === 'complete') {
    return 'Complete';
  }

  if (status === 'locked') {
    return 'Available after deposit confirmation';
  }

  return 'Awaiting your review';
}

function approvalDomainLabel(sourceDomain: ApprovalProjection['approvals'][number]['sourceDomain']): string {
  return sourceDomain === 'music' ? 'Music' : 'Planning';
}

export default function ApprovalsStatusPanel({ initialData }: { initialData: ApprovalProjection }) {
  const [data, setData] = useState(initialData);

  useEffect(() => {
    async function refresh() {
      const response = await fetch('/api/events/approvals', { cache: 'no-store' });
      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as { approvals: ApprovalProjection['approvals']; summary: ApprovalProjection['summary'] };
      setData({ approvals: payload.approvals, summary: payload.summary });
    }

    const handleRefresh = () => {
      void refresh();
    };

    window.addEventListener('atlas:couple-domains-refresh', handleRefresh);
    return () => window.removeEventListener('atlas:couple-domains-refresh', handleRefresh);
  }, []);

  return (
    <article className="client-panel">
      <div className="client-panel__header">
        <div>
          <h2 className="client-panel__title">Approvals & Sign-offs</h2>
          <p className="client-panel__sub">A clear view of the decisions waiting for your final green light.</p>
        </div>
        <div className="payment-progress-block">
          <div className="payment-progress-bar">
            <div className="payment-progress-bar__fill" style={{ width: `${Math.round((data.summary.completeCount / data.summary.totalCount) * 100)}%` }} />
          </div>
          <span className="payment-progress-label">
            {data.summary.completeCount} of {data.summary.totalCount} confirmations complete
          </span>
        </div>
      </div>

      <ul className="milestone-list">
        {data.approvals.map((approval) => (
          <li key={approval.id} className={`milestone-item${approval.status === 'complete' ? ' milestone-item--done' : ''}`}>
            <div className="milestone-item__body">
              <div className="milestone-item__row">
                <span className="milestone-item__label">{approval.title}</span>
                <span className={`todo-badge ${approval.status === 'complete' ? 'todo-badge--done' : approval.status === 'locked' ? 'todo-badge--upcoming' : 'todo-badge--action'}`}>
                  {approvalStatusLabel(approval.status)}
                </span>
              </div>
              <div className="milestone-item__row milestone-item__row--meta">
                <span className="milestone-date">{approvalDomainLabel(approval.sourceDomain)}</span>
                {approval.dueDate ? <span className="milestone-date">Due {approval.dueDate}</span> : null}
              </div>
              <p className="milestone-note">{approval.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </article>
  );
}