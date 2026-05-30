import { findEventById } from '@/lib/mock-data';

export interface FusionFlowInput {
  eventId: string;
  cultureBlend: string;
  vibeGoal: string;
  mustPlayTracks: string;
  guestCount: number;
}

export interface VenueAnalyzerInput {
  eventId: string;
  venueName: string;
  guestCount: number;
  ceilingHeightFt: number;
  roomType: string;
}

export function buildFusionFlowPlan(input: FusionFlowInput) {
  const event = findEventById(input.eventId);
  const crowdScale = input.guestCount >= 300 ? 'high-density crowd' : 'mid-density crowd';

  return {
    event: event?.title || 'Unknown Event',
    assumptions: [
      `Culture blend focus: ${input.cultureBlend}`,
      `Guest volume profile: ${crowdScale}`,
      `Primary energy goal: ${input.vibeGoal}`
    ],
    timelineMoments: [
      {
        phase: 'Arrival + Cocktail',
        musicDirection: 'Warm open-format with cultural cues at low BPM',
        lightingState: 'Ambient gold wash with soft perimeter uplighting'
      },
      {
        phase: 'Grand Entry + First Peak',
        musicDirection: `Transition into high-impact entry sequence. Seed tracks around: ${input.mustPlayTracks}`,
        lightingState: 'Dynamic moving heads + controlled haze where venue allows'
      },
      {
        phase: 'Dance Floor Sustain',
        musicDirection: 'Alternate diaspora anthems with crossover resets every 3-4 songs',
        lightingState: 'Peak program with alternating color temperatures for crowd resets'
      }
    ],
    nextBestAction: 'Route to consultation with this draft attached and lock production package assumptions.',
    confidence: 0.84
  };
}

export function buildVenueAnalyzerReport(input: VenueAnalyzerInput) {
  const event = findEventById(input.eventId);
  const verticalCoverageRisk = input.ceilingHeightFt >= 20;
  const crowdRisk = input.guestCount >= 320;

  const required = [
    'Dedicated DJ booth power isolation',
    'Wireless microphone redundancy (minimum two handheld + one lav)'
  ];

  if (verticalCoverageRisk) {
    required.push('Vertical truss or elevated fixture strategy for room saturation');
  }

  if (crowdRisk) {
    required.push('Expanded speaker coverage zones to prevent dead pockets');
  }

  return {
    event: event?.title || 'Unknown Event',
    venue: input.venueName,
    roomType: input.roomType,
    required,
    riskFlags: [
      verticalCoverageRisk ? 'Ceiling height may dilute standard uplighting coverage.' : 'Ceiling height within standard range.',
      crowdRisk ? 'Guest volume indicates potential bottlenecks for dancefloor flow.' : 'Guest volume within standard circulation range.'
    ],
    trustMetadata: {
      sourceType: 'ops-model-v1',
      reviewedBy: 'REVEL Production Team',
      reviewedOn: '2026-05-22',
      confidenceScore: 0.8
    }
  };
}
