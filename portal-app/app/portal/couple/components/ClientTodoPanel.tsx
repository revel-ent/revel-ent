'use client';

import { useState } from 'react';
import {
  type ClientEventPlan,
  type PlanningTodo,
  type MilestoneStatus,
  formatDate
} from '@/lib/mock-client-milestones';

interface Props {
  plan: ClientEventPlan;
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

export default function ClientTodoPanel({ plan }: Props) {
  const [todos, setTodos] = useState<PlanningTodo[]>(() => plan.planningTodos);
  const [expanded, setExpanded] = useState<string | null>(null);

  const completedCount = todos.filter((t) => t.status === 'completed').length;
  const totalCount = todos.length;
  const progressPct = Math.round((completedCount / totalCount) * 100);

  function toggleComplete(id: string) {
    setTodos((prev) =>
      prev.map((t) => {
        if (t.id !== id || !t.clientCompletable) return t;
        const isDone = t.status === 'completed';
        return {
          ...t,
          status: (isDone ? 'pending' : 'completed') as MilestoneStatus,
          completedAt: isDone ? undefined : new Date().toISOString().slice(0, 10)
        };
      })
    );
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
                    aria-label={todo.clientCompletable ? `Mark "${todo.title}" complete` : undefined}
                    onClick={() => todo.clientCompletable && toggleComplete(todo.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (todo.clientCompletable) toggleComplete(todo.id);
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
                  <p className="milestone-note milestone-note--expanded">{todo.detail}</p>
                )}
              </div>

              {todo.clientCompletable && !isDone && (
                <div className="milestone-item__action">
                  <button className="btn btn--sm btn--outline" onClick={() => toggleComplete(todo.id)}>
                    Mark Done
                  </button>
                </div>
              )}
              {todo.clientCompletable && isDone && (
                <div className="milestone-item__action">
                  <button className="btn btn--sm btn--ghost" onClick={() => toggleComplete(todo.id)}>
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
