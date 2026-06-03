import { getSession } from '@/lib/session';
import { getTaskProjectionForActor } from '@/lib/canonical-tasks';

function formatDate(isoDate: string): string {
  return new Date(`${isoDate}T12:00:00`).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}

function statusClass(status: 'pending' | 'acknowledged' | 'in_progress' | 'completed' | 'blocked'): string {
  if (status === 'completed') return 'status-chip completed';
  if (status === 'acknowledged' || status === 'in_progress') return 'status-chip in_progress';
  if (status === 'blocked') return 'status-chip delayed';
  return 'status-chip pending';
}

export default async function VendorMilestoneBoard() {
  const session = await getSession();

  if (!session?.eventId) {
    return null;
  }

  const projection = getTaskProjectionForActor({
    eventId: session.eventId,
    actorUserId: session.userId,
    actorRole: session.role
  });
  const tasks = projection.tasks;

  return (
    <article className="card">
      <div className="card-header">
        <h3>Assigned Tasks</h3>
        <span className="chip">Timeline Linked</span>
      </div>
      <p>
        Each task is linked to the exact timeline moment it supports so vendors only see the work and schedule slices
        relevant to their assignment.
      </p>

      <ul className="feed-list">
        {tasks.length === 0 ? (
          <li className="feed-item">Assignments will appear here once the planning team links your work to a timeline moment.</li>
        ) : null}
        {tasks.map((item) => (
          <li className="feed-item" key={item.id}>
            <div className="item-title-row">
              <span className="item-title">{item.title}</span>
              <span className={statusClass(item.status)}>{item.status.toUpperCase()}</span>
            </div>
            {item.dueAtIso ? <p className="item-meta">Due {formatDate(item.dueAtIso.slice(0, 10))}</p> : null}
            <p className="item-note">{item.description}</p>
            <p className="item-note vendor-finance-note">
              {item.linkedTimeline.length > 0
                ? `Linked timeline: ${item.linkedTimeline.map((slice) => slice.title).join(', ')}`
                : 'Timeline link pending.'}
            </p>
          </li>
        ))}
      </ul>
    </article>
  );
}
