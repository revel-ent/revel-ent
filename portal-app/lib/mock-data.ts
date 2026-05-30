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
    id: 'evt-revel-2026-11-15',
    code: 'REVEL-NOV-2026',
    title: 'Jayati & Akshay Wedding Weekend',
    city: 'Atlanta, GA',
    venueName: 'DoubleTree Atlanta Northlake',
    guestCountEstimate: 340
  },
  {
    id: 'evt-revel-2026-12-05',
    code: 'REVEL-DEC-2026',
    title: 'Sonia & Rohan Celebration',
    city: 'Atlanta, GA',
    venueName: 'The St. Regis Atlanta',
    guestCountEstimate: 280
  }
];

const MEMBERS: MemberRecord[] = [
  {
    userId: 'usr-admin-jigar',
    email: 'jigar@revel-ent.com',
    displayName: 'Jigar',
    role: 'admin',
    eventId: 'evt-revel-2026-11-15'
  },
  {
    userId: 'usr-couple-jayati',
    email: 'jayati@example.com',
    displayName: 'Jayati',
    role: 'couple',
    eventId: 'evt-revel-2026-11-15'
  },
  {
    userId: 'usr-planner-maulin',
    email: 'maulin@revel-ent.com',
    displayName: 'MC Maulin',
    role: 'planner',
    eventId: 'evt-revel-2026-11-15'
  },
  {
    userId: 'usr-vendor-heckno',
    email: 'heckno@revel-ent.com',
    displayName: 'DJ Heckno',
    role: 'vendor',
    eventId: 'evt-revel-2026-11-15'
  },
  {
    userId: 'usr-guest-family',
    email: 'guestfamily@example.com',
    displayName: 'Family Guest',
    role: 'guest',
    eventId: 'evt-revel-2026-11-15'
  },
  {
    userId: 'usr-delegate-priya',
    email: 'priya@example.com',
    displayName: 'Priya (Family Coordinator)',
    role: 'delegate_coordinator',
    eventId: 'evt-revel-2026-11-15'
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
