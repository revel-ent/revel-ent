import { describe, expect, it } from 'vitest';

import {
  assessRoomFlipRisk,
  measureTimeline,
  validateTimeline,
  type TimelineValidationFinding,
  type TimelineValidationItem
} from '@/lib/atlas-operational-truth/timeline-validation';
import { evaluateTimelineFeasibility, type AtlasVenueDetail } from '@/lib/atlas-venues';
import type { VenueConstraintProfile } from '@/lib/atlas-types';

function item(phaseCode: string, startIso: string, endIso: string): TimelineValidationItem {
  return { phaseCode, scheduledStartIso: startIso, scheduledEndIso: endIso };
}

function findingFor(findings: TimelineValidationFinding[], key: string): TimelineValidationFinding {
  const match = findings.find((finding) => finding.checkKey === key);

  if (!match) {
    throw new Error(`expected a finding for ${key}`);
  }

  return match;
}

// Reception that comfortably clears a 22:00 / midnight curfew (afternoon block).
const SAFE_RECEPTION = item('reception', '2026-11-27T19:00:00.000Z', '2026-11-27T21:00:00.000Z');

describe('measureTimeline', () => {
  it('returns all-null measurements for an empty timeline', () => {
    const measurements = measureTimeline([]);

    expect(measurements).toEqual({
      ceremonyEndIso: null,
      receptionStartIso: null,
      receptionEndIso: null,
      ceremonyToReceptionMin: null,
      earliestStartIso: null,
      eventDayEarliestStartIso: null
    });
  });

  it('derives ceremony end, reception span, and the measured flip gap', () => {
    const measurements = measureTimeline([
      item('ceremony', '2026-11-27T18:00:00.000Z', '2026-11-27T19:00:00.000Z'),
      item('reception', '2026-11-27T19:45:00.000Z', '2026-11-27T22:00:00.000Z')
    ]);

    expect(measurements.ceremonyEndIso).toBe('2026-11-27T19:00:00.000Z');
    expect(measurements.receptionStartIso).toBe('2026-11-27T19:45:00.000Z');
    expect(measurements.receptionEndIso).toBe('2026-11-27T22:00:00.000Z');
    expect(measurements.ceremonyToReceptionMin).toBe(45);
  });

  it('spans the earliest start and latest end across multiple reception rows', () => {
    const measurements = measureTimeline([
      item('reception', '2026-11-27T20:00:00.000Z', '2026-11-27T21:00:00.000Z'),
      item('reception', '2026-11-27T19:30:00.000Z', '2026-11-27T20:30:00.000Z'),
      item('reception', '2026-11-27T21:30:00.000Z', '2026-11-27T23:15:00.000Z')
    ]);

    expect(measurements.receptionStartIso).toBe('2026-11-27T19:30:00.000Z');
    expect(measurements.receptionEndIso).toBe('2026-11-27T23:15:00.000Z');
  });

  it('ignores rows with an invalid start ISO', () => {
    const measurements = measureTimeline([
      item('ceremony', 'not-a-date', '2026-11-27T19:00:00.000Z'),
      item('reception', '2026-11-27T19:30:00.000Z', '2026-11-27T21:00:00.000Z')
    ]);

    expect(measurements.ceremonyEndIso).toBeNull();
    expect(measurements.receptionStartIso).toBe('2026-11-27T19:30:00.000Z');
  });

  it('scopes event-day earliest to the ceremony calendar day, not prior-day setup', () => {
    const measurements = measureTimeline([
      item('mehndi', '2026-11-26T15:00:00.000Z', '2026-11-26T16:00:00.000Z'),
      item('haldi', '2026-11-27T09:00:00.000Z', '2026-11-27T10:00:00.000Z'),
      item('ceremony', '2026-11-27T18:00:00.000Z', '2026-11-27T19:00:00.000Z'),
      item('reception', '2026-11-27T20:00:00.000Z', '2026-11-27T22:00:00.000Z')
    ]);

    expect(measurements.earliestStartIso).toBe('2026-11-26T15:00:00.000Z');
    expect(measurements.eventDayEarliestStartIso).toBe('2026-11-27T09:00:00.000Z');
  });
});

describe('assessRoomFlipRisk', () => {
  it('is not decidable when either driver is missing', () => {
    expect(assessRoomFlipRisk({ ceremonyToReceptionMin: null, roomFlipMin: 60, preSetSupported: null })).toEqual({
      decidable: false,
      fired: false,
      critical: false
    });
    expect(assessRoomFlipRisk({ ceremonyToReceptionMin: 30, roomFlipMin: null, preSetSupported: null })).toEqual({
      decidable: false,
      fired: false,
      critical: false
    });
  });

  it('does not fire when the window meets the flip time', () => {
    expect(assessRoomFlipRisk({ ceremonyToReceptionMin: 60, roomFlipMin: 60, preSetSupported: null })).toEqual({
      decidable: true,
      fired: false,
      critical: false
    });
  });

  it('fires (warning) when the window is short but above half the flip time', () => {
    expect(assessRoomFlipRisk({ ceremonyToReceptionMin: 40, roomFlipMin: 60, preSetSupported: null })).toEqual({
      decidable: true,
      fired: true,
      critical: false
    });
  });

  it('escalates to critical when the window is under half the flip time', () => {
    expect(assessRoomFlipRisk({ ceremonyToReceptionMin: 20, roomFlipMin: 60, preSetSupported: null })).toEqual({
      decidable: true,
      fired: true,
      critical: true
    });
  });

  it('does not fire when the venue supports pre-set', () => {
    expect(assessRoomFlipRisk({ ceremonyToReceptionMin: 20, roomFlipMin: 60, preSetSupported: true })).toEqual({
      decidable: true,
      fired: false,
      critical: false
    });
  });

  it('is critical when pre-set is explicitly unavailable', () => {
    expect(assessRoomFlipRisk({ ceremonyToReceptionMin: 50, roomFlipMin: 60, preSetSupported: false })).toEqual({
      decidable: true,
      fired: true,
      critical: true
    });
  });
});

describe('validateTimeline — curfew vs reception end', () => {
  const baseVenue = {
    curfewType: 'strict' as const,
    curfewHour: 24,
    roomFlipMin: null,
    preSetSupported: null,
    loadInClosesHour: null
  };

  it('suppresses when there is no reception phase', () => {
    const { findings } = validateTimeline({
      items: [item('ceremony', '2026-11-27T18:00:00.000Z', '2026-11-27T19:00:00.000Z')],
      venue: baseVenue
    });

    expect(findingFor(findings, 'curfew_vs_reception_end').status).toBe('suppressed');
  });

  it('suppresses when the venue confirms no curfew', () => {
    const { findings } = validateTimeline({
      items: [SAFE_RECEPTION],
      venue: { ...baseVenue, curfewType: 'none', curfewHour: null }
    });

    expect(findingFor(findings, 'curfew_vs_reception_end').status).toBe('suppressed');
  });

  it('needs review when a reception exists but the curfew hour is unknown', () => {
    const { findings } = validateTimeline({
      items: [SAFE_RECEPTION],
      venue: { ...baseVenue, curfewType: 'unknown', curfewHour: null }
    });

    const finding = findingFor(findings, 'curfew_vs_reception_end');
    expect(finding.status).toBe('needs_review');
    expect(finding.missingFields).toContain('operational.sound.curfew.localTime');
  });

  it('suppresses when the reception ends within the curfew window', () => {
    const { findings } = validateTimeline({
      items: [item('reception', '2026-11-27T22:00:00.000Z', '2026-11-27T23:30:00.000Z')],
      venue: { ...baseVenue, curfewHour: 24 }
    });

    expect(findingFor(findings, 'curfew_vs_reception_end').status).toBe('suppressed');
  });

  it('fires critical when a strict curfew is breached past midnight', () => {
    const { findings } = validateTimeline({
      items: [item('reception', '2026-11-27T22:30:00.000Z', '2026-11-28T00:45:00.000Z')],
      venue: { ...baseVenue, curfewType: 'strict', curfewHour: 24 }
    });

    const finding = findingFor(findings, 'curfew_vs_reception_end');
    expect(finding.status).toBe('active');
    expect(finding.severity).toBe('critical');
    expect(finding.evidence.overByMin).toBe(45);
    expect(finding.confidence).toBeCloseTo(0.65, 5);
  });

  it('fires warning (not critical) for a soft curfew breach', () => {
    const { findings } = validateTimeline({
      items: [item('reception', '2026-11-27T21:00:00.000Z', '2026-11-27T23:30:00.000Z')],
      venue: { ...baseVenue, curfewType: 'soft', curfewHour: 22 }
    });

    const finding = findingFor(findings, 'curfew_vs_reception_end');
    expect(finding.status).toBe('active');
    expect(finding.severity).toBe('warning');
    expect(finding.evidence.overByMin).toBe(90);
  });
});

describe('validateTimeline — ceremony to reception flip', () => {
  const baseVenue = {
    curfewType: 'none' as const,
    curfewHour: null,
    roomFlipMin: 60,
    preSetSupported: null,
    loadInClosesHour: null
  };

  it('suppresses when ceremony or reception is absent', () => {
    const { findings } = validateTimeline({
      items: [SAFE_RECEPTION],
      venue: baseVenue
    });

    expect(findingFor(findings, 'ceremony_to_reception_flip').status).toBe('suppressed');
  });

  it('needs review when the venue room-flip time is unknown', () => {
    const { findings } = validateTimeline({
      items: [
        item('ceremony', '2026-11-27T18:00:00.000Z', '2026-11-27T19:00:00.000Z'),
        item('reception', '2026-11-27T19:30:00.000Z', '2026-11-27T21:00:00.000Z')
      ],
      venue: { ...baseVenue, roomFlipMin: null }
    });

    const finding = findingFor(findings, 'ceremony_to_reception_flip');
    expect(finding.status).toBe('needs_review');
    expect(finding.missingFields).toContain('operational.timeline.roomFlipMin');
  });

  it('suppresses when the measured gap meets the flip time', () => {
    const { findings } = validateTimeline({
      items: [
        item('ceremony', '2026-11-27T18:00:00.000Z', '2026-11-27T19:00:00.000Z'),
        item('reception', '2026-11-27T20:00:00.000Z', '2026-11-27T22:00:00.000Z')
      ],
      venue: { ...baseVenue, roomFlipMin: 60 }
    });

    expect(findingFor(findings, 'ceremony_to_reception_flip').status).toBe('suppressed');
  });

  it('fires when the measured gap is shorter than the flip time', () => {
    const { findings } = validateTimeline({
      items: [
        item('ceremony', '2026-11-27T18:00:00.000Z', '2026-11-27T19:00:00.000Z'),
        item('reception', '2026-11-27T19:30:00.000Z', '2026-11-27T21:00:00.000Z')
      ],
      venue: { ...baseVenue, roomFlipMin: 60 }
    });

    const finding = findingFor(findings, 'ceremony_to_reception_flip');
    expect(finding.status).toBe('active');
    expect(finding.severity).toBe('warning');
    expect(finding.evidence.measuredGapMin).toBe(30);
  });

  it('fires critical for a ceremony/reception overlap regardless of pre-set', () => {
    const { findings } = validateTimeline({
      items: [
        item('ceremony', '2026-11-27T18:00:00.000Z', '2026-11-27T20:00:00.000Z'),
        item('reception', '2026-11-27T19:30:00.000Z', '2026-11-27T22:00:00.000Z')
      ],
      venue: { ...baseVenue, roomFlipMin: 60, preSetSupported: true }
    });

    const finding = findingFor(findings, 'ceremony_to_reception_flip');
    expect(finding.status).toBe('active');
    expect(finding.severity).toBe('critical');
    expect(finding.evidence.isOverlap).toBe(true);
  });

  it('suppresses a tight gap when the venue supports pre-set', () => {
    const { findings } = validateTimeline({
      items: [
        item('ceremony', '2026-11-27T18:00:00.000Z', '2026-11-27T19:00:00.000Z'),
        item('reception', '2026-11-27T19:30:00.000Z', '2026-11-27T21:00:00.000Z')
      ],
      venue: { ...baseVenue, roomFlipMin: 60, preSetSupported: true }
    });

    const finding = findingFor(findings, 'ceremony_to_reception_flip');
    expect(finding.status).toBe('suppressed');
    expect(finding.message).toContain('pre-set');
  });
});

describe('validateTimeline — load-in window', () => {
  const baseVenue = {
    curfewType: 'none' as const,
    curfewHour: null,
    roomFlipMin: null,
    preSetSupported: null,
    loadInClosesHour: 17
  };

  it('needs review when the load-in window is unknown', () => {
    const { findings } = validateTimeline({
      items: [item('setup', '2026-11-27T15:00:00.000Z', '2026-11-27T16:00:00.000Z')],
      venue: { ...baseVenue, loadInClosesHour: null }
    });

    const finding = findingFor(findings, 'load_in_window');
    expect(finding.status).toBe('needs_review');
    expect(finding.missingFields).toContain('operational.loadIn.closesHour');
  });

  it('suppresses when the first on-site activity is within the load-in window', () => {
    const { findings } = validateTimeline({
      items: [
        item('setup', '2026-11-27T15:00:00.000Z', '2026-11-27T16:00:00.000Z'),
        item('reception', '2026-11-27T20:00:00.000Z', '2026-11-27T22:00:00.000Z')
      ],
      venue: { ...baseVenue, loadInClosesHour: 17 }
    });

    expect(findingFor(findings, 'load_in_window').status).toBe('suppressed');
  });

  it('fires when the first on-site activity is after the load-in window closes', () => {
    const { findings } = validateTimeline({
      items: [
        item('setup', '2026-11-27T18:00:00.000Z', '2026-11-27T19:00:00.000Z'),
        item('reception', '2026-11-27T20:00:00.000Z', '2026-11-27T22:00:00.000Z')
      ],
      venue: { ...baseVenue, loadInClosesHour: 17 }
    });

    const finding = findingFor(findings, 'load_in_window');
    expect(finding.status).toBe('active');
    expect(finding.severity).toBe('warning');
    expect(finding.evidence.overByMin).toBe(60);
  });
});

describe('validateTimeline — result shape', () => {
  it('always returns one finding per check, including suppressed ones', () => {
    const { findings } = validateTimeline({
      items: [SAFE_RECEPTION],
      venue: { curfewType: 'none', curfewHour: null, roomFlipMin: null, preSetSupported: null, loadInClosesHour: null }
    });

    expect(findings).toHaveLength(3);
    expect(findings.map((finding) => finding.checkKey).sort()).toEqual([
      'ceremony_to_reception_flip',
      'curfew_vs_reception_end',
      'load_in_window'
    ]);
  });

  it('threads base confidence into needs_review findings', () => {
    const { findings } = validateTimeline({
      items: [SAFE_RECEPTION],
      venue: { curfewType: 'unknown', curfewHour: null, roomFlipMin: null, preSetSupported: null, loadInClosesHour: null },
      baseConfidence: 0.8
    });

    expect(findingFor(findings, 'curfew_vs_reception_end').confidence).toBeCloseTo(0.75, 5);
  });
});

// -----------------------------------------------------------------------------
// Adapter: evaluateTimelineFeasibility resolves venue primitives from a detail.
// -----------------------------------------------------------------------------

function makeProfile(overrides: {
  curfewType?: VenueConstraintProfile['operational']['sound']['curfew']['type'];
  curfewLocalTime?: string | null;
  roomFlipMin?: number | null;
  preSetSupported?: boolean | null;
}): VenueConstraintProfile {
  return {
    schemaVersion: 'venue_constraints_v1',
    operational: {
      power: { limited: null, dedicatedDjCircuit: null, generatorOnly: null, outdoorAvailability: 'unknown', notes: [] },
      sound: {
        curfew: {
          type: overrides.curfewType ?? 'unknown',
          localTime: overrides.curfewLocalTime ?? null,
          timezone: null
        },
        outdoorAmplifiedMusicAllowed: null,
        maxDb: null,
        notes: []
      },
      capacity: { marketed: null, comfortableAcousticMax: null, overflowRecommendedAbove: null, notes: [] },
      timeline: {
        roomFlipMin: overrides.roomFlipMin ?? null,
        ceremonyToReceptionMin: null,
        preSetSupported: overrides.preSetSupported ?? null,
        notes: []
      },
      rigging: { allowed: null, maxClearanceFt: null, notes: [] },
      ceiling: { clearanceFt: null, lowCeilingThresholdFt: 14, notes: [] },
      outdoor: { ceremonyAllowed: null, baraatAllowed: null, baraatRouteNotes: null, weatherFallbackAvailable: null, notes: [] }
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

function makeDetail(overrides: Partial<AtlasVenueDetail>): AtlasVenueDetail {
  return {
    id: 'venue-under-test',
    name: 'Test Ballroom',
    city: 'Atlanta, GA',
    marketedCapacity: 300,
    comfortableRangeMin: 200,
    comfortableRangeMax: 260,
    notes: [],
    constraintsSummary: 'summary',
    sourceConfidence: 'vendor_verified',
    constraints: [],
    ...overrides
  };
}

describe('evaluateTimelineFeasibility adapter', () => {
  const eveningWeekend: TimelineValidationItem[] = [
    item('ceremony', '2026-11-27T18:00:00.000Z', '2026-11-27T19:00:00.000Z'),
    item('reception', '2026-11-27T19:30:00.000Z', '2026-11-28T00:30:00.000Z')
  ];

  it('drives curfew and flip findings from the constraint profile', () => {
    const detail = makeDetail({
      constraintProfile: makeProfile({
        curfewType: 'strict',
        curfewLocalTime: '24:00',
        roomFlipMin: 60,
        preSetSupported: false
      })
    });

    const { findings } = evaluateTimelineFeasibility(detail, eveningWeekend);

    const curfew = findingFor(findings, 'curfew_vs_reception_end');
    expect(curfew.status).toBe('active');
    expect(curfew.severity).toBe('critical');

    const flip = findingFor(findings, 'ceremony_to_reception_flip');
    expect(flip.status).toBe('active');
    // 30-minute gap, 60-minute flip, pre-set explicitly unavailable -> critical.
    expect(flip.severity).toBe('critical');
    expect(flip.evidence.measuredGapMin).toBe(30);
  });

  it('falls back to the flat noise curfew hour when no profile is present', () => {
    const detail = makeDetail({ noiseCurfewHour: 22, constraintProfile: null });

    const { findings } = evaluateTimelineFeasibility(detail, [
      item('reception', '2026-11-27T20:00:00.000Z', '2026-11-27T23:30:00.000Z')
    ]);

    const curfew = findingFor(findings, 'curfew_vs_reception_end');
    expect(curfew.status).toBe('active');
    // No structured curfew type -> warning rather than critical.
    expect(curfew.severity).toBe('warning');
    expect(curfew.evidence.overByMin).toBe(90);
  });

  it('parses the load-in close hour from an unstructured venue note', () => {
    const detail = makeDetail({
      notes: ['Load-in window closes at 5:00 PM.'],
      constraintProfile: null
    });

    const { findings } = evaluateTimelineFeasibility(detail, [
      item('setup', '2026-11-27T18:00:00.000Z', '2026-11-27T19:00:00.000Z'),
      item('reception', '2026-11-27T20:00:00.000Z', '2026-11-27T22:00:00.000Z')
    ]);

    const loadIn = findingFor(findings, 'load_in_window');
    expect(loadIn.status).toBe('active');
    expect(loadIn.evidence.loadInClosesHour).toBe(17);
    expect(loadIn.evidence.overByMin).toBe(60);
  });

  it('returns load-in needs_review when no load-in data can be resolved', () => {
    const detail = makeDetail({ notes: [], constraints: [], constraintProfile: null });

    const { findings } = evaluateTimelineFeasibility(detail, [
      item('reception', '2026-11-27T20:00:00.000Z', '2026-11-27T22:00:00.000Z')
    ]);

    expect(findingFor(findings, 'load_in_window').status).toBe('needs_review');
  });
});
