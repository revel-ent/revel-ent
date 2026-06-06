import { listMembersByEvent } from '@/lib/mock-data';

interface Props {
  eventId: string;
}

const CONTACT_LABELS: Record<string, string> = {
  planner: 'Planner',
  venue_coordinator: 'Venue',
  production: 'Production',
  dj_mc: 'DJ / MC',
  vendor: 'Vendor',
  decorator: 'Decorator',
  couple: 'Couple'
};

const CONTACT_PRIORITY = ['planner', 'venue_coordinator', 'production', 'dj_mc', 'vendor', 'decorator'] as const;

export default function ClientContactsPanel({ eventId }: Props) {
  const members = listMembersByEvent(eventId);
  const contacts = CONTACT_PRIORITY.flatMap((role) =>
    members
      .filter((member) => member.role === role)
      .map((member) => ({
        label: CONTACT_LABELS[member.role] ?? member.role,
        name: member.displayName,
        email: member.email
      }))
  );

  return (
    <section className="client-panel" aria-label="Contacts">
      <div className="client-panel__header">
        <div>
          <h2 className="client-panel__title">Contacts</h2>
          <p className="client-panel__sub">The people you will actually need during planning and event week.</p>
        </div>
      </div>

      {contacts.length > 0 ? (
        <ul className="concierge-feed-list">
          {contacts.map((contact) => (
            <li key={`${contact.label}-${contact.email}`} className="concierge-feed-item">
              <div className="item-title-row">
                <strong className="item-title">{contact.label}</strong>
                <span className="item-meta">{contact.name}</span>
              </div>
              <p className="item-note">{contact.email}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="item-note">Contacts will appear once your planning team is assigned to this event.</p>
      )}
    </section>
  );
}