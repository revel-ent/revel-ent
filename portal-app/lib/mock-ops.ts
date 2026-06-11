export interface CoordinationItem {
  id: string;
  eventId: string;
  owner: string;
  role: 'planner' | 'vendor' | 'ops';
  status: 'pending' | 'acknowledged' | 'executed';
  timestamp: string;
  update: string;
}

const COORDINATION_FEED: CoordinationItem[] = [
  // ── Akshay & Rani Patel (b3c9e1f2-…) ────────────────────────────────────
  {
    id: 'ar-001',
    eventId: 'b3c9e1f2-4a7d-4e8b-a1c2-d5e6f7a8b9c0',
    owner: 'Revel Entertainment',
    role: 'ops',
    status: 'executed',
    timestamp: '2026-06-11T12:00:00Z',
    update: 'Your full production team is now confirmed — DJ Heckno, MC Jigar, and DC Events are locked in for your weekend.'
  },
  {
    id: 'ar-002',
    eventId: 'b3c9e1f2-4a7d-4e8b-a1c2-d5e6f7a8b9c0',
    owner: 'Revel Entertainment',
    role: 'ops',
    status: 'executed',
    timestamp: '2026-06-07T10:00:00Z',
    update: 'Booking deposit received — your dates are secured and planning is officially underway.'
  },
  {
    id: 'ar-003',
    eventId: 'b3c9e1f2-4a7d-4e8b-a1c2-d5e6f7a8b9c0',
    owner: 'Revel Entertainment',
    role: 'ops',
    status: 'executed',
    timestamp: '2026-05-15T09:00:00Z',
    update: 'Contract signed and on file. Welcome to the Revel family — we are honored to be part of your wedding weekend.'
  },
  // ── Jayati & Uppal (0f1d7d0a-…) — reference event ───────────────────────
  {
    id: 'chg-001',
    eventId: '0f1d7d0a-7c8f-4f5f-9c89-9c8b2f3e1a11',
    owner: 'MC Maulin',
    role: 'planner',
    status: 'pending',
    timestamp: '2026-11-14T16:40:00Z',
    update: 'Grand entry pushed by 10 minutes due to photo timeline overrun.'
  },
  {
    id: 'chg-002',
    eventId: '0f1d7d0a-7c8f-4f5f-9c89-9c8b2f3e1a11',
    owner: 'REVEL Ops',
    role: 'ops',
    status: 'acknowledged',
    timestamp: '2026-11-14T16:47:00Z',
    update: 'Lighting cue profile updated for delayed entry sequence.'
  },
  {
    id: 'chg-003',
    eventId: '0f1d7d0a-7c8f-4f5f-9c89-9c8b2f3e1a11',
    owner: 'DJ Heckno',
    role: 'vendor',
    status: 'executed',
    timestamp: '2026-11-14T16:55:00Z',
    update: 'Dance floor open-format warmup adjusted and confirmed with planner.'
  }
];

export function getCoordinationFeedByEvent(eventId: string): CoordinationItem[] {
  return COORDINATION_FEED.filter((item) => item.eventId === eventId).sort((a, b) =>
    a.timestamp > b.timestamp ? -1 : 1
  );
}

const GUEST_FAQ_ANSWERS: Array<{ keyword: string; answer: string }> = [
  {
    keyword: 'parking',
    answer: 'Guest parking opens 60 minutes before the first event segment. Follow valet signage at the main entrance.'
  },
  {
    keyword: 'dress',
    answer: 'Sangeet attire is festive formal. For haldi-related moments, lighter colors are recommended.'
  },
  {
    keyword: 'baraat',
    answer: 'Baraat lineup begins outside the main ballroom entrance. Arrive 15 minutes early for placement.'
  },
  {
    keyword: 'dinner',
    answer: 'Dinner service is scheduled after core formalities. Expect announcements in the portal and on-site by MC.'
  }
];

export function answerGuestQuestion(question: string): string {
  const normalized = question.toLowerCase();
  const match = GUEST_FAQ_ANSWERS.find((item) => normalized.includes(item.keyword));

  if (match) {
    return match.answer;
  }

  return 'Thanks for your question. We have routed this to the planning desk and will provide a context-specific answer shortly.';
}
