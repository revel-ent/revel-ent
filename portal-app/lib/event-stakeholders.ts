export type EventStakeholderRole = 'couple' | 'planner' | 'venue_coordinator' | 'decorator' | 'vendor' | 'other';

export interface EventStakeholder {
  role: EventStakeholderRole;
  label: string;
  email: string;
  phone?: string;
}

const EVENT_STAKEHOLDERS: Record<string, EventStakeholder[]> = {
  'b3c9e1f2-4a7d-4e8b-a1c2-d5e6f7a8b9c0': [
    {
      role: 'couple',
      label: 'Akshay & Rani Patel',
      email: 'akshay.rani1128@gmail.com'
    },
    {
      role: 'planner',
      label: 'AM to PM Planners',
      email: 'events@amtopmplanners.com',
      phone: '856-237-9189 / 856-220-1506'
    },
    {
      role: 'decorator',
      label: 'The Dreamcatchers Events LLC',
      email: 'dcevents.us@gmail.com'
    },
    {
      role: 'venue_coordinator',
      label: 'Mishaela Freeman — Crowne Plaza Peachtree City',
      email: 'mishaela.freeman@crowneplazaptc.com',
      phone: '770-487-3056'
    },
    {
      role: 'vendor',
      label: 'DJ Heckno',
      email: 'hecknobeats@gmail.com'
    },
    {
      role: 'vendor',
      label: 'DJ Aladdinn',
      email: 'djaladdinnbookings@gmail.com'
    },
    {
      role: 'vendor',
      label: 'Jigar Mody (MC)',
      email: 'jigarmody24@gmail.com'
    }
  ]
};

export function getEventStakeholders(eventId: string): EventStakeholder[] {
  return EVENT_STAKEHOLDERS[eventId] ?? [];
}

export function getEventStakeholderEmails(eventId: string): string[] {
  const unique = new Set<string>();

  for (const stakeholder of getEventStakeholders(eventId)) {
    const email = stakeholder.email.trim().toLowerCase();
    if (email.length > 0) {
      unique.add(email);
    }
  }

  return Array.from(unique);
}