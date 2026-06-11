import { getSupabaseAdminClient } from '@/lib/supabase-server';

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
};

const CONTACT_PRIORITY = ['planner', 'venue_coordinator', 'production', 'dj_mc', 'vendor', 'decorator'] as const;

async function loadContacts(eventId: string) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return [];

  const { data: tokens } = await supabase
    .from('invite_tokens')
    .select('invitee_email, invitee_display_name, target_role')
    .eq('event_id', eventId)
    .eq('status', 'accepted')
    .order('created_at', { ascending: true });

  if (!tokens) return [];

  // Deduplicate by email, keep first occurrence, exclude test/example accounts and couple role
  const seen = new Set<string>();
  const real: { role: string; name: string; email: string }[] = [];
  for (const t of tokens) {
    const email = (t.invitee_email as string) ?? '';
    const role = (t.target_role as string) ?? '';
    if (role === 'couple') continue;
    if (email.endsWith('@example.com')) continue;
    if (seen.has(email)) continue;
    seen.add(email);
    real.push({
      role,
      name: (t.invitee_display_name as string | null) || email.split('@')[0],
      email,
    });
  }
  return real;
}

export default async function ClientContactsPanel({ eventId }: Props) {
  const members = await loadContacts(eventId);
  const contacts = CONTACT_PRIORITY.flatMap((role) =>
    members
      .filter((member) => member.role === role)
      .map((member) => ({
        label: CONTACT_LABELS[member.role] ?? member.role,
        name: member.name,
        email: member.email,
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