import { getSupabaseAdminClient } from '@/lib/supabase-server';
import type { AtlasSeverity, AtlasStatus, AtlasTriggerKey, VenueConstraintProfile } from '@/lib/atlas-types';
import {
  computeCapacity,
  type CapacityDanceFloorSize,
  type CapacityEventMode,
  type CapacityInput
} from '@/lib/atlas-operational-truth/capacity-math';
import {
  computeConfidence,
  computeDataSufficiency,
  countDetections,
  detectFields,
  type RequiredFieldDescriptor,
  type SufficiencyResult,
  type VenueTrustSignal
} from '@/lib/atlas-operational-truth';

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

/**
 * Every Atlas venue-feasibility trigger emits the same 12-field recommendation
 * shape. Reuse the outdoor-power-curfew shape as the canonical contract so the
 * persistence layer and consumers stay uniform across triggers.
 */
export type AtlasTriggerRecommendation = OutdoorPowerCurfewRecommendation;

export interface CapacitySqueezeInput {
  venueId: string;
  eventId: string | null;
  desiredGuests: number;
  eventMode?: CapacityEventMode;
  serviceLossPct?: number;
  sqFtPerTable?: number;
  hasDanceFloor?: boolean;
  danceFloorSize?: CapacityDanceFloorSize;
  hasDjPit?: boolean;
  hasBand?: boolean;
  hasAisleRiser?: boolean;
}

export interface TightRoomFlipInput {
  venueId: string;
  eventId: string | null;
  ceremonyToReceptionMin?: number;
}

export interface RiggingOrCeilingConstraintInput {
  venueId: string;
  eventId: string | null;
  riggingPlanned?: boolean;
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

/**
 * Map a venue detail's source-confidence tier onto the operational-truth trust
 * signal. `vendor_verified` is a vendor walking the room (highest trust);
 * `partially_verified` maps to the partner/verified source; anything else is
 * left as the default MarketingData tier (least trusted).
 */
export function toVenueTrustSignal(detail: AtlasVenueDetail): VenueTrustSignal {
  if (detail.sourceConfidence === 'vendor_verified') {
    return { venueVerification: 'vendor_verified' };
  }

  if (detail.sourceConfidence === 'partially_verified') {
    return { source: 'partially_verified' };
  }

  return {};
}

/**
 * Run the three orthogonal operational-truth layers (detection ->
 * data-sufficiency + confidence) for a venue detail against a descriptor set.
 * Returns a trust-weighted confidence in [0,1], the missing/invalid field keys,
 * and the full sufficiency breakdown so callers can fold them into a
 * recommendation.
 */
export function frameworkConfidence(
  detail: AtlasVenueDetail,
  descriptors: RequiredFieldDescriptor[]
): { confidence01: number; missingFields: string[]; sufficiency: SufficiencyResult } {
  const trust = toVenueTrustSignal(detail);
  const detection = detectFields(descriptors, trust);
  const counts = countDetections(detection.fields);
  const confidence = computeConfidence({ ...trust, counts });
  const sufficiency = computeDataSufficiency(detection.fields);

  const missingFields = detection.fields
    .filter((field) => field.status === 'MISSING' || field.status === 'INVALID')
    .map((field) => field.key);

  return {
    confidence01: clampConfidence(confidence.score / 100),
    missingFields,
    sufficiency
  };
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

/**
 * Generalized persistence for any Atlas trigger evaluation. Gates on
 * eventId/venueUuid/fingerprint, then upserts onto the `fingerprint` conflict
 * target. Confidence is already in [0,1] (clampConfidence rounds/clamps for the
 * numeric(5,4) column).
 */
async function persistAtlasEvaluation(params: {
  recommendation: AtlasTriggerRecommendation;
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

async function persistOutdoorPowerCurfewEvaluation(params: {
  recommendation: OutdoorPowerCurfewRecommendation;
  detail: AtlasVenueDetail;
  eventId: string | null;
}): Promise<'persisted' | 'skipped'> {
  return persistAtlasEvaluation(params);
}

// Legacy `evaluateCapacity` (onboarding quick-check, comfortable-range based) and the new
// `capacity_squeeze` evaluator (dimension-driven operational-truth) intentionally coexist for different surfaces.
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

const isPositiveNumber = (value: unknown): boolean => typeof value === 'number' && Number.isFinite(value) && value > 0;

// =============================================================================
// capacity_squeeze — dimension-driven operational-truth seating check.
// =============================================================================

function buildCapacitySqueezeDescriptors(detail: AtlasVenueDetail): RequiredFieldDescriptor[] {
  return [
    {
      key: 'venue.lengthFt',
      category: 'Physical',
      pillar: 'SpatialCapacity',
      operationallyMaterial: true,
      value: detail.lengthFt,
      validate: isPositiveNumber
    },
    {
      key: 'venue.widthFt',
      category: 'Physical',
      pillar: 'SpatialCapacity',
      operationallyMaterial: true,
      value: detail.widthFt,
      validate: isPositiveNumber
    },
    {
      key: 'operational.capacity.comfortableAcousticMax',
      category: 'Operational',
      pillar: 'SpatialCapacity',
      operationallyMaterial: false,
      value: detail.constraintProfile?.operational.capacity.comfortableAcousticMax ?? null
    }
  ];
}

function buildCapacitySqueezeFingerprint(params: {
  eventId: string | null;
  venueStableId: string;
  desiredGuests: number;
  eventMode: CapacityEventMode;
  maxCapacity: number;
  capacityStatus: string;
}): string | null {
  if (!params.eventId) {
    return null;
  }

  return [
    params.eventId,
    params.venueStableId,
    'capacity_squeeze',
    params.eventMode,
    params.desiredGuests,
    params.maxCapacity,
    params.capacityStatus
  ].join(':');
}

export function evaluateCapacitySqueeze(params: {
  detail: AtlasVenueDetail;
  eventId: string | null;
  desiredGuests: number;
  eventMode?: CapacityEventMode;
  serviceLossPct?: number;
  sqFtPerTable?: number;
  hasDanceFloor?: boolean;
  danceFloorSize?: CapacityDanceFloorSize;
  hasDjPit?: boolean;
  hasBand?: boolean;
  hasAisleRiser?: boolean;
}): AtlasTriggerRecommendation {
  const desiredGuests = params.desiredGuests;
  const eventMode: CapacityEventMode = params.eventMode ?? 'reception';
  const serviceLossPct = params.serviceLossPct ?? 15;
  const sqFtPerTable = params.sqFtPerTable ?? 72;
  const hasDanceFloor = params.hasDanceFloor ?? true;
  const danceFloorSize: CapacityDanceFloorSize = params.danceFloorSize ?? 'medium';
  const hasDjPit = params.hasDjPit ?? false;
  const hasBand = params.hasBand ?? false;
  const hasAisleRiser = params.hasAisleRiser ?? false;

  const hasDimensions = isPositiveNumber(params.detail.lengthFt) && isPositiveNumber(params.detail.widthFt);

  const framework = frameworkConfidence(params.detail, buildCapacitySqueezeDescriptors(params.detail));
  const missingFields = [...framework.missingFields];

  const capacityInput: CapacityInput = {
    lengthFt: params.detail.lengthFt ?? 0,
    widthFt: params.detail.widthFt ?? 0,
    serviceLossPct,
    eventMode,
    hasDanceFloor,
    danceFloorSize,
    hasDjPit,
    hasBand,
    hasAisleRiser,
    sqFtPerTable,
    desiredGuests: hasDimensions ? desiredGuests : null
  };

  const capacity = computeCapacity(capacityInput);
  const capacityStatus = capacity.status;

  let status: AtlasStatus = 'suppressed';
  let severity: AtlasSeverity = 'info';
  let fired = false;
  let title = 'Capacity check looks stable';
  let message = `Room comfortably seats up to ${capacity.maxCapacity} guests against the planned ${desiredGuests}.`;
  let cta = 'Continue Planning';
  let confidence01 = framework.confidence01;

  if (!hasDimensions) {
    status = 'needs_review';
    severity = 'warning';
    fired = false;
    title = 'Confirm room dimensions to run a capacity check';
    message = 'Atlas needs verified room length and width to model seated capacity. Confirm dimensions with the venue before lock.';
    cta = 'Confirm with Venue';
    confidence01 = clampConfidence(confidence01 - 0.05);

    if (!missingFields.includes('venue.lengthFt')) {
      missingFields.push('venue.lengthFt');
    }
    if (!missingFields.includes('venue.widthFt')) {
      missingFields.push('venue.widthFt');
    }

    return finalizeCapacitySqueeze();
  }

  fired = desiredGuests > 0 && (capacityStatus === 'tight' || capacityStatus === 'unsafe');

  if (fired) {
    status = 'active';
    severity = capacityStatus === 'unsafe' ? 'critical' : 'warning';
    confidence01 = clampConfidence(confidence01 + (capacityStatus === 'unsafe' ? 0.1 : 0.05));
    title = capacityStatus === 'unsafe' ? 'Capacity Risk: Plan Exceeds Room' : 'Capacity Squeeze: Room Runs Tight';
    message =
      capacityStatus === 'unsafe'
        ? `This room models a max of ${capacity.maxCapacity} seated guests, below the planned ${desiredGuests}. Revisit layout, production load, or guest count before locking.`
        : `This room models a max of ${capacity.maxCapacity} seated guests against the planned ${desiredGuests}. It is possible but tight — review layout and guest flow.`;
    cta = 'Explore Capacity Optimization';
  }

  return finalizeCapacitySqueeze();

  function finalizeCapacitySqueeze(): AtlasTriggerRecommendation {
    if (capacity.isDanceClamped) {
      message += ' Note: the dance floor was clamped to fit the room, which limited the requested footprint.';
    }

    const fingerprint = buildCapacitySqueezeFingerprint({
      eventId: params.eventId,
      venueStableId: params.detail.venueUuid ?? params.detail.id,
      desiredGuests,
      eventMode,
      maxCapacity: capacity.maxCapacity,
      capacityStatus
    });

    return {
      triggerKey: 'capacity_squeeze',
      groupedRecommendationKey: 'capacity_optimization',
      status,
      severity,
      confidence: clampConfidence(confidence01),
      fired,
      title,
      message,
      cta,
      evidence: {
        desiredGuests,
        eventMode,
        totalArea: capacity.totalArea,
        serviceLossArea: capacity.serviceLossArea,
        usableArea: capacity.usableArea,
        danceArea: capacity.danceArea,
        isDanceClamped: capacity.isDanceClamped,
        productionDeductions: capacity.productionDeductions,
        seatingArea: capacity.seatingArea,
        maxTables: capacity.maxTables,
        maxCapacity: capacity.maxCapacity,
        capacityStatus
      },
      missingFields,
      fingerprint
    };
  }
}

// =============================================================================
// tight_room_flip — ceremony->reception turnaround vs. room-flip time.
// =============================================================================

function buildTightRoomFlipDescriptors(detail: AtlasVenueDetail): RequiredFieldDescriptor[] {
  const timeline = detail.constraintProfile?.operational.timeline;

  return [
    {
      key: 'operational.timeline.roomFlipMin',
      category: 'Operational',
      pillar: 'LoadInLogistics',
      operationallyMaterial: true,
      value: timeline?.roomFlipMin ?? null,
      validate: isPositiveNumber
    },
    {
      key: 'operational.timeline.ceremonyToReceptionMin',
      category: 'Operational',
      pillar: 'LoadInLogistics',
      operationallyMaterial: true,
      value: timeline?.ceremonyToReceptionMin ?? null,
      validate: isPositiveNumber
    },
    {
      key: 'operational.timeline.preSetSupported',
      category: 'Operational',
      pillar: 'LoadInLogistics',
      operationallyMaterial: false,
      value: timeline?.preSetSupported ?? null
    }
  ];
}

function buildTightRoomFlipFingerprint(params: {
  eventId: string | null;
  venueStableId: string;
  ceremonyToReceptionMin: number | null;
  roomFlipMin: number | null;
  preSetSupported: boolean | null;
}): string | null {
  if (!params.eventId) {
    return null;
  }

  return [
    params.eventId,
    params.venueStableId,
    'tight_room_flip',
    params.ceremonyToReceptionMin ?? 'na',
    params.roomFlipMin ?? 'na',
    params.preSetSupported === null ? 'na' : Number(params.preSetSupported)
  ].join(':');
}

export function evaluateTightRoomFlip(params: {
  detail: AtlasVenueDetail;
  eventId: string | null;
  ceremonyToReceptionMin?: number;
}): AtlasTriggerRecommendation {
  const timeline = params.detail.constraintProfile?.operational.timeline;
  const roomFlipMin = timeline?.roomFlipMin ?? null;
  const ceremonyToReceptionMin = timeline?.ceremonyToReceptionMin ?? params.ceremonyToReceptionMin ?? null;
  const preSetSupported = timeline?.preSetSupported ?? null;

  const framework = frameworkConfidence(params.detail, buildTightRoomFlipDescriptors(params.detail));
  const missingFields = [...framework.missingFields];

  // The driver fields are the flip time and the available turnaround window. If one is
  // present but the other is missing, we cannot decide — surface needs_review instead.
  const driverMissing =
    (ceremonyToReceptionMin === null) !== (roomFlipMin === null);

  let status: AtlasStatus = 'suppressed';
  let severity: AtlasSeverity = 'info';
  let fired = false;
  let title = 'Room flip timeline looks workable';
  let message = 'No room-flip turnaround risk detected from current venue intelligence.';
  let cta = 'Continue Planning';
  let confidence01 = framework.confidence01;

  if (driverMissing) {
    status = 'needs_review';
    severity = 'warning';
    confidence01 = clampConfidence(confidence01 - 0.05);
    title = 'Confirm room flip timing with venue';
    message =
      'Atlas has only part of the turnaround picture. Confirm both the room-flip time and the ceremony-to-reception window before lock.';
    cta = 'Confirm with Venue';
  } else {
    fired =
      ceremonyToReceptionMin !== null &&
      roomFlipMin !== null &&
      ceremonyToReceptionMin < roomFlipMin &&
      preSetSupported !== true;

    if (fired && ceremonyToReceptionMin !== null && roomFlipMin !== null) {
      const critical = ceremonyToReceptionMin < 0.5 * roomFlipMin || preSetSupported === false;
      status = 'active';
      severity = critical ? 'critical' : 'warning';
      confidence01 = clampConfidence(confidence01 + (critical ? 0.1 : 0.05));
      title = 'Tight Room Flip Risk';
      message = `The ${ceremonyToReceptionMin}-minute ceremony-to-reception window is shorter than the venue's ${roomFlipMin}-minute room-flip time. Plan a mitigation (pre-set, second space, or extended cocktail hour).`;
      cta = 'Explore Flip Mitigations';
    }
  }

  const fingerprint = buildTightRoomFlipFingerprint({
    eventId: params.eventId,
    venueStableId: params.detail.venueUuid ?? params.detail.id,
    ceremonyToReceptionMin,
    roomFlipMin,
    preSetSupported
  });

  return {
    triggerKey: 'tight_room_flip',
    groupedRecommendationKey: 'timeline_flip_mitigation',
    status,
    severity,
    confidence: clampConfidence(confidence01),
    fired,
    title,
    message,
    cta,
    evidence: {
      ceremonyToReceptionMin,
      roomFlipMin,
      preSetSupported
    },
    missingFields,
    fingerprint
  };
}

// =============================================================================
// rigging_or_ceiling_constraint — rigging policy and low-ceiling clearance.
// =============================================================================

const DEFAULT_LOW_CEILING_THRESHOLD_FT = 14;

function buildRiggingOrCeilingDescriptors(detail: AtlasVenueDetail): RequiredFieldDescriptor[] {
  const rigging = detail.constraintProfile?.operational.rigging;
  const ceiling = detail.constraintProfile?.operational.ceiling;
  const effectiveCeiling = ceiling?.clearanceFt ?? detail.heightFt ?? null;

  return [
    {
      key: 'operational.rigging.allowed',
      category: 'Policy',
      pillar: 'RiggingHeight',
      operationallyMaterial: false,
      value: rigging?.allowed ?? null
    },
    {
      key: 'operational.ceiling.clearanceFt',
      category: 'Physical',
      pillar: 'RiggingHeight',
      operationallyMaterial: true,
      value: effectiveCeiling,
      validate: isPositiveNumber
    }
  ];
}

function buildRiggingOrCeilingFingerprint(params: {
  eventId: string | null;
  venueStableId: string;
  riggingAllowed: boolean | null;
  effectiveCeiling: number | null;
  lowCeilingThresholdFt: number;
}): string | null {
  if (!params.eventId) {
    return null;
  }

  return [
    params.eventId,
    params.venueStableId,
    'rigging_or_ceiling_constraint',
    params.riggingAllowed === null ? 'na' : Number(params.riggingAllowed),
    params.effectiveCeiling ?? 'na',
    params.lowCeilingThresholdFt
  ].join(':');
}

export function evaluateRiggingOrCeilingConstraint(params: {
  detail: AtlasVenueDetail;
  eventId: string | null;
  riggingPlanned?: boolean;
}): AtlasTriggerRecommendation {
  const rigging = params.detail.constraintProfile?.operational.rigging;
  const ceiling = params.detail.constraintProfile?.operational.ceiling;
  const riggingAllowed = rigging?.allowed ?? null;
  const lowCeilingThresholdFt = ceiling?.lowCeilingThresholdFt ?? DEFAULT_LOW_CEILING_THRESHOLD_FT;
  const effectiveCeiling = ceiling?.clearanceFt ?? params.detail.heightFt ?? null;

  const framework = frameworkConfidence(params.detail, buildRiggingOrCeilingDescriptors(params.detail));
  const missingFields = [...framework.missingFields];

  // Soft gate: only suppress when rigging is explicitly NOT planned.
  const riggingRelevant = params.riggingPlanned !== false;

  // Missing both clearance signals (no profile clearance, no heightFt) AND no rigging policy
  // leaves nothing to evaluate -> needs_review.
  const noClearanceSignal = effectiveCeiling === null;
  const noRiggingSignal = riggingAllowed === null;

  let status: AtlasStatus = 'suppressed';
  let severity: AtlasSeverity = 'info';
  let fired = false;
  let title = 'Rigging and ceiling clearance look workable';
  let message = 'No rigging policy or low-ceiling clearance risk detected from current venue intelligence.';
  let cta = 'Continue Planning';
  let confidence01 = framework.confidence01;

  if (noClearanceSignal && noRiggingSignal) {
    status = 'needs_review';
    severity = 'warning';
    confidence01 = clampConfidence(confidence01 - 0.05);
    title = 'Confirm rigging policy and ceiling clearance';
    message =
      'Atlas is missing both ceiling clearance and rigging policy for this room. Confirm with the venue before planning hung production elements.';
    cta = 'Confirm with Venue';
  } else if (riggingRelevant) {
    const lowCeiling = effectiveCeiling !== null && effectiveCeiling < lowCeilingThresholdFt;
    fired = riggingAllowed === false || lowCeiling;

    if (fired) {
      const critical = riggingAllowed === false || (effectiveCeiling !== null && effectiveCeiling < lowCeilingThresholdFt - 2);
      status = 'active';
      severity = critical ? 'critical' : 'warning';
      confidence01 = clampConfidence(confidence01 + (critical ? 0.1 : 0.05));
      title = riggingAllowed === false ? 'Rigging Not Permitted' : 'Low Ceiling Clearance';
      message =
        riggingAllowed === false
          ? 'This venue does not permit rigging. Plan ground-supported production (towers, uplighting) instead of hung elements.'
          : `Ceiling clearance of ${effectiveCeiling} ft is below the ${lowCeilingThresholdFt} ft low-ceiling threshold. Reconsider hung lighting, drape height, and tall production elements.`;
      cta = 'Explore Rigging & Ceiling Mitigations';
    }
  }

  const fingerprint = buildRiggingOrCeilingFingerprint({
    eventId: params.eventId,
    venueStableId: params.detail.venueUuid ?? params.detail.id,
    riggingAllowed,
    effectiveCeiling,
    lowCeilingThresholdFt
  });

  return {
    triggerKey: 'rigging_or_ceiling_constraint',
    groupedRecommendationKey: 'rigging_ceiling_mitigation',
    status,
    severity,
    confidence: clampConfidence(confidence01),
    fired,
    title,
    message,
    cta,
    evidence: {
      riggingPlanned: params.riggingPlanned ?? null,
      riggingAllowed,
      maxClearanceFt: rigging?.maxClearanceFt ?? null,
      ceilingClearanceFt: ceiling?.clearanceFt ?? null,
      heightFt: params.detail.heightFt ?? null,
      effectiveCeiling,
      lowCeilingThresholdFt
    },
    missingFields,
    fingerprint
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

export async function runCapacitySqueezeLive(
  input: CapacitySqueezeInput
): Promise<{ venue: AtlasVenueSeed; recommendation: AtlasTriggerRecommendation; persistenceMode: 'persisted' | 'skipped' } | null> {
  const detail = await getAtlasVenueDetail(input.venueId);

  if (!detail) {
    return null;
  }

  const recommendation = evaluateCapacitySqueeze({
    detail,
    eventId: input.eventId,
    desiredGuests: input.desiredGuests,
    eventMode: input.eventMode,
    serviceLossPct: input.serviceLossPct,
    sqFtPerTable: input.sqFtPerTable,
    hasDanceFloor: input.hasDanceFloor,
    danceFloorSize: input.danceFloorSize,
    hasDjPit: input.hasDjPit,
    hasBand: input.hasBand,
    hasAisleRiser: input.hasAisleRiser
  });

  const persistenceMode = await persistAtlasEvaluation({
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

export async function runTightRoomFlipLive(
  input: TightRoomFlipInput
): Promise<{ venue: AtlasVenueSeed; recommendation: AtlasTriggerRecommendation; persistenceMode: 'persisted' | 'skipped' } | null> {
  const detail = await getAtlasVenueDetail(input.venueId);

  if (!detail) {
    return null;
  }

  const recommendation = evaluateTightRoomFlip({
    detail,
    eventId: input.eventId,
    ceremonyToReceptionMin: input.ceremonyToReceptionMin
  });

  const persistenceMode = await persistAtlasEvaluation({
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

export async function runRiggingOrCeilingConstraintLive(
  input: RiggingOrCeilingConstraintInput
): Promise<{ venue: AtlasVenueSeed; recommendation: AtlasTriggerRecommendation; persistenceMode: 'persisted' | 'skipped' } | null> {
  const detail = await getAtlasVenueDetail(input.venueId);

  if (!detail) {
    return null;
  }

  const recommendation = evaluateRiggingOrCeilingConstraint({
    detail,
    eventId: input.eventId,
    riggingPlanned: input.riggingPlanned
  });

  const persistenceMode = await persistAtlasEvaluation({
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

export interface VenueFeasibilityInput {
  venueId: string;
  eventId: string | null;
  desiredGuests: number;
  eventMode?: CapacityEventMode;
}

export interface VenueFeasibilityResult {
  venue: AtlasVenueSeed;
  atlasOutdoorPowerCurfew: OutdoorPowerCurfewRecommendation;
  recommendations: AtlasTriggerRecommendation[];
  atlasEvaluationPersistenceMode: 'persisted' | 'skipped';
}

// Invocation seam: runs the full venue-feasibility trigger set (outdoor power/curfew + the three
// operational-truth triggers) in a single detail load, persisting each evaluation when an event
// context is present. This is what turns the dormant evaluators into live recommendations on the
// venue-check surface.
export async function runVenueFeasibilityLive(input: VenueFeasibilityInput): Promise<VenueFeasibilityResult | null> {
  const detail = await getAtlasVenueDetail(input.venueId);

  if (!detail) {
    return null;
  }

  const atlasOutdoorPowerCurfew = evaluateOutdoorPowerCurfew({ detail, eventId: input.eventId });
  const capacitySqueeze = evaluateCapacitySqueeze({
    detail,
    eventId: input.eventId,
    desiredGuests: input.desiredGuests,
    eventMode: input.eventMode
  });
  const tightRoomFlip = evaluateTightRoomFlip({ detail, eventId: input.eventId });
  const riggingOrCeiling = evaluateRiggingOrCeilingConstraint({ detail, eventId: input.eventId });

  const recommendations = [capacitySqueeze, tightRoomFlip, riggingOrCeiling];

  const persistenceModes = await Promise.all(
    [atlasOutdoorPowerCurfew, ...recommendations].map((recommendation) =>
      persistAtlasEvaluation({ recommendation, detail, eventId: input.eventId })
    )
  );

  return {
    venue: detail,
    atlasOutdoorPowerCurfew,
    recommendations,
    atlasEvaluationPersistenceMode: persistenceModes.includes('persisted') ? 'persisted' : 'skipped'
  };
}
