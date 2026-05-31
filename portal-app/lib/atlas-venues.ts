import { getSupabaseAdminClient } from '@/lib/supabase-server';

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

export interface AtlasVenueConstraint {
  category: string;
  key: string;
  valueText: string | null;
  valueNumber: number | null;
  valueBoolean: boolean | null;
  unit: string | null;
  notes: string | null;
}

export interface AtlasVenueDetail extends AtlasVenueSeed {
  roomName?: string;
  state?: string | null;
  address?: string;
  lengthFt?: number;
  widthFt?: number;
  heightFt?: number;
  diagramAssets?: Array<{ id: string; url: string; type?: string; notes?: string }>;
  sourceLinks?: Array<{ label: string; url: string }>;
  constraints: AtlasVenueConstraint[];
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

function evaluateCapacity(venue: AtlasVenueSeed, guestCount: number): CapacityCheckResult {
  const guests = Math.max(0, Math.floor(guestCount));

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

function toSourceConfidence(value: string | null | undefined): AtlasVenueSeed['sourceConfidence'] {
  if (value === 'vendor_verified' || value === 'partially_verified' || value === 'unverified') {
    return value;
  }

  return 'unverified';
}

function summarizeConstraints(constraints: AtlasVenueConstraint[]): { notes: string[]; summary: string; noiseCurfewHour?: number } {
  const notes = constraints
    .filter((constraint) => constraint.notes || constraint.valueText)
    .slice(0, 3)
    .map((constraint) => {
      if (constraint.notes) {
        return constraint.notes;
      }

      return `${constraint.key.replace(/_/g, ' ')}: ${constraint.valueText}`;
    });

  const riskKeys = ['baraat_policy', 'push_distance', 'loading_dock', 'curfew_time', 'max_decibels'];
  const summaryBits = constraints
    .filter((constraint) => riskKeys.includes(constraint.key))
    .slice(0, 3)
    .map((constraint) => {
      const value = constraint.valueText ?? constraint.valueNumber ?? constraint.valueBoolean;
      return `${constraint.key.replace(/_/g, ' ')} ${value}`;
    });

  const curfew = constraints.find((constraint) => constraint.key === 'curfew_time')?.valueText ?? null;
  const curfewHour = curfew ? Number.parseInt(curfew, 10) : Number.NaN;

  return {
    notes,
    summary:
      summaryBits.join(' | ') || 'Atlas venue constraints available for planner review and day-of coordination.',
    noiseCurfewHour: Number.isFinite(curfewHour) ? curfewHour : undefined
  };
}

function fallbackVenueDetail(seed: AtlasVenueSeed): AtlasVenueDetail {
  return {
    ...seed,
    constraints: []
  };
}

export async function listAtlasVenues(): Promise<{ venues: AtlasVenueSeed[]; source: 'database' | 'fallback' }> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return { venues: ATLAS_VENUE_SEEDS, source: 'fallback' };
  }

  const { data, error } = await supabase
    .from('venues')
    .select(
      'atlas_record_id, name, city, state, room_name, marketed_capacity, comfortable_range_min, comfortable_range_max, verification_status'
    )
    .order('name', { ascending: true })
    .limit(80);

  if (error || !data || data.length === 0) {
    return { venues: ATLAS_VENUE_SEEDS, source: 'fallback' };
  }

  return {
    source: 'database',
    venues: data.map((row) => ({
      id: row.atlas_record_id as string,
      name: [row.name, row.room_name].filter(Boolean).join(' - '),
      city: [row.city, row.state].filter(Boolean).join(', '),
      marketedCapacity: Number(row.marketed_capacity ?? 0),
      comfortableRangeMin: Number(row.comfortable_range_min ?? 0),
      comfortableRangeMax: Number(row.comfortable_range_max ?? 0),
      notes: [],
      constraintsSummary: 'Imported Atlas venue intelligence available.',
      sourceConfidence: toSourceConfidence(row.verification_status as string | null)
    }))
  };
}

export async function getAtlasVenueDetail(venueId: string): Promise<AtlasVenueDetail | null> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    const fallback = findAtlasVenueById(venueId);
    return fallback ? fallbackVenueDetail(fallback) : null;
  }

  const { data: venueRow, error: venueError } = await supabase
    .from('venues')
    .select(
      'venue_id, atlas_record_id, name, room_name, city, state, address, length_ft, width_ft, height_ft, marketed_capacity, comfortable_range_min, comfortable_range_max, verification_status, diagram_assets, source_links'
    )
    .eq('atlas_record_id', venueId)
    .maybeSingle();

  if (venueError || !venueRow) {
    const fallback = findAtlasVenueById(venueId);
    return fallback ? fallbackVenueDetail(fallback) : null;
  }

  const { data: constraintRows } = await supabase
    .from('venue_constraints')
    .select('category, key, value_text, value_number, value_boolean, unit, notes')
    .eq('venue_id', venueRow.venue_id as string)
    .order('category', { ascending: true });

  const constraints: AtlasVenueConstraint[] = (constraintRows ?? []).map((row) => ({
    category: row.category as string,
    key: row.key as string,
    valueText: (row.value_text as string | null) ?? null,
    valueNumber: typeof row.value_number === 'number' ? row.value_number : null,
    valueBoolean: typeof row.value_boolean === 'boolean' ? row.value_boolean : null,
    unit: (row.unit as string | null) ?? null,
    notes: (row.notes as string | null) ?? null
  }));

  const summary = summarizeConstraints(constraints);

  return {
    id: venueRow.atlas_record_id as string,
    name: venueRow.name as string,
    roomName: (venueRow.room_name as string | null) ?? undefined,
    city: [venueRow.city, venueRow.state].filter(Boolean).join(', '),
    state: (venueRow.state as string | null) ?? null,
    address: (venueRow.address as string | null) ?? undefined,
    marketedCapacity: Number(venueRow.marketed_capacity ?? 0),
    comfortableRangeMin: Number(venueRow.comfortable_range_min ?? 0),
    comfortableRangeMax: Number(venueRow.comfortable_range_max ?? 0),
    notes: summary.notes,
    constraintsSummary: summary.summary,
    noiseCurfewHour: summary.noiseCurfewHour,
    sourceConfidence: toSourceConfidence(venueRow.verification_status as string | null),
    lengthFt: typeof venueRow.length_ft === 'number' ? venueRow.length_ft : undefined,
    widthFt: typeof venueRow.width_ft === 'number' ? venueRow.width_ft : undefined,
    heightFt: typeof venueRow.height_ft === 'number' ? venueRow.height_ft : undefined,
    diagramAssets: Array.isArray(venueRow.diagram_assets)
      ? (venueRow.diagram_assets as Array<{ id: string; url: string; type?: string; notes?: string }>)
      : [],
    sourceLinks: Array.isArray(venueRow.source_links)
      ? (venueRow.source_links as Array<{ label: string; url: string }>)
      : [],
    constraints
  };
}

export function findAtlasVenueById(venueId: string): AtlasVenueSeed | undefined {
  return ATLAS_VENUE_SEEDS.find((venue) => venue.id === venueId);
}

export async function findAtlasVenueByIdLive(venueId: string): Promise<AtlasVenueSeed | undefined> {
  const detail = await getAtlasVenueDetail(venueId);

  if (detail) {
    return detail;
  }

  return findAtlasVenueById(venueId);
}

export function runCapacityCheck(input: CapacityCheckInput): CapacityCheckResult | null {
  const venue = findAtlasVenueById(input.venueId);

  if (!venue) {
    return null;
  }

  return evaluateCapacity(venue, input.guestCount);
}

export async function runCapacityCheckLive(input: CapacityCheckInput): Promise<CapacityCheckResult | null> {
  const venue = await findAtlasVenueByIdLive(input.venueId);

  if (!venue) {
    return null;
  }

  return evaluateCapacity(venue, input.guestCount);
}
