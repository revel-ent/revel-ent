import { type Role } from '@/lib/auth';

export interface EventRecord {
  id: string;
  code: string;
  title: string;
  city: string;
  venueName: string;
  guestCountEstimate: number;
}

export interface MemberRecord {
  userId: string;
  email: string;
  displayName: string;
  role: Role;
  eventId: string;
}

const EVENTS: EventRecord[] = [
  {
    id: '0f1d7d0a-7c8f-4f5f-9c89-9c8b2f3e1a11',
    code: 'REVEL-NOV-2026',
    title: 'Jayati & Akshay Wedding Weekend',
    city: 'Atlanta, GA',
    venueName: 'DoubleTree Atlanta Northlake',
    guestCountEstimate: 340
  },
  {
    id: '38e4b6c1-5935-4d20-9e17-2c89f2f9b922',
    code: 'REVEL-DEC-2026',
    title: 'Sonia & Rohan Celebration',
    city: 'Atlanta, GA',
    venueName: 'The St. Regis Atlanta',
    guestCountEstimate: 280
  },
  {
    id: 'b3c9e1f2-4a7d-4e8b-a1c2-d5e6f7a8b9c0',
    code: 'REVEL-NOV27-2026',
    title: 'Akshay & Rani Patel Wedding Weekend',
    city: 'Atlanta, GA',
    venueName: 'InterContinental Buckhead',
    guestCountEstimate: 220
  }
];

const MEMBERS: MemberRecord[] = [
  {
    userId: 'usr-admin-jigar',
    email: 'jigar@revel-ent.com',
    displayName: 'Jigar',
    role: 'admin',
    eventId: '0f1d7d0a-7c8f-4f5f-9c89-9c8b2f3e1a11'
  },
  {
    userId: 'usr-couple-jayati',
    email: 'jayati@example.com',
    displayName: 'Jayati',
    role: 'couple',
    eventId: '0f1d7d0a-7c8f-4f5f-9c89-9c8b2f3e1a11'
  },
  {
    userId: 'usr-planner-maulin',
    email: 'maulin@revel-ent.com',
    displayName: 'MC Maulin',
    role: 'planner',
    eventId: '0f1d7d0a-7c8f-4f5f-9c89-9c8b2f3e1a11'
  },
  {
    userId: 'usr-vendor-heckno',
    email: 'heckno@revel-ent.com',
    displayName: 'DJ Heckno',
    role: 'vendor',
    eventId: '0f1d7d0a-7c8f-4f5f-9c89-9c8b2f3e1a11'
  },
  {
    userId: 'usr-guest-family',
    email: 'guestfamily@example.com',
    displayName: 'Family Guest',
    role: 'guest',
    eventId: '0f1d7d0a-7c8f-4f5f-9c89-9c8b2f3e1a11'
  },
  {
    userId: 'usr-delegate-priya',
    email: 'priya@example.com',
    displayName: 'Priya (Family Coordinator)',
    role: 'delegate_coordinator',
    eventId: '0f1d7d0a-7c8f-4f5f-9c89-9c8b2f3e1a11'
  },
  {
    userId: 'usr-venue-anita',
    email: 'anita.venue@example.com',
    displayName: 'Anita (Venue Coordinator)',
    role: 'venue_coordinator',
    eventId: '0f1d7d0a-7c8f-4f5f-9c89-9c8b2f3e1a11'
  },
  {
    userId: 'usr-couple-akshay-patel',
    email: 'akshay.patel@example.com',
    displayName: 'Akshay Patel',
    role: 'couple',
    eventId: 'b3c9e1f2-4a7d-4e8b-a1c2-d5e6f7a8b9c0'
  },
  {
    userId: 'usr-couple-rani-patel',
    email: 'rani.patel@example.com',
    displayName: 'Rani Patel',
    role: 'couple',
    eventId: 'b3c9e1f2-4a7d-4e8b-a1c2-d5e6f7a8b9c0'
  }
];

export function listDemoEvents(): EventRecord[] {
  return EVENTS;
}

export function findEventById(eventId: string): EventRecord | undefined {
  return EVENTS.find((event) => event.id === eventId);
}

export function findEventByCode(code: string): EventRecord | undefined {
  const normalized = code.trim().toUpperCase();
  return EVENTS.find((event) => event.code.toUpperCase() === normalized);
}

export function findMembershipByEmailAndEventCode(email: string, eventCode: string): MemberRecord | null {
  const normalizedEmail = email.trim().toLowerCase();
  const event = findEventByCode(eventCode);

  if (!event) {
    return null;
  }

  return (
    MEMBERS.find(
      (member) =>
        member.email.toLowerCase() === normalizedEmail &&
        member.eventId === event.id
    ) || null
  );
}

export function findMembershipByRoleAndEvent(role: Role, eventId: string | null): MemberRecord | null {
  if (eventId) {
    return MEMBERS.find((member) => member.role === role && member.eventId === eventId) || null;
  }

  return MEMBERS.find((member) => member.role === role) || null;
}
