import { type Role } from '@/lib/auth';

export interface EventRecord {
  id: string;
  organizationId: string;
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
  organizationId: string;
  eventId: string;
  inviteCode: string;
}

const EVENTS: EventRecord[] = [
  {
    id: '0f1d7d0a-7c8f-4f5f-9c89-9c8b2f3e1a11',
    organizationId: 'org-revel-ent',
    code: 'REVEL-NOV-2026',
    title: 'Jayati & Akshay Wedding Weekend',
    city: 'Atlanta, GA',
    venueName: 'DoubleTree Atlanta Northlake',
    guestCountEstimate: 340
  },
  {
    id: '38e4b6c1-5935-4d20-9e17-2c89f2f9b922',
    organizationId: 'org-revel-ent',
    code: 'REVEL-DEC-2026',
    title: 'Sonia & Rohan Celebration',
    city: 'Atlanta, GA',
    venueName: 'The St. Regis Atlanta',
    guestCountEstimate: 280
  },
  {
    id: 'b3c9e1f2-4a7d-4e8b-a1c2-d5e6f7a8b9c0',
    organizationId: 'org-revel-ent',
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
    organizationId: 'org-revel-ent',
    eventId: '0f1d7d0a-7c8f-4f5f-9c89-9c8b2f3e1a11',
    inviteCode: 'ATLAS-ADM-JIGAR-2026'
  },
  {
    userId: 'usr-couple-jayati',
    email: 'jayati@example.com',
    displayName: 'Jayati',
    role: 'couple',
    organizationId: 'org-revel-ent',
    eventId: '0f1d7d0a-7c8f-4f5f-9c89-9c8b2f3e1a11',
    inviteCode: 'ATLAS-CPL-JAYATI-2026'
  },
  {
    userId: 'usr-planner-maulin',
    email: 'maulin@revel-ent.com',
    displayName: 'MC Maulin',
    role: 'planner',
    organizationId: 'org-revel-ent',
    eventId: '0f1d7d0a-7c8f-4f5f-9c89-9c8b2f3e1a11',
    inviteCode: 'ATLAS-PLN-MAULIN-2026'
  },
  {
    userId: 'usr-vendor-heckno',
    email: 'heckno@revel-ent.com',
    displayName: 'DJ Heckno',
    role: 'vendor',
    organizationId: 'org-revel-ent',
    eventId: '0f1d7d0a-7c8f-4f5f-9c89-9c8b2f3e1a11',
    inviteCode: 'ATLAS-VND-HECKNO-2026'
  },
  {
    userId: 'usr-dj-heckno',
    email: 'djmc@revel-ent.com',
    displayName: 'DJ Heckno MC',
    role: 'dj_mc',
    organizationId: 'org-revel-ent',
    eventId: '0f1d7d0a-7c8f-4f5f-9c89-9c8b2f3e1a11',
    inviteCode: 'ATLAS-DJ-HECKNO-2026'
  },
  {
    userId: 'usr-production-revel-1',
    email: 'production@revel-ent.com',
    displayName: 'REVEL Production Lead',
    role: 'production',
    organizationId: 'org-revel-ent',
    eventId: '0f1d7d0a-7c8f-4f5f-9c89-9c8b2f3e1a11',
    inviteCode: 'ATLAS-PROD-REVEL-2026'
  },
  {
    userId: 'usr-guest-family',
    email: 'guestfamily@example.com',
    displayName: 'Family Guest',
    role: 'guest',
    organizationId: 'org-revel-ent',
    eventId: '0f1d7d0a-7c8f-4f5f-9c89-9c8b2f3e1a11',
    inviteCode: 'ATLAS-GST-FAMILY-2026'
  },
  {
    userId: 'usr-delegate-priya',
    email: 'priya@example.com',
    displayName: 'Priya (Family Coordinator)',
    role: 'delegate_coordinator',
    organizationId: 'org-revel-ent',
    eventId: '0f1d7d0a-7c8f-4f5f-9c89-9c8b2f3e1a11',
    inviteCode: 'ATLAS-DEL-PRIYA-2026'
  },
  {
    userId: 'usr-venue-anita',
    email: 'anita.venue@example.com',
    displayName: 'Anita (Venue Coordinator)',
    role: 'venue_coordinator',
    organizationId: 'org-revel-ent',
    eventId: '0f1d7d0a-7c8f-4f5f-9c89-9c8b2f3e1a11',
    inviteCode: 'ATLAS-VEN-ANITA-2026'
  },
  {
    userId: 'usr-couple-akshay-patel',
    email: 'akshay.rani1128@gmail.com',
    displayName: 'Akshay Patel',
    role: 'couple',
    organizationId: 'org-revel-ent',
    eventId: 'b3c9e1f2-4a7d-4e8b-a1c2-d5e6f7a8b9c0',
    inviteCode: 'ATLAS-CPL-AKSHAY-2026'
  },
  {
    userId: 'usr-couple-rani-patel',
    email: 'rani.patel@example.com',
    displayName: 'Rani Patel',
    role: 'couple',
    organizationId: 'org-revel-ent',
    eventId: 'b3c9e1f2-4a7d-4e8b-a1c2-d5e6f7a8b9c0',
    inviteCode: 'ATLAS-CPL-RANI-2026'
  },
  {
    userId: 'usr-planner-amtopm',
    email: 'events@amtopmplanners.com',
    displayName: 'AM to PM planners',
    role: 'planner',
    organizationId: 'org-revel-ent',
    eventId: 'b3c9e1f2-4a7d-4e8b-a1c2-d5e6f7a8b9c0',
    inviteCode: 'ATLAS-PLN-AMTOPM-2026'
  },
  {
    userId: 'usr-vendor-dreamcatchers',
    email: 'dcevents.us@gmail.com',
    displayName: 'The Dreamcatchers Events LLC',
    role: 'vendor',
    organizationId: 'org-revel-ent',
    eventId: 'b3c9e1f2-4a7d-4e8b-a1c2-d5e6f7a8b9c0',
    inviteCode: 'ATLAS-VND-DREAM-2026'
  },
  {
    userId: 'usr-dj-rani-akshay',
    email: 'djmc.akshayrani@example.com',
    displayName: 'Signature DJ + MC',
    role: 'dj_mc',
    organizationId: 'org-revel-ent',
    eventId: 'b3c9e1f2-4a7d-4e8b-a1c2-d5e6f7a8b9c0',
    inviteCode: 'ATLAS-DJ-AKRN-2026'
  },
  {
    userId: 'usr-production-akshay-rani',
    email: 'production.akshayrani@example.com',
    displayName: 'REVEL Production Team',
    role: 'production',
    organizationId: 'org-revel-ent',
    eventId: 'b3c9e1f2-4a7d-4e8b-a1c2-d5e6f7a8b9c0',
    inviteCode: 'ATLAS-PROD-AKRN-2026'
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

export function findMembershipByEmailAndInviteCode(email: string, inviteCode: string): MemberRecord | null {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedInviteCode = inviteCode.trim().toUpperCase();

  return (
    MEMBERS.find(
      (member) =>
        member.email.toLowerCase() === normalizedEmail &&
        member.inviteCode.trim().toUpperCase() === normalizedInviteCode
    ) || null
  );
}

export function findMembershipByRoleAndEvent(role: Role, eventId: string | null): MemberRecord | null {
  if (eventId) {
    return MEMBERS.find((member) => member.role === role && member.eventId === eventId) || null;
  }

  return MEMBERS.find((member) => member.role === role) || null;
}

export function findMembershipByUserIdAndEvent(userId: string, eventId: string): MemberRecord | null {
  return MEMBERS.find((member) => member.userId === userId && member.eventId === eventId) || null;
}

export function listMembershipsByUserId(userId: string): MemberRecord[] {
  return MEMBERS.filter((member) => member.userId === userId);
}

export function listMembersByEvent(eventId: string): MemberRecord[] {
  return MEMBERS.filter((member) => member.eventId === eventId);
}
