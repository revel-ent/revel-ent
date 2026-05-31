import { getSession } from '@/lib/session';
import { getVendorMilestonesForEvent } from '@/lib/mock-vendor-milestones';

function formatDate(isoDate: string): string {
  return new Date(`${isoDate}T12:00:00`).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}

function statusClass(status: 'pending' | 'acknowledged' | 'completed'): string {
  if (status === 'completed') return 'status-chip completed';
  if (status === 'acknowledged') return 'status-chip in_progress';
  return 'status-chip pending';
}

export default async function VendorMilestoneBoard() {
  const session = await getSession();

  if (!session?.eventId) {
    return null;
  }

  const milestones = getVendorMilestonesForEvent(session.eventId);

  return (
    <article className="card">
      <div className="card-header">
        <h3>Vendor Milestones</h3>
        <span className="chip">Due-Date First</span>
      </div>
      <p>
        Milestones can expose due dates without requiring full financial disclosure. Amounts remain hidden when
        configured by event policy.
      </p>

      <ul className="feed-list">
        {milestones.length === 0 ? <li className="feed-item">No milestones assigned yet.</li> : null}
        {milestones.map((item) => (
          <li className="feed-item" key={item.id}>
            <div className="item-title-row">
              <span className="item-title">{item.vendorType}: {item.title}</span>
              <span className={statusClass(item.status)}>{item.status.toUpperCase()}</span>
            </div>
            <p className="item-meta">Due {formatDate(item.dueDate)}</p>
            <p className="item-note">{item.note}</p>
            <p className="item-note vendor-finance-note">
              {item.amountVisibleToVendor && typeof item.amountDue === 'number'
                ? `Amount Due: $${item.amountDue.toLocaleString('en-US')}`
                : 'Financial amount hidden by policy. Date-based reminder is active.'}
            </p>
          </li>
        ))}
      </ul>
    </article>
  );
}
