import { getSession } from '@/lib/session';
import { getTaskProjectionForActor } from '@/lib/canonical-tasks';

function formatDueDate(iso: string | null): string | null {
  if (!iso) {
    return null;
  }

  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
}

function statusClass(status: 'pending' | 'acknowledged' | 'in_progress' | 'completed' | 'blocked'): string {
  if (status === 'completed') return 'status-chip completed';
  if (status === 'acknowledged' || status === 'in_progress') return 'status-chip in_progress';
  if (status === 'blocked') return 'status-chip delayed';
  return 'status-chip pending';
}

export default async function PlannerTaskBoard() {
  const session = await getSession();

  if (!session?.eventId) {
    return null;
  }

  const projection = getTaskProjectionForActor({
    eventId: session.eventId,
    actorUserId: session.userId,
    actorRole: session.role
  });

  return (
    <article className="card">
      <div className="card-header">
        <h3>Task Control Board</h3>
        <span className="chip">Milestone 3</span>
      </div>
      <p>
        Timeline-linked tasks show who owns each execution handoff so planners can manage blockers before they turn
        into day-of drift.
      </p>

      <div className="portal-page-kpis">
        <div className="kpi-card">
          <span className="kpi-label">Open Tasks</span>
          <span className="kpi-value">{projection.summary.openTasks}</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Total Tasks</span>
          <span className="kpi-value">{projection.summary.totalTasks}</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Timeline Links</span>
          <span className="kpi-value">{projection.summary.linkedTimelineIds.length}</span>
        </div>
      </div>

      <ul className="feed-list">
        {projection.tasks.slice(0, 4).map((task) => (
          <li className="feed-item" key={task.id}>
            <div className="item-title-row">
              <span className="item-title">{task.title}</span>
              <span className={statusClass(task.status)}>{task.status.replace('_', ' ').toUpperCase()}</span>
            </div>
            <p className="item-meta">
              {task.assignee.label} · {task.assignee.profile.replace('_', ' ')}
              {formatDueDate(task.dueAtIso) ? ` · Due ${formatDueDate(task.dueAtIso)}` : ''}
            </p>
            <p className="item-note">{task.description}</p>
            <p className="item-note vendor-finance-note">
              {task.linkedTimeline.length > 0
                ? `Linked timeline: ${task.linkedTimeline.map((slice) => slice.title).join(', ')}`
                : 'Timeline link pending.'}
            </p>
          </li>
        ))}
      </ul>
    </article>
  );
}