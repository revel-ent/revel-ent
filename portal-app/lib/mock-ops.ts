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
