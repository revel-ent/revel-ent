'use client';

import { useState } from 'react';
import {
  type ClientEventPlan,
  type PaymentMilestone,
  type MilestoneStatus,
  formatCurrency,
  formatDate,
  getDaysUntil
} from '@/lib/mock-client-milestones';

interface Props {
  plan: ClientEventPlan;
}

function statusLabel(status: MilestoneStatus, daysUntil?: number): string {
  if (status === 'completed') return 'Paid';
  if (status === 'overdue') return 'Overdue';
  if (daysUntil !== undefined && daysUntil <= 7 && daysUntil >= 0) return `Due in ${daysUntil}d`;
  return 'Upcoming';
}

function statusClass(status: MilestoneStatus, daysUntil?: number): string {
  if (status === 'completed') return 'milestone-badge milestone-badge--paid';
  if (status === 'overdue') return 'milestone-badge milestone-badge--overdue';
  if (daysUntil !== undefined && daysUntil <= 7 && daysUntil >= 0) return 'milestone-badge milestone-badge--urgent';
  return 'milestone-badge milestone-badge--upcoming';
}

export default function ClientPaymentPanel({ plan }: Props) {
  const [milestones, setMilestones] = useState<PaymentMilestone[]>(() => plan.paymentMilestones);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const totalPaid = milestones
    .filter((m) => m.status === 'completed')
    .reduce((sum, m) => sum + m.amount, 0);
  const totalRemaining = plan.totalContractValue - totalPaid;
  const paidPercent = Math.round((totalPaid / plan.totalContractValue) * 100);

  function markPaid(id: string) {
    setMilestones((prev) =>
      prev.map((m) =>
        m.id === id
          ? { ...m, status: 'completed' as MilestoneStatus, completedAt: new Date().toISOString().slice(0, 10) }
          : m
      )
    );
    setConfirmingId(null);
  }

  return (
    <div className="client-panel">
      <div className="client-panel__header">
        <div>
          <h2 className="client-panel__title">Payment Schedule</h2>
          <p className="client-panel__sub">
            Contract total: <strong>{formatCurrency(plan.totalContractValue)}</strong>
          </p>
        </div>
        <div className="payment-progress-block">
          <div className="payment-progress-bar">
            <div className="payment-progress-bar__fill" style={{ width: `${paidPercent}%` }} />
          </div>
          <span className="payment-progress-label">
            {formatCurrency(totalPaid)} paid · {formatCurrency(totalRemaining)} remaining
          </span>
        </div>
      </div>

      <ul className="milestone-list">
        {milestones.map((m) => {
          const days = m.status === 'pending' ? getDaysUntil(m.dueDate) : undefined;
          const isConfirming = confirmingId === m.id;

          return (
            <li key={m.id} className={`milestone-item${m.status === 'completed' ? ' milestone-item--done' : ''}`}>
              <div className="milestone-item__check">
                {m.status === 'completed' ? (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
                    <circle cx="10" cy="10" r="10" fill="#3a7d44" />
                    <path d="M5.5 10.5l3 3 6-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <div className="milestone-item__circle" />
                )}
              </div>

              <div className="milestone-item__body">
                <div className="milestone-item__row">
                  <span className="milestone-item__label">{m.label}</span>
                  <span className={statusClass(m.status, days)}>{statusLabel(m.status, days)}</span>
                </div>
                <div className="milestone-item__row milestone-item__row--meta">
                  <span className="milestone-amount">{formatCurrency(m.amount)} ({m.percent}%)</span>
                  {m.status === 'completed' && m.completedAt ? (
                    <span className="milestone-date">Received {formatDate(m.completedAt)}</span>
                  ) : (
                    <span className="milestone-date">Due {formatDate(m.dueDate)}</span>
                  )}
                </div>
                {m.note && m.status !== 'completed' && (
                  <p className="milestone-note">{m.note}</p>
                )}
                {m.status === 'completed' && (
                  <p className="milestone-note milestone-note--success">
                    Payment received. Thank you!
                  </p>
                )}
              </div>

              {m.clientCompletable && m.status === 'pending' && (
                <div className="milestone-item__action">
                  {isConfirming ? (
                    <div className="milestone-confirm-block">
                      <p className="milestone-confirm-text">
                        Mark <strong>{formatCurrency(m.amount)}</strong> as sent?
                      </p>
                      <div className="milestone-confirm-row">
                        <button className="btn btn--sm btn--confirm" onClick={() => markPaid(m.id)}>
                          Yes, I sent it
                        </button>
                        <button className="btn btn--sm btn--ghost" onClick={() => setConfirmingId(null)}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button className="btn btn--sm btn--outline" onClick={() => setConfirmingId(m.id)}>
                      Mark as Sent
                    </button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
