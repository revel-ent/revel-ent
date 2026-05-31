import { findEventById } from '@/lib/mock-data';

export interface GuestLocalRecommendation {
  id: string;
  title: string;
  category: 'food' | 'activity' | 'family' | 'shopping';
  notes: string;
}

export interface GuestExperienceData {
  eventId: string;
  attireNotes: string;
  parkingNotes: string;
  songRequestLimit: number;
  dietaryPrompt: string;
  localRecommendations: GuestLocalRecommendation[];
}

const GUEST_EXPERIENCE: Record<string, GuestExperienceData> = {
  'b3c9e1f2-4a7d-4e8b-a1c2-d5e6f7a8b9c0': {
    eventId: 'b3c9e1f2-4a7d-4e8b-a1c2-d5e6f7a8b9c0',
    attireNotes:
      'Day 1 welcome: festive semi-formal. Day 2 main ceremonies: traditional Indian attire encouraged. Reception: formal evening wear.',
    parkingNotes:
      'Complimentary valet is available at InterContinental Buckhead. For baraat timing, arrive 30 minutes early due to road control.',
    songRequestLimit: 2,
    dietaryPrompt:
      'Let us know allergies, Jain preferences, vegan needs, and no-onion/no-garlic requests at least 10 days before event.',
    localRecommendations: [
      {
        id: 'loc-1',
        title: 'Phipps Plaza + Buckhead Village',
        category: 'shopping',
        notes: 'High-end shopping and quick dining options near the hotel.'
      },
      {
        id: 'loc-2',
        title: 'Atlanta Botanical Garden',
        category: 'family',
        notes: 'Good daytime option for out-of-town guests with children.'
      },
      {
        id: 'loc-3',
        title: 'Chai Pani Decatur',
        category: 'food',
        notes: 'Popular Indian street-food style dining for guests arriving early.'
      }
    ]
  }
};

const FALLBACK: GuestExperienceData = {
  eventId: 'default',
  attireNotes: 'Wedding attire guidance will be posted by your planner soon.',
  parkingNotes: 'Parking and arrival guidance will be posted once venue logistics are finalized.',
  songRequestLimit: 1,
  dietaryPrompt: 'Share allergies and dietary restrictions in advance so the planner can coordinate with catering.',
  localRecommendations: []
};

export function getGuestExperienceData(eventId: string): GuestExperienceData {
  return GUEST_EXPERIENCE[eventId] || FALLBACK;
}

export function getGuestEventLabel(eventId: string): string {
  return findEventById(eventId)?.title || 'Your Event';
}
