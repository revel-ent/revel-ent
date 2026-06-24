import { describe, expect, it } from 'vitest';

import {
  evaluateCapacitySqueeze,
  evaluateRiggingOrCeilingConstraint,
  evaluateTightRoomFlip,
  frameworkConfidence,
  runCapacitySqueezeLive,
  runRiggingOrCeilingConstraintLive,
  runTightRoomFlipLive,
  runVenueFeasibilityLive,
  toVenueTrustSignal,
  type AtlasVenueDetail
} from '@/lib/atlas-venues';
import type { VenueConstraintProfile } from '@/lib/atlas-types';

/**
 * Pure unit tests for the three Atlas venue-feasibility trigger evaluators and
 * their shared adapter (toVenueTrustSignal / frameworkConfidence). No Supabase:
 * getSupabaseAdminClient returns null in the test env, so run*Live exercises the
 * fallback-detail + skipped-persistence path with a real venue id.
 */

type ConstraintProfileOverrides = {
  power?: Partial<VenueConstraintProfile['operational']['power']>;
  sound?: Partial<VenueConstraintProfile['operational']['sound']>;
  capacity?: Partial<VenueConstraintProfile['operational']['capacity']>;
  timeline?: Partial<VenueConstraintProfile['operational']['timeline']>;
  rigging?: Partial<VenueConstraintProfile['operational']['rigging']>;
  ceiling?: Partial<VenueConstraintProfile['operational']['ceiling']>;
  outdoor?: Partial<VenueConstraintProfile['operational']['outdoor']>;
};

function profile(overrides: ConstraintProfileOverrides = {}): VenueConstraintProfile {
  return {
    schemaVersion: 'venue_constraints_v1',
    operational: {
      power: { limited: null, dedicatedDjCircuit: null, generatorOnly: null, outdoorAvailability: 'unknown', notes: [], ...overrides.power },
      sound: {
        curfew: { type: 'unknown', localTime: null, timezone: null },
        outdoorAmplifiedMusicAllowed: null,
        maxDb: null,
        notes: [],
        ...overrides.sound
      },
      capacity: { marketed: null, comfortableAcousticMax: null, overflowRecommendedAbove: null, notes: [], ...overrides.capacity },
      timeline: { roomFlipMin: null, ceremonyToReceptionMin: null, preSetSupported: null, notes: [], ...overrides.timeline },
      rigging: { allowed: null, maxClearanceFt: null, notes: [], ...overrides.rigging },
      ceiling: { clearanceFt: null, lowCeilingThresholdFt: 14, notes: [], ...overrides.ceiling },
      outdoor: { ceremonyAllowed: null, baraatAllowed: null, baraatRouteNotes: null, weatherFallbackAvailable: null, notes: [], ...overrides.outdoor }
    },
    confidence: {
      overall: 'venue_doc',
      fields: {
        power: 'venue_doc',
        sound: 'venue_doc',
        capacity: 'venue_doc',
        timeline: 'venue_doc',
        rigging: 'venue_doc',
        ceiling: 'venue_doc',
        outdoor: 'venue_doc'
      }
    },
    provenance: { sourceLinks: [], reviewedBy: null, reviewedOn: null, lastEvaluatedAt: null },
    derived: { activeTriggerKeys: [], fingerprint: null }
  };
}

function venue(overrides: Partial<AtlasVenueDetail> = {}): AtlasVenueDetail {
  return {
    id: 'test-venue',
    name: 'Test Venue',
    city: 'Atlanta, GA',
    marketedCapacity: 400,
    comfortableRangeMin: 240,
    comfortableRangeMax: 320,
    notes: [],
    constraintsSummary: '',
    sourceConfidence: 'vendor_verified',
    venueUuid: 'venue-uuid-1',
    constraints: [],
    constraintProfile: profile(),
    ...overrides
  };
}

const EVENT_ID = 'event-1';

// 80x50 ballroom, 15% loss, medium dance floor + dj pit + band, 72 sqFt/table -> maxCapacity 320.
const SIZED_RECEPTION = {
  desiredGuests: 0,
  eventMode: 'reception' as const,
  serviceLossPct: 15,
  sqFtPerTable: 72,
  hasDanceFloor: true,
  danceFloorSize: 'medium' as const,
  hasDjPit: true,
  hasBand: true,
  hasAisleRiser: false
};

function sizedVenue(overrides: Partial<AtlasVenueDetail> = {}): AtlasVenueDetail {
  return venue({ lengthFt: 80, widthFt: 50, ...overrides });
}

describe('toVenueTrustSignal', () => {
  it('maps vendor_verified to venueVerification', () => {
    expect(toVenueTrustSignal(venue({ sourceConfidence: 'vendor_verified' }))).toEqual({ venueVerification: 'vendor_verified' });
  });

  it('maps partially_verified to source', () => {
    expect(toVenueTrustSignal(venue({ sourceConfidence: 'partially_verified' }))).toEqual({ source: 'partially_verified' });
  });

  it('maps unverified to an empty (MarketingData) signal', () => {
    expect(toVenueTrustSignal(venue({ sourceConfidence: 'unverified' }))).toEqual({});
  });
});

describe('frameworkConfidence', () => {
  it('returns a confidence in [0,1] and surfaces missing/invalid keys', () => {
    const result = frameworkConfidence(venue({ lengthFt: 80, widthFt: undefined }), [
      { key: 'venue.lengthFt', category: 'Physical', pillar: 'SpatialCapacity', operationallyMaterial: true, value: 80, validate: (v) => typeof v === 'number' && v > 0 },
      { key: 'venue.widthFt', category: 'Physical', pillar: 'SpatialCapacity', operationallyMaterial: true, value: undefined, validate: (v) => typeof v === 'number' && v > 0 }
    ]);

    expect(result.confidence01).toBeGreaterThanOrEqual(0);
    expect(result.confidence01).toBeLessThanOrEqual(1);
    expect(result.missingFields).toContain('venue.widthFt');
    expect(result.missingFields).not.toContain('venue.lengthFt');
  });
});

describe('evaluateCapacitySqueeze', () => {
  it('is safe (suppressed, not fired) when capacity exceeds desired guests', () => {
    const rec = evaluateCapacitySqueeze({ detail: sizedVenue(), eventId: EVENT_ID, ...SIZED_RECEPTION, desiredGuests: 300 });

    expect(rec.triggerKey).toBe('capacity_squeeze');
    expect(rec.groupedRecommendationKey).toBe('capacity_optimization');
    expect(rec.evidence.capacityStatus).toBe('safe');
    expect(rec.evidence.maxCapacity).toBe(320);
    expect(rec.fired).toBe(false);
    expect(rec.status).toBe('suppressed');
    expect(rec.confidence).toBeGreaterThanOrEqual(0);
    expect(rec.confidence).toBeLessThanOrEqual(1);
    expect(rec.fingerprint).toContain('capacity_squeeze');
  });

  it('fires as a warning when tight (desired within 90% of capacity)', () => {
    // capacity 320, desired 340 -> 0.9*340 = 306; 320 >= 306 -> tight.
    const rec = evaluateCapacitySqueeze({ detail: sizedVenue(), eventId: EVENT_ID, ...SIZED_RECEPTION, desiredGuests: 340 });

    expect(rec.evidence.capacityStatus).toBe('tight');
    expect(rec.fired).toBe(true);
    expect(rec.status).toBe('active');
    expect(rec.severity).toBe('warning');
    expect(rec.message).toContain('320');
    expect(rec.message).toContain('340');
  });

  it('fires as tight at exactly the 0.9 capacity boundary (inclusive)', () => {
    // 10x9 reception, no production, sqFt/table floored to 10 -> usable 90, cap 90.
    // desired 100 -> 0.9*100 = 90; 90 >= 90 -> tight (not unsafe).
    const rec = evaluateCapacitySqueeze({
      detail: venue({ lengthFt: 10, widthFt: 9 }),
      eventId: EVENT_ID,
      desiredGuests: 100,
      serviceLossPct: 0,
      sqFtPerTable: 10,
      hasDanceFloor: false,
      hasDjPit: false,
      hasBand: false
    });

    expect(rec.evidence.maxCapacity).toBe(90);
    expect(rec.evidence.capacityStatus).toBe('tight');
    expect(rec.severity).toBe('warning');
    expect(rec.fired).toBe(true);
  });

  it('fires as critical when unsafe (capacity far below desired)', () => {
    // capacity 320, desired 400 -> 0.9*400 = 360; 320 < 360 -> unsafe.
    const rec = evaluateCapacitySqueeze({ detail: sizedVenue(), eventId: EVENT_ID, ...SIZED_RECEPTION, desiredGuests: 400 });

    expect(rec.evidence.capacityStatus).toBe('unsafe');
    expect(rec.fired).toBe(true);
    expect(rec.status).toBe('active');
    expect(rec.severity).toBe('critical');
  });

  it('does not fire (neutral) when desiredGuests is zero', () => {
    const rec = evaluateCapacitySqueeze({ detail: sizedVenue(), eventId: EVENT_ID, ...SIZED_RECEPTION, desiredGuests: 0 });

    expect(rec.evidence.capacityStatus).toBe('neutral');
    expect(rec.fired).toBe(false);
    expect(rec.status).toBe('suppressed');
  });

  it('returns needs_review (not fired) and flags dimensions when length/width missing', () => {
    const rec = evaluateCapacitySqueeze({ detail: venue({ lengthFt: undefined, widthFt: undefined }), eventId: EVENT_ID, desiredGuests: 300 });

    expect(rec.fired).toBe(false);
    expect(rec.status).toBe('needs_review');
    expect(rec.evidence.capacityStatus).toBe('neutral');
    expect(rec.missingFields).toContain('venue.lengthFt');
    expect(rec.missingFields).toContain('venue.widthFt');
  });

  it('appends a dance-clamp note when the dance floor is clamped', () => {
    // 50x20 room, large dance floor 900 clamped to 200 -> isDanceClamped true.
    const rec = evaluateCapacitySqueeze({
      detail: venue({ lengthFt: 50, widthFt: 20 }),
      eventId: EVENT_ID,
      desiredGuests: 50,
      serviceLossPct: 0,
      hasDanceFloor: true,
      danceFloorSize: 'large',
      sqFtPerTable: 50
    });

    expect(rec.evidence.isDanceClamped).toBe(true);
    expect(rec.message).toContain('clamped');
  });

  it('produces a null fingerprint when eventId is null', () => {
    const rec = evaluateCapacitySqueeze({ detail: sizedVenue(), eventId: null, ...SIZED_RECEPTION, desiredGuests: 340 });
    expect(rec.fingerprint).toBeNull();
  });
});

describe('evaluateTightRoomFlip', () => {
  it('fires as a warning when the turnaround window is shorter than the flip time', () => {
    const rec = evaluateTightRoomFlip({
      detail: venue({ constraintProfile: profile({ timeline: { roomFlipMin: 60, ceremonyToReceptionMin: 45, preSetSupported: false } }) }),
      eventId: EVENT_ID
    });

    expect(rec.triggerKey).toBe('tight_room_flip');
    expect(rec.groupedRecommendationKey).toBe('timeline_flip_mitigation');
    expect(rec.fired).toBe(true);
    expect(rec.status).toBe('active');
    // preSetSupported === false -> critical
    expect(rec.severity).toBe('critical');
  });

  it('fires as a warning (not critical) when window is above half the flip time and preSet is not declined', () => {
    // 50 < 60 fires; 50 >= 0.5*60 (30) and preSetSupported null -> warning.
    const rec = evaluateTightRoomFlip({
      detail: venue({ constraintProfile: profile({ timeline: { roomFlipMin: 60, ceremonyToReceptionMin: 50, preSetSupported: null } }) }),
      eventId: EVENT_ID
    });

    expect(rec.fired).toBe(true);
    expect(rec.severity).toBe('warning');
  });

  it('fires as critical when the window is below half the flip time', () => {
    // 25 < 0.5*60 (30) -> critical.
    const rec = evaluateTightRoomFlip({
      detail: venue({ constraintProfile: profile({ timeline: { roomFlipMin: 60, ceremonyToReceptionMin: 25, preSetSupported: null } }) }),
      eventId: EVENT_ID
    });

    expect(rec.fired).toBe(true);
    expect(rec.severity).toBe('critical');
  });

  it('does not fire when pre-set is supported even if window is shorter than flip time', () => {
    const rec = evaluateTightRoomFlip({
      detail: venue({ constraintProfile: profile({ timeline: { roomFlipMin: 60, ceremonyToReceptionMin: 45, preSetSupported: true } }) }),
      eventId: EVENT_ID
    });

    expect(rec.fired).toBe(false);
    expect(rec.status).toBe('suppressed');
  });

  it('uses the input ceremonyToReceptionMin fallback when the profile lacks it', () => {
    const rec = evaluateTightRoomFlip({
      detail: venue({ constraintProfile: profile({ timeline: { roomFlipMin: 60, ceremonyToReceptionMin: null, preSetSupported: false } }) }),
      eventId: EVENT_ID,
      ceremonyToReceptionMin: 45
    });

    expect(rec.evidence.ceremonyToReceptionMin).toBe(45);
    expect(rec.fired).toBe(true);
  });

  it('returns needs_review when one driver is present but the other is missing', () => {
    // roomFlipMin present, ceremonyToReceptionMin missing (no input fallback) -> needs_review.
    const rec = evaluateTightRoomFlip({
      detail: venue({ constraintProfile: profile({ timeline: { roomFlipMin: 60, ceremonyToReceptionMin: null, preSetSupported: null } }) }),
      eventId: EVENT_ID
    });

    expect(rec.fired).toBe(false);
    expect(rec.status).toBe('needs_review');
    expect(rec.severity).toBe('warning');
  });
});

describe('evaluateRiggingOrCeilingConstraint', () => {
  it('fires as critical when rigging is explicitly not allowed', () => {
    const rec = evaluateRiggingOrCeilingConstraint({
      detail: venue({ constraintProfile: profile({ rigging: { allowed: false, maxClearanceFt: null }, ceiling: { clearanceFt: 20, lowCeilingThresholdFt: 14 } }) }),
      eventId: EVENT_ID
    });

    expect(rec.triggerKey).toBe('rigging_or_ceiling_constraint');
    expect(rec.groupedRecommendationKey).toBe('rigging_ceiling_mitigation');
    expect(rec.fired).toBe(true);
    expect(rec.status).toBe('active');
    expect(rec.severity).toBe('critical');
  });

  it('fires on a low ceiling below the threshold (warning within 2ft of threshold)', () => {
    // clearance 13, threshold 14: 13 < 14 fires; 13 >= 14-2 (12) -> warning.
    const rec = evaluateRiggingOrCeilingConstraint({
      detail: venue({ constraintProfile: profile({ rigging: { allowed: true, maxClearanceFt: null }, ceiling: { clearanceFt: 13, lowCeilingThresholdFt: 14 } }) }),
      eventId: EVENT_ID
    });

    expect(rec.fired).toBe(true);
    expect(rec.severity).toBe('warning');
    expect(rec.evidence.effectiveCeiling).toBe(13);
  });

  it('fires as critical on a very low ceiling more than 2ft below threshold', () => {
    // clearance 11, threshold 14: 11 < 12 -> critical.
    const rec = evaluateRiggingOrCeilingConstraint({
      detail: venue({ constraintProfile: profile({ rigging: { allowed: true, maxClearanceFt: null }, ceiling: { clearanceFt: 11, lowCeilingThresholdFt: 14 } }) }),
      eventId: EVENT_ID
    });

    expect(rec.fired).toBe(true);
    expect(rec.severity).toBe('critical');
  });

  it('falls back to detail.heightFt when profile ceiling clearance is absent', () => {
    // no ceiling.clearanceFt; heightFt 12 < threshold 14 -> fires on the fallback.
    const rec = evaluateRiggingOrCeilingConstraint({
      detail: venue({ heightFt: 12, constraintProfile: profile({ rigging: { allowed: true, maxClearanceFt: null }, ceiling: { clearanceFt: null, lowCeilingThresholdFt: 14 } }) }),
      eventId: EVENT_ID
    });

    expect(rec.evidence.effectiveCeiling).toBe(12);
    expect(rec.fired).toBe(true);
  });

  it('does not fire when rigging is allowed and the ceiling clears the threshold', () => {
    const rec = evaluateRiggingOrCeilingConstraint({
      detail: venue({ constraintProfile: profile({ rigging: { allowed: true, maxClearanceFt: null }, ceiling: { clearanceFt: 20, lowCeilingThresholdFt: 14 } }) }),
      eventId: EVENT_ID
    });

    expect(rec.fired).toBe(false);
    expect(rec.status).toBe('suppressed');
  });

  it('does not fire when rigging is explicitly not planned (soft gate), even with a low ceiling', () => {
    const rec = evaluateRiggingOrCeilingConstraint({
      detail: venue({ constraintProfile: profile({ rigging: { allowed: true, maxClearanceFt: null }, ceiling: { clearanceFt: 11, lowCeilingThresholdFt: 14 } }) }),
      eventId: EVENT_ID,
      riggingPlanned: false
    });

    expect(rec.fired).toBe(false);
  });

  it('returns needs_review when both clearance signals and rigging policy are missing', () => {
    const rec = evaluateRiggingOrCeilingConstraint({
      detail: venue({ heightFt: undefined, constraintProfile: profile({ rigging: { allowed: null, maxClearanceFt: null }, ceiling: { clearanceFt: null, lowCeilingThresholdFt: 14 } }) }),
      eventId: EVENT_ID
    });

    expect(rec.fired).toBe(false);
    expect(rec.status).toBe('needs_review');
    expect(rec.severity).toBe('warning');
  });
});

describe('trust-weighted framework confidence (HEADLINE)', () => {
  function populated(sourceConfidence: AtlasVenueDetail['sourceConfidence']): AtlasVenueDetail {
    // Same fully-populated, load-bearing profile under two trust tiers.
    return sizedVenue({
      sourceConfidence,
      heightFt: 20,
      constraintProfile: profile({
        capacity: { comfortableAcousticMax: 320 },
        timeline: { roomFlipMin: 45, ceremonyToReceptionMin: 90, preSetSupported: true },
        rigging: { allowed: true, maxClearanceFt: 18 },
        ceiling: { clearanceFt: 20, lowCeilingThresholdFt: 14 }
      })
    });
  }

  it('yields strictly higher capacity_squeeze confidence for vendor_verified than unverified', () => {
    const verified = evaluateCapacitySqueeze({ detail: populated('vendor_verified'), eventId: EVENT_ID, ...SIZED_RECEPTION, desiredGuests: 300 });
    const unverified = evaluateCapacitySqueeze({ detail: populated('unverified'), eventId: EVENT_ID, ...SIZED_RECEPTION, desiredGuests: 300 });

    expect(verified.confidence).toBeGreaterThan(unverified.confidence);
    for (const conf of [verified.confidence, unverified.confidence]) {
      expect(conf).toBeGreaterThanOrEqual(0);
      expect(conf).toBeLessThanOrEqual(1);
    }
  });

  it('yields strictly higher rigging confidence for vendor_verified than unverified', () => {
    const verified = evaluateRiggingOrCeilingConstraint({ detail: populated('vendor_verified'), eventId: EVENT_ID });
    const unverified = evaluateRiggingOrCeilingConstraint({ detail: populated('unverified'), eventId: EVENT_ID });

    expect(verified.confidence).toBeGreaterThan(unverified.confidence);
    expect(verified.confidence).toBeLessThanOrEqual(1);
    expect(unverified.confidence).toBeGreaterThanOrEqual(0);
  });
});

describe('run*Live persistence short-circuit', () => {
  // No Supabase env in tests -> getAtlasVenueDetail returns the fallback seed (no venueUuid),
  // and persistence short-circuits to 'skipped' when eventId is null.
  const SEED_VENUE_ID = 'intercontinental-buckhead-windsor';

  it('runCapacitySqueezeLive returns persistenceMode skipped when eventId is null', async () => {
    const result = await runCapacitySqueezeLive({ venueId: SEED_VENUE_ID, eventId: null, desiredGuests: 300 });
    expect(result).not.toBeNull();
    expect(result?.persistenceMode).toBe('skipped');
    expect(result?.recommendation.triggerKey).toBe('capacity_squeeze');
  });

  it('runTightRoomFlipLive returns persistenceMode skipped when eventId is null', async () => {
    const result = await runTightRoomFlipLive({ venueId: SEED_VENUE_ID, eventId: null });
    expect(result).not.toBeNull();
    expect(result?.persistenceMode).toBe('skipped');
    expect(result?.recommendation.triggerKey).toBe('tight_room_flip');
  });

  it('runRiggingOrCeilingConstraintLive returns persistenceMode skipped when eventId is null', async () => {
    const result = await runRiggingOrCeilingConstraintLive({ venueId: SEED_VENUE_ID, eventId: null });
    expect(result).not.toBeNull();
    expect(result?.persistenceMode).toBe('skipped');
    expect(result?.recommendation.triggerKey).toBe('rigging_or_ceiling_constraint');
  });

  it('returns null when the venue id is unknown', async () => {
    const result = await runCapacitySqueezeLive({ venueId: 'does-not-exist', eventId: null, desiredGuests: 100 });
    expect(result).toBeNull();
  });

  it('runVenueFeasibilityLive runs all four triggers in one pass for a known venue', async () => {
    const result = await runVenueFeasibilityLive({ venueId: SEED_VENUE_ID, eventId: null, desiredGuests: 300 });
    expect(result).not.toBeNull();
    expect(result?.atlasOutdoorPowerCurfew.triggerKey).toBe('outdoor_power_or_curfew');
    expect(result?.recommendations.map((rec) => rec.triggerKey)).toEqual([
      'capacity_squeeze',
      'tight_room_flip',
      'rigging_or_ceiling_constraint'
    ]);
    expect(result?.atlasEvaluationPersistenceMode).toBe('skipped');
  });

  it('runVenueFeasibilityLive returns null for an unknown venue', async () => {
    const result = await runVenueFeasibilityLive({ venueId: 'does-not-exist', eventId: null, desiredGuests: 100 });
    expect(result).toBeNull();
  });
});
