export interface AtlasVenueSeed {
  id: string;
  name: string;
  city: string;
  marketedCapacity: number;
  comfortableRangeMin: number;
  comfortableRangeMax: number;
  notes: string[];
  constraintsSummary: string;
  noiseCurfewHour?: number;
  sourceConfidence: 'vendor_verified' | 'partially_verified' | 'unverified';
}

export interface CapacityCheckInput {
  venueId: string;
  guestCount: number;
}

export interface CapacityCheckResult {
  venue: AtlasVenueSeed;
  status: 'safe' | 'tight' | 'unsafe';
  message: string;
}

export const ATLAS_VENUE_SEEDS: AtlasVenueSeed[] = [
  {
    id: 'st-regis-atlanta-astor-ballroom',
    name: 'The St. Regis Atlanta - Astor Ballroom',
    city: 'Atlanta, GA',
    marketedCapacity: 350,
    comfortableRangeMin: 220,
    comfortableRangeMax: 300,
    notes: ['Power access is strongest on east service wall.', 'Load-in window closes at 5:00 PM.'],
    constraintsSummary: 'Indoor cap is typically below marketed brochure number for full production builds.',
    noiseCurfewHour: 22,
    sourceConfidence: 'partially_verified'
  },
  {
    id: 'intercontinental-buckhead-windsor',
    name: 'InterContinental Buckhead - Windsor Ballroom',
    city: 'Atlanta, GA',
    marketedCapacity: 850,
    comfortableRangeMin: 420,
    comfortableRangeMax: 560,
    notes: ['Rigging is allowed with venue approval.', 'Garden route supports baraat staging with pre-clearance.'],
    constraintsSummary: 'High capacity room, but dance floor and staging quickly reduce seated comfort range.',
    noiseCurfewHour: 24,
    sourceConfidence: 'vendor_verified'
  },
  {
    id: 'doubletree-northlake-grand',
    name: 'DoubleTree Atlanta Northlake - Grand Ballroom',
    city: 'Atlanta, GA',
    marketedCapacity: 420,
    comfortableRangeMin: 240,
    comfortableRangeMax: 320,
    notes: ['Loading path can bottleneck during simultaneous decorator and AV setup.', 'Confirm outdoor baraat noise window with property.'],
    constraintsSummary: 'Capacity is usually safe for mid-size events but can tighten with complex staging.',
    noiseCurfewHour: 23,
    sourceConfidence: 'partially_verified'
  }
];

export function findAtlasVenueById(venueId: string): AtlasVenueSeed | undefined {
  return ATLAS_VENUE_SEEDS.find((venue) => venue.id === venueId);
}

export function runCapacityCheck(input: CapacityCheckInput): CapacityCheckResult | null {
  const venue = findAtlasVenueById(input.venueId);

  if (!venue) {
    return null;
  }

  const guests = Math.max(0, Math.floor(input.guestCount));

  if (guests <= venue.comfortableRangeMax) {
    return {
      venue,
      status: 'safe',
      message: `Comfortable for ${guests} guests with current assumptions.`
    };
  }

  if (guests <= Math.floor(venue.comfortableRangeMax * 1.1)) {
    return {
      venue,
      status: 'tight',
      message: `Possible but tight at ${guests} guests. Review layout, staging, and guest flow before locking timeline.`
    };
  }

  return {
    venue,
    status: 'unsafe',
    message: `At ${guests} guests this plan exceeds the typical comfortable range. You should review contingencies before proceeding.`
  };
}
