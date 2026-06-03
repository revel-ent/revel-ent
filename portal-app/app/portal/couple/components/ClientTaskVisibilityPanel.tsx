import { getTaskProjectionForActor } from '@/lib/canonical-tasks';
import { getSession } from '@/lib/session';

function formatDueDate(iso: string | null): string | null {
  if (!iso) {
    return null;
  }

  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
}

export default async function ClientTaskVisibilityPanel() {
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
    <article className="client-panel">
      <div className="client-panel__header">
        <div>
          <h2 className="client-panel__title">Planner-Managed Task Highlights</h2>
          <p className="client-panel__sub">
            Visible planning milestones tied to your live event timeline.
          </p>
        </div>
        <div className="payment-progress-block">
          <div className="payment-progress-bar">
            <div
              className="payment-progress-bar__fill"
              style={{
                width: `${projection.summary.totalTasks === 0 ? 0 : Math.round(((projection.summary.totalTasks - projection.summary.openTasks) / projection.summary.totalTasks) * 100)}%`
              }}
            />
          </div>
          <span className="payment-progress-label">
            {projection.summary.totalTasks - projection.summary.openTasks} of {projection.summary.totalTasks} visible tasks complete
          </span>
        </div>
      </div>

      <ul className="milestone-list">
        {projection.tasks.map((task) => (
          <li key={task.id} className="milestone-item">
            <div className="milestone-item__body">
              <div className="milestone-item__row">
                <span className="milestone-item__label">{task.title}</span>
                <span className="todo-badge todo-badge--upcoming">{task.status.replace('_', ' ')}</span>
              </div>
              <div className="milestone-item__row milestone-item__row--meta">
                <span className="milestone-date">
                  {task.assignee.label}
                  {formatDueDate(task.dueAtIso) ? ` · Due ${formatDueDate(task.dueAtIso)}` : ''}
                </span>
              </div>
              <p className="milestone-note">{task.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </article>
  );
}