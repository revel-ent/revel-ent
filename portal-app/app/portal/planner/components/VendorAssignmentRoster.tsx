import { getVendorRosterProjectionForActor } from '@/lib/canonical-tasks';
import { getSession } from '@/lib/session';

export default async function VendorAssignmentRoster() {
  const session = await getSession();

  if (!session?.eventId) {
    return null;
  }

  const projection = getVendorRosterProjectionForActor({
    eventId: session.eventId,
    actorUserId: session.userId,
    actorRole: session.role
  });

  return (
    <article className="card">
      <div className="card-header">
        <h3>Vendor Assignment Roster</h3>
        <span className="chip">Role Projection</span>
      </div>
      <p>See assignment load by vendor and the exact timeline slices each handoff supports.</p>

      <ul className="feed-list">
        {projection.roster.map((entry) => (
          <li className="feed-item" key={entry.userId}>
            <div className="item-title-row">
              <span className="item-title">{entry.displayName}</span>
              <span className="status-chip safe">{entry.assignmentCount} assigned</span>
            </div>
            <p className="item-meta">
              {entry.vendorProfile.replace('_', ' ')} · {entry.openTaskCount} open
            </p>
            <p className="item-note">
              {entry.linkedTimeline.length > 0
                ? `Timeline coverage: ${entry.linkedTimeline.map((slice) => slice.title).join(', ')}`
                : 'No timeline slices linked yet.'}
            </p>
          </li>
        ))}
      </ul>
    </article>
  );
}