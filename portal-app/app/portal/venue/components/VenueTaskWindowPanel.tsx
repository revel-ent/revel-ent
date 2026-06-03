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

export default async function VenueTaskWindowPanel() {
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
        <h3>Venue Task Windows</h3>
        <span className="chip">Timeline Slice</span>
      </div>
      <p>View the handoffs that depend on venue access, turnover, and compliance timing.</p>

      <ul className="feed-list">
        {projection.tasks.length === 0 ? (
          <li className="feed-item">Venue-linked tasks will appear here when planner assignments depend on venue timing.</li>
        ) : null}
        {projection.tasks.map((task) => (
          <li className="feed-item" key={task.id}>
            <div className="item-title-row">
              <span className="item-title">{task.title}</span>
              <span className="status-chip pending">{task.status.replace('_', ' ')}</span>
            </div>
            <p className="item-meta">
              {task.assignee.label}
              {formatDueDate(task.dueAtIso) ? ` · Due ${formatDueDate(task.dueAtIso)}` : ''}
            </p>
            <p className="item-note">
              {task.linkedTimeline.length > 0
                ? `Relevant windows: ${task.linkedTimeline.map((slice) => slice.title).join(', ')}`
                : 'Timeline windows pending.'}
            </p>
          </li>
        ))}
      </ul>
    </article>
  );
}