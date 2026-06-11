// Client-facing planning milestones, payment schedule, and optional upgrades.
// In production, these would be generated from the signed contract via AI extraction
// and stored in the events/milestones table in Supabase.

export type MilestoneStatus = 'pending' | 'completed' | 'overdue' | 'not_applicable';
export type MilestoneCategory = 'payment' | 'planning' | 'document' | 'upgrade';

export interface PaymentMilestone {
  id: string;
  label: string;
  amount: number;
  percent: number;
  dueDate: string; // ISO date string
  status: MilestoneStatus;
  completedAt?: string;
  note?: string;
  clientCompletable: boolean; // client can self-report (e.g. wire transfer sent)
}

export interface PlanningTodo {
  id: string;
  category: MilestoneCategory;
  title: string;
  detail: string;
  dueDate?: string;
  status: MilestoneStatus;
  completedAt?: string;
  clientCompletable: boolean;
  badgeLabel?: string;
}

export interface UpgradeOption {
  id: string;
  title: string;
  description: string;
  price: number;
  unit: string; // 'flat', 'per hour', 'per head', etc.
  category: string;
  popular?: boolean;
}

export interface ClientEventPlan {
  eventId: string;
  contractSignedDate: string;
  primaryDates: string[];
  venueName: string;
  estimatedGuests: number;
  totalContractValue: number;
  paymentMilestones: PaymentMilestone[];
  planningTodos: PlanningTodo[];
  upgrades: UpgradeOption[];
}

// ─────────────────────────────────────────────
// November 27-28 2026 — Akshay & Rani Patel
// Contract total: $17,700
// Signed: May 15, 2026 (both parties)
// 30% deposit ($5,310) due at signing
// Remaining 70% ($12,390) final due 14 days before event → Nov 13, 2026
// Venue: Crowne Plaza Peachtree City, 201 Aberdeen Pkwy, Peachtree City, GA 30269
// ─────────────────────────────────────────────
const AKSHAY_RANI_PLAN: ClientEventPlan = {
  eventId: 'b3c9e1f2-4a7d-4e8b-a1c2-d5e6f7a8b9c0',
  contractSignedDate: '2026-05-15',
  primaryDates: ['2026-11-27', '2026-11-28'],
  venueName: 'Crowne Plaza Peachtree City',
  estimatedGuests: 300,
  totalContractValue: 17700,
  paymentMilestones: [
    {
      id: 'pay-deposit',
      label: '30% Booking Deposit',
      amount: 5310,
      percent: 30,
      dueDate: '2026-05-15',
      status: 'completed',
      completedAt: '2026-06-07',
      clientCompletable: true,
      note: 'Received June 7, 2026 via PayPal credit card. Thank you!'
    },
    {
      id: 'pay-final',
      label: 'Remaining Balance',
      amount: 12390,
      percent: 70,
      dueDate: '2026-11-13',
      status: 'pending',
      clientCompletable: true,
      note: 'Due 14 days before your first event date. No changes to package after this milestone.'
    }
  ],
  planningTodos: [
    {
      id: 'todo-contract',
      category: 'document',
      title: 'Signed Contract on File',
      detail: 'Your agreement is signed and recorded. No action needed.',
      status: 'completed',
      completedAt: '2026-05-15',
      clientCompletable: false,
      badgeLabel: 'Done'
    },
    {
      id: 'todo-music-questionnaire',
      category: 'planning',
      title: 'Complete Music Questionnaire (First Step After Deposit)',
      detail:
        'Please submit your dance-floor music preferences within 7 days of your 30% deposit confirmation. Include approximate percentage split by genre: Bhangra (newer), Bhangra (old school), Bollywood (newer), Bollywood (older), old school hip-hop, current hip-hop/Top 40 hits, house, Latin, and other. Add any dance-off ideas plus additional notes about artists, genres, or transitions.',
      dueDate: '2026-06-11',
      status: 'pending',
      clientCompletable: true,
      badgeLabel: 'Action Required'
    },
    {
      id: 'todo-intake',
      category: 'planning',
      title: 'Complete Vision & Preferences Intake',
      detail:
        'Share your cultural background, ceremony styles, music preferences, and any non-negotiables. This helps us personalize every detail.',
      dueDate: '2026-06-15',
      status: 'pending',
      clientCompletable: false,
      badgeLabel: 'Action Required'
    },
    {
      id: 'todo-venue-walkthrough',
      category: 'planning',
      title: 'Schedule Venue Walk-Through',
      detail:
        'We recommend an in-person site visit at Crowne Plaza Peachtree City to review stage placement, décor constraints, and production flow.',
      dueDate: '2026-07-31',
      status: 'pending',
      clientCompletable: false,
      badgeLabel: 'Upcoming'
    },
    {
      id: 'todo-guestlist',
      category: 'planning',
      title: 'Confirm Final Guest Count',
      detail:
        'Finalize your headcount within ±10%. This locks in catering estimates, seating charts, and audio zoning for the space.',
      dueDate: '2026-09-15',
      status: 'pending',
      clientCompletable: true,
      badgeLabel: 'Upcoming'
    },
    {
      id: 'todo-music-brief',
      category: 'planning',
      title: 'Submit Music & Ceremony Cue Brief',
      detail:
        'After your questionnaire is complete, share ceremony songs, processional tracks, first dance, and any dhol/band preferences so we can finalize your production cue sheet.',
      dueDate: '2026-10-01',
      status: 'pending',
      clientCompletable: false,
      badgeLabel: 'Upcoming'
    },
    {
      id: 'todo-vendor-approval',
      category: 'planning',
      title: 'Approve Recommended Vendor List',
      detail:
        'Review décor, photography, catering, and florals vendors REVEL has coordinated with for your venue. Approve or request alternatives.',
      dueDate: '2026-08-15',
      status: 'pending',
      clientCompletable: false,
      badgeLabel: 'Upcoming'
    },
    {
      id: 'todo-day-of-brief',
      category: 'planning',
      title: 'Review & Sign Off on Day-Of Timeline',
      detail:
        'Your personalized ceremony-to-reception run-of-show. We will send a draft 30 days before the event for your final approval.',
      dueDate: '2026-10-28',
      status: 'pending',
      clientCompletable: true,
      badgeLabel: 'Upcoming'
    }
  ],
  upgrades: [
    {
      id: 'upg-photobooth',
      title: 'Premium Photo Booth Experience',
      description:
        'Custom-branded photo booth with unlimited prints, digital sharing station, and a dedicated attendant for the full reception.',
      price: 1200,
      unit: 'flat',
      category: 'Entertainment',
      popular: true
    },
    {
      id: 'upg-monogram',
      title: 'Custom Gobo Monogram Lighting',
      description:
        'Your names and wedding date projected as a monogram pattern on the dance floor or wall during reception.',
      price: 450,
      unit: 'flat',
      category: 'Lighting'
    },
    {
      id: 'upg-afterparty-dj',
      title: 'After-Party DJ Extension',
      description: 'Extend your DJ/MC package by 2 hours for a private after-party set with curated late-night energy.',
      price: 950,
      unit: 'flat',
      category: 'Entertainment',
      popular: true
    },
    {
      id: 'upg-uplighting',
      title: 'Enhanced Uplighting Package',
      description:
        'Upgrade from standard to premium uplighting — 24 LED uplights in custom color palette matching your wedding palette.',
      price: 650,
      unit: 'flat',
      category: 'Lighting'
    },
    {
      id: 'upg-vip-concierge',
      title: 'VIP Day-of Concierge Coordinator',
      description:
        'A dedicated REVEL coordinator on-site for both event days, handling guest logistics, vendor management, and real-time timeline execution.',
      price: 1500,
      unit: 'flat',
      category: 'Coordination'
    }
  ]
};

// ─────────────────────────────────────────────
// Jayati & Uppal — existing event (partial plan shown as reference)
// ─────────────────────────────────────────────
const JAYATI_UPPAL_PLAN: ClientEventPlan = {
  eventId: '0f1d7d0a-7c8f-4f5f-9c89-9c8b2f3e1a11',
  contractSignedDate: '2026-02-14',
  primaryDates: ['2026-05-23', '2026-05-24'],
  venueName: 'DoubleTree Atlanta Northlake',
  estimatedGuests: 340,
  totalContractValue: 24000,
  paymentMilestones: [
    {
      id: 'pay-deposit-ja',
      label: '30% Booking Deposit',
      amount: 7200,
      percent: 30,
      dueDate: '2026-02-21',
      status: 'completed',
      completedAt: '2026-02-19',
      clientCompletable: true,
      note: 'Wire received. Thank you!'
    },
    {
      id: 'pay-mid-ja',
      label: '40% Mid-Event Payment',
      amount: 9600,
      percent: 40,
      dueDate: '2026-08-22',
      status: 'pending',
      clientCompletable: true,
      note: 'Due 90 days before your event. Wire or check accepted.'
    },
    {
      id: 'pay-final-ja',
      label: '30% Final Balance',
      amount: 7200,
      percent: 30,
      dueDate: '2026-11-07',
      status: 'pending',
      clientCompletable: true,
      note: 'Due 14 days before your first event date.'
    }
  ],
  planningTodos: [
    {
      id: 'todo-contract-ja',
      category: 'document',
      title: 'Signed Contract on File',
      detail: 'Agreement signed and recorded.',
      status: 'completed',
      completedAt: '2026-02-14',
      clientCompletable: false,
      badgeLabel: 'Done'
    },
    {
      id: 'todo-intake-ja',
      category: 'planning',
      title: 'Complete Vision & Preferences Intake',
      detail: 'Share cultural background, ceremony styles, and music preferences.',
      dueDate: '2026-03-15',
      status: 'completed',
      completedAt: '2026-03-08',
      clientCompletable: false,
      badgeLabel: 'Done'
    },
    {
      id: 'todo-guestlist-ja',
      category: 'planning',
      title: 'Confirm Final Guest Count',
      detail: 'Finalize headcount within ±10% to lock catering estimates.',
      dueDate: '2026-09-01',
      status: 'pending',
      clientCompletable: true,
      badgeLabel: 'Upcoming'
    },
    {
      id: 'todo-music-brief-ja',
      category: 'planning',
      title: 'Submit Music & Ceremony Cue Brief',
      detail: 'Ceremony songs, processional tracks, first dance, and dhol preferences.',
      dueDate: '2026-09-15',
      status: 'pending',
      clientCompletable: false,
      badgeLabel: 'Upcoming'
    },
    {
      id: 'todo-timeline-ja',
      category: 'planning',
      title: 'Review & Sign Off on Day-Of Timeline',
      detail: 'Your run-of-show draft will be sent 30 days before the event.',
      dueDate: '2026-10-22',
      status: 'pending',
      clientCompletable: true,
      badgeLabel: 'Upcoming'
    }
  ],
  upgrades: [
    {
      id: 'upg-photobooth-ja',
      title: 'Premium Photo Booth Experience',
      description: 'Custom-branded photo booth with unlimited prints and digital sharing.',
      price: 1200,
      unit: 'flat',
      category: 'Entertainment',
      popular: true
    },
    {
      id: 'upg-afterparty-ja',
      title: 'After-Party DJ Extension',
      description: 'Extend DJ/MC package by 2 hours for a private after-party set.',
      price: 950,
      unit: 'flat',
      category: 'Entertainment',
      popular: true
    },
    {
      id: 'upg-dhol-ja',
      title: 'Dhol Player — Baraat & Reception',
      description: 'Live dhol for Baraat procession and reception entrance.',
      price: 800,
      unit: 'flat',
      category: 'Live Music'
    }
  ]
};

const PLANS: ClientEventPlan[] = [JAYATI_UPPAL_PLAN, AKSHAY_RANI_PLAN];

export function getClientPlanForEvent(eventId: string): ClientEventPlan | undefined {
  return PLANS.find((plan) => plan.eventId === eventId);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
    amount
  );
}

export function formatDate(isoDate: string): string {
  const date = new Date(isoDate + 'T12:00:00');
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export function getDaysUntil(isoDate: string): number {
  const due = new Date(isoDate + 'T12:00:00');
  const now = new Date();
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}
