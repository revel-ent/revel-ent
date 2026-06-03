'use client';

import { useEffect, useState } from 'react';
import {
  formatDate
} from '@/lib/mock-client-milestones';
import { type ChecklistProjection } from '@/lib/couple-domains';

interface Props {
  initialData: ChecklistProjection;
}

const CATEGORY_LABELS: Record<string, string> = {
  payment: 'Payment',
  planning: 'Planning',
  document: 'Document',
  upgrade: 'Upgrade'
};

const CATEGORY_ICONS: Record<string, string> = {
  payment: '💳',
  planning: '📋',
  document: '📄',
  upgrade: '✨'
};

function badgeClass(status: MilestoneStatus, badgeLabel?: string): string {
  if (status === 'completed') return 'todo-badge todo-badge--done';
  if (badgeLabel === 'Action Required') return 'todo-badge todo-badge--action';
  return 'todo-badge todo-badge--upcoming';
}

export default function ClientTodoPanel({ initialData }: Props) {
  const [todos, setTodos] = useState(initialData.checklist);
  const [summary, setSummary] = useState(initialData.summary);
  const [expanded, setExpanded] = useState<string | null>(null);

  const completedCount = summary.completedChecklistCount;
  const totalCount = summary.totalChecklistCount;
  const progressPct = Math.round((completedCount / totalCount) * 100);

  useEffect(() => {
    async function refresh() {
      const response = await fetch('/api/events/checklist', { cache: 'no-store' });
      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as ChecklistProjection;
      setTodos(payload.checklist);
      setSummary(payload.summary);
    }

    const handleRefresh = () => {
      void refresh();
    };

    window.addEventListener('atlas:couple-domains-refresh', handleRefresh);
    return () => window.removeEventListener('atlas:couple-domains-refresh', handleRefresh);
  }, []);

  async function toggleComplete(id: string, workflowKey: string | null) {
    if (workflowKey === 'music') {
      window.dispatchEvent(new Event('atlas:open-music-experience'));
      return;
    }

    const response = await fetch(`/api/events/checklist/${id}`, { method: 'PATCH' });
    if (!response.ok) {
      return;
    }

    window.dispatchEvent(new Event('atlas:couple-domains-refresh'));
  }

  return (
    <div className="client-panel">
      <div className="client-panel__header">
        <div>
          <h2 className="client-panel__title">Your Planning Checklist</h2>
          <p className="client-panel__sub">
            {completedCount} of {totalCount} steps complete
          </p>
        </div>
        <div className="payment-progress-block">
          <div className="payment-progress-bar">
            <div className="payment-progress-bar__fill" style={{ width: `${progressPct}%` }} />
          </div>
          <span className="payment-progress-label">{progressPct}% of pre-event checklist done</span>
        </div>
      </div>

      <ul className="milestone-list">
        {todos.map((todo) => {
          const isExpanded = expanded === todo.id;
          const isDone = todo.status === 'completed';

          return (
            <li key={todo.id} className={`milestone-item${isDone ? ' milestone-item--done' : ''}`}>
              <div className="milestone-item__check">
                {isDone ? (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
                    <circle cx="10" cy="10" r="10" fill="#3a7d44" />
                    <path
                      d="M5.5 10.5l3 3 6-6"
                      stroke="#fff"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <div
                    className={`milestone-item__circle${todo.clientCompletable ? ' milestone-item__circle--clickable' : ''}`}
                    role={todo.clientCompletable ? 'button' : undefined}
                    tabIndex={todo.clientCompletable ? 0 : undefined}
                    aria-label={todo.clientCompletable ? `Update "${todo.title}"` : undefined}
                    onClick={() => todo.clientCompletable && void toggleComplete(todo.id, todo.workflowKey)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (todo.clientCompletable) void toggleComplete(todo.id, todo.workflowKey);
                      }
                    }}
                  />
                )}
              </div>

              <div className="milestone-item__body">
                <div className="milestone-item__row">
                  <button
                    className="milestone-item__label milestone-item__label--btn"
                    onClick={() => setExpanded(isExpanded ? null : todo.id)}
                    aria-expanded={isExpanded}
                  >
                    <span className="milestone-cat-icon" aria-hidden>
                      {CATEGORY_ICONS[todo.category]}
                    </span>
                    {todo.title}
                    <span className="milestone-expand-caret" aria-hidden>
                      {isExpanded ? '▲' : '▼'}
                    </span>
                  </button>
                  <span className={badgeClass(todo.status, todo.badgeLabel)}>{todo.badgeLabel || CATEGORY_LABELS[todo.category]}</span>
                </div>

                {todo.dueDate && !isDone && (
                  <div className="milestone-item__row milestone-item__row--meta">
                    <span className="milestone-date">Due {formatDate(todo.dueDate)}</span>
                  </div>
                )}
                {isDone && todo.completedAt && (
                  <div className="milestone-item__row milestone-item__row--meta">
                    <span className="milestone-date">Completed {formatDate(todo.completedAt)}</span>
                  </div>
                )}

                {isExpanded && (
                  <>
                    <p className="milestone-note milestone-note--expanded">{todo.detail}</p>
                    {todo.unlockReason ? <p className="milestone-note">{todo.unlockReason}</p> : null}
                  </>
                )}
              </div>

              {todo.clientCompletable && !isDone && (
                <div className="milestone-item__action">
                  <button className="btn btn--sm btn--outline" onClick={() => void toggleComplete(todo.id, todo.workflowKey)}>
                    {todo.actionLabel ?? 'Mark Done'}
                  </button>
                </div>
              )}
              {todo.clientCompletable && isDone && (
                <div className="milestone-item__action">
                  <button className="btn btn--sm btn--ghost" onClick={() => void toggleComplete(todo.id, todo.workflowKey)}>
                    Undo
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
