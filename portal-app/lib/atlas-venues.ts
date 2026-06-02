import { getSupabaseAdminClient } from '@/lib/supabase-server';
import type { AtlasSeverity, AtlasStatus, AtlasTriggerKey, VenueConstraintProfile } from '@/lib/atlas-types';

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
  venueUuid?: string;
  roomName?: string;
  state?: string | null;
  address?: string;
  lengthFt?: number;
  widthFt?: number;
  heightFt?: number;
  diagramAssets?: Array<{ id: string; url: string; type?: string; notes?: string }>;
  sourceLinks?: Array<{ label: string; url: string }>;
  constraintProfile?: VenueConstraintProfile | null;
  constraints: AtlasVenueConstraint[];
}

export interface OutdoorPowerCurfewInput {
  venueId: string;
  eventId: string | null;
  ceremonyOutdoors?: boolean;
  baraatOutdoors?: boolean;
}

export interface OutdoorPowerCurfewRecommendation {
  triggerKey: AtlasTriggerKey;
  groupedRecommendationKey: string;
  status: AtlasStatus;
  severity: AtlasSeverity;
  confidence: number;
  fired: boolean;
  title: string;
  message: string;
  cta: string;
  evidence: Record<string, unknown>;
  missingFields: string[];
  fingerprint: string | null;
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

function normalizeConstraintProfile(value: unknown): VenueConstraintProfile | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const profile = value as Partial<VenueConstraintProfile>;

  if (profile.schemaVersion !== 'venue_constraints_v1') {
    return null;
  }

  return profile as VenueConstraintProfile;
}

function parseCurfewHour(curfewText: string | null | undefined): number | null {
  if (!curfewText) {
    return null;
  }

  const hour = Number.parseInt(curfewText, 10);
  return Number.isFinite(hour) ? hour : null;
}

function clampConfidence(value: number): number {
  return Math.max(0, Math.min(1, Number(value.toFixed(2))));
}

function normalizePositiveNumber(value: unknown): number {
  const numeric = typeof value === 'number' ? value : Number(value);

  if (!Number.isFinite(numeric) || numeric <= 0) {
    return 0;
  }

  return numeric;
}

function estimateComfortableRange(marketedCapacity: number): { min: number; max: number } {
  if (marketedCapacity <= 0) {
    return { min: 0, max: 0 };
  }

  const max = Math.max(1, Math.round(marketedCapacity * 0.78));
  const min = Math.max(1, Math.round(max * 0.72));

  return { min, max };
}

function resolveComfortableRange(params: {
  marketedCapacity: number;
  comfortableRangeMin: unknown;
  comfortableRangeMax: unknown;
}): { min: number; max: number } {
  const comfortableMin = normalizePositiveNumber(params.comfortableRangeMin);
  const comfortableMax = normalizePositiveNumber(params.comfortableRangeMax);

  if (comfortableMin > 0 && comfortableMax > 0) {
    return { min: comfortableMin, max: comfortableMax };
  }

  return estimateComfortableRange(params.marketedCapacity);
}

function buildOutdoorPowerCurfewFingerprint(params: {
  eventId: string | null;
  venueStableId: string;
  outdoors: boolean;
  limitedPower: boolean;
  strictCurfew: boolean;
  amplifiedDenied: boolean;
  curfewHour: number | null;
}): string | null {
  if (!params.eventId) {
    return null;
  }

  return [
    params.eventId,
    params.venueStableId,
    'outdoor_power_or_curfew',
    Number(params.outdoors),
    Number(params.limitedPower),
    Number(params.strictCurfew),
    Number(params.amplifiedDenied),
    params.curfewHour ?? 'na'
  ].join(':');
}

function evaluateOutdoorPowerCurfew(params: {
  detail: AtlasVenueDetail;
  eventId: string | null;
  ceremonyOutdoors?: boolean;
  baraatOutdoors?: boolean;
}): OutdoorPowerCurfewRecommendation {
  const profile = params.detail.constraintProfile;
  const outdoors = Boolean(params.ceremonyOutdoors || params.baraatOutdoors);
  const profileLimitedPower = profile?.operational.power.limited;
  const limitedPower = profileLimitedPower === true;
  const curfewType = profile?.operational.sound.curfew.type ?? null;
  const strictCurfew = curfewType === 'strict';
  const amplifiedDenied = profile?.operational.sound.outdoorAmplifiedMusicAllowed === false;
  const parsedCurfewHour = parseCurfewHour(profile?.operational.sound.curfew.localTime ?? null);
  const fallbackCurfewHour = typeof params.detail.noiseCurfewHour === 'number' ? params.detail.noiseCurfewHour : null;
  const curfewHour = parsedCurfewHour ?? fallbackCurfewHour;

  const missingFields: string[] = [];

  if (params.ceremonyOutdoors === undefined && params.baraatOutdoors === undefined) {
    missingFields.push('event.outdoorContext');
  }

  if (profileLimitedPower === null || profileLimitedPower === undefined) {
    missingFields.push('operational.power.limited');
  }

  if (!curfewType || curfewType === 'unknown') {
    missingFields.push('operational.sound.curfew.type');
  }

  if (profile?.operational.sound.outdoorAmplifiedMusicAllowed === null || profile?.operational.sound.outdoorAmplifiedMusicAllowed === undefined) {
    missingFields.push('operational.sound.outdoorAmplifiedMusicAllowed');
  }

  const hasRiskSignal = limitedPower || strictCurfew || amplifiedDenied;
  const fired = outdoors && hasRiskSignal;

  let status: AtlasStatus = 'suppressed';
  let severity: AtlasSeverity = 'info';
  let confidenceBase = 0.5;
  let title = 'Outdoor power and curfew check looks stable';
  let message = 'No immediate outdoor production blockers detected from current venue intelligence.';
  let cta = 'Continue Planning';

  if (missingFields.length > 0 && outdoors && !hasRiskSignal) {
    status = 'needs_review';
    severity = 'warning';
    confidenceBase = 0.45;
    title = 'Confirm outdoor power and curfew details with venue';
    message = 'Outdoor moments are planned, but Atlas is missing one or more critical venue fields. Confirm power lanes and curfew before lock.';
    cta = 'Confirm with Venue';
  }

  if (fired) {
    status = 'active';
    severity = strictCurfew && limitedPower ? 'critical' : 'warning';
    confidenceBase = 0.7;

    if (strictCurfew) {
      confidenceBase += 0.15;
    }

    if (limitedPower) {
      confidenceBase += 0.1;
    }

    if (amplifiedDenied) {
      confidenceBase += 0.05;
    }

    if (missingFields.length > 0) {
      confidenceBase -= 0.15;
    }

    title = 'Outdoor Power or Curfew Risk';
    message = curfewHour
      ? `Outdoor plan intersects venue constraints. Curfew control starts around ${curfewHour}:00, and power constraints may affect baraat coverage.`
      : 'Outdoor plan intersects venue power and/or sound constraints that can impact baraat and ceremony execution.';
    cta = 'Explore Baraat Upgrades';
  }

  const confidence = clampConfidence(confidenceBase);
  const fingerprint = buildOutdoorPowerCurfewFingerprint({
    eventId: params.eventId,
    venueStableId: params.detail.venueUuid ?? params.detail.id,
    outdoors,
    limitedPower,
    strictCurfew,
    amplifiedDenied,
    curfewHour
  });

  return {
    triggerKey: 'outdoor_power_or_curfew',
    groupedRecommendationKey: 'baraat_mobile_production_fx',
    status,
    severity,
    confidence,
    fired,
    title,
    message,
    cta,
    evidence: {
      ceremonyOutdoors: params.ceremonyOutdoors ?? null,
      baraatOutdoors: params.baraatOutdoors ?? null,
      outdoors,
      limitedPower,
      strictCurfew,
      amplifiedDenied,
      curfewHour
    },
    missingFields,
    fingerprint
  };
}

async function persistOutdoorPowerCurfewEvaluation(params: {
  recommendation: OutdoorPowerCurfewRecommendation;
  detail: AtlasVenueDetail;
  eventId: string | null;
}): Promise<'persisted' | 'skipped'> {
  if (!params.eventId || !params.detail.venueUuid || !params.recommendation.fingerprint) {
    return 'skipped';
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return 'skipped';
  }

  const { error } = await supabase.from('atlas_evaluations').upsert(
    {
      event_id: params.eventId,
      venue_id: params.detail.venueUuid,
      trigger_key: params.recommendation.triggerKey,
      grouped_recommendation_key: params.recommendation.groupedRecommendationKey,
      fingerprint: params.recommendation.fingerprint,
      severity: params.recommendation.severity,
      confidence: params.recommendation.confidence,
      status: params.recommendation.status,
      evidence: params.recommendation.evidence,
      recommendation_payload: {
        title: params.recommendation.title,
        message: params.recommendation.message,
        cta: params.recommendation.cta
      },
      missing_fields: params.recommendation.missingFields,
      evaluated_by_source: 'api'
    },
    { onConflict: 'fingerprint' }
  );

  if (error) {
    return 'skipped';
  }

  return 'persisted';
}

function evaluateCapacity(venue: AtlasVenueSeed, guestCount: number): CapacityCheckResult {
  const guests = Math.max(0, Math.floor(guestCount));
  const comfortableRange = resolveComfortableRange({
    marketedCapacity: venue.marketedCapacity,
    comfortableRangeMin: venue.comfortableRangeMin,
    comfortableRangeMax: venue.comfortableRangeMax
  });

  if (guests <= comfortableRange.max) {
    return {
      venue,
      status: 'safe',
      message: `Comfortable for ${guests} guests with current assumptions.`
    };
  }

  if (guests <= Math.floor(comfortableRange.max * 1.1)) {
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
      marketedCapacity: normalizePositiveNumber(row.marketed_capacity),
      comfortableRangeMin: resolveComfortableRange({
        marketedCapacity: normalizePositiveNumber(row.marketed_capacity),
        comfortableRangeMin: row.comfortable_range_min,
        comfortableRangeMax: row.comfortable_range_max
      }).min,
      comfortableRangeMax: resolveComfortableRange({
        marketedCapacity: normalizePositiveNumber(row.marketed_capacity),
        comfortableRangeMin: row.comfortable_range_min,
        comfortableRangeMax: row.comfortable_range_max
      }).max,
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
      'venue_id, atlas_record_id, name, room_name, city, state, address, length_ft, width_ft, height_ft, marketed_capacity, comfortable_range_min, comfortable_range_max, verification_status, diagram_assets, source_links, constraint_profile'
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
    venueUuid: venueRow.venue_id as string,
    name: venueRow.name as string,
    roomName: (venueRow.room_name as string | null) ?? undefined,
    city: [venueRow.city, venueRow.state].filter(Boolean).join(', '),
    state: (venueRow.state as string | null) ?? null,
    address: (venueRow.address as string | null) ?? undefined,
    marketedCapacity: normalizePositiveNumber(venueRow.marketed_capacity),
    comfortableRangeMin: resolveComfortableRange({
      marketedCapacity: normalizePositiveNumber(venueRow.marketed_capacity),
      comfortableRangeMin: venueRow.comfortable_range_min,
      comfortableRangeMax: venueRow.comfortable_range_max
    }).min,
    comfortableRangeMax: resolveComfortableRange({
      marketedCapacity: normalizePositiveNumber(venueRow.marketed_capacity),
      comfortableRangeMin: venueRow.comfortable_range_min,
      comfortableRangeMax: venueRow.comfortable_range_max
    }).max,
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
    constraintProfile: normalizeConstraintProfile(venueRow.constraint_profile),
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

export async function runOutdoorPowerCurfewLive(
  input: OutdoorPowerCurfewInput
): Promise<{ venue: AtlasVenueSeed; recommendation: OutdoorPowerCurfewRecommendation; persistenceMode: 'persisted' | 'skipped' } | null> {
  const detail = await getAtlasVenueDetail(input.venueId);

  if (!detail) {
    return null;
  }

  const recommendation = evaluateOutdoorPowerCurfew({
    detail,
    eventId: input.eventId,
    ceremonyOutdoors: input.ceremonyOutdoors,
    baraatOutdoors: input.baraatOutdoors
  });

  const persistenceMode = await persistOutdoorPowerCurfewEvaluation({
    recommendation,
    detail,
    eventId: input.eventId
  });

  return {
    venue: detail,
    recommendation,
    persistenceMode
  };
}
