/**
 * Atlas operational truth — timeline validation.
 *
 * Validates a *generated timeline* against *venue feasibility*. The capacity and
 * trigger modules answer "is this venue workable in principle?"; this module
 * answers "is this specific schedule workable in this venue?" by measuring the
 * timeline (reception end, ceremony->reception gap, first on-site activity) and
 * comparing those measurements to venue constraints (curfew, room-flip time,
 * load-in window).
 *
 * Pure and framework-agnostic: zero React/Next coupling, no I/O, no imports from
 * the rest of the portal-app lib tree. It takes plain typed inputs and returns
 * plain typed outputs so it can be unit-tested in isolation.
 *
 * Timezone contract: ISO strings are compared via their UTC components, and
 * `curfewHour`/`loadInClosesHour` are interpreted in that same UTC wall-clock
 * frame. Generated timelines stamp local wall-clock times through
 * `Date#toISOString()`, so this is exact when the server runs in UTC (the
 * deployment default) and remains internally consistent in tests.
 */

export type TimelineValidationStatus = 'active' | 'needs_review' | 'suppressed';

export type TimelineValidationSeverity = 'info' | 'warning' | 'critical';

export type TimelineValidationCheckKey =
  | 'curfew_vs_reception_end'
  | 'ceremony_to_reception_flip'
  | 'load_in_window';

export interface TimelineValidationItem {
  phaseCode: string;
  scheduledStartIso: string;
  scheduledEndIso: string;
}

export interface TimelineMeasurements {
  ceremonyEndIso: string | null;
  receptionStartIso: string | null;
  receptionEndIso: string | null;
  ceremonyToReceptionMin: number | null;
  earliestStartIso: string | null;
  eventDayEarliestStartIso: string | null;
}

export interface TimelineValidationFinding {
  checkKey: TimelineValidationCheckKey;
  status: TimelineValidationStatus;
  severity: TimelineValidationSeverity;
  confidence: number;
  fired: boolean;
  title: string;
  message: string;
  cta: string;
  evidence: Record<string, unknown>;
  missingFields: string[];
  relatedPhaseCodes: string[];
}

export interface VenueTimelineConstraints {
  curfewType: 'none' | 'soft' | 'strict' | 'unknown' | null;
  curfewHour: number | null;
  roomFlipMin: number | null;
  preSetSupported: boolean | null;
  loadInClosesHour: number | null;
}

export interface TimelineValidationInput {
  items: TimelineValidationItem[];
  venue: VenueTimelineConstraints;
  /** Trust-weighted framework confidence in [0,1]. Defaults to 0.5 (neutral). */
  baseConfidence?: number;
}

export interface TimelineValidationResult {
  measurements: TimelineMeasurements;
  findings: TimelineValidationFinding[];
}

export interface RoomFlipRiskInput {
  ceremonyToReceptionMin: number | null;
  roomFlipMin: number | null;
  preSetSupported: boolean | null;
}

export interface RoomFlipRiskResult {
  /** Both driver fields (gap + flip time) are present, so a verdict is possible. */
  decidable: boolean;
  fired: boolean;
  critical: boolean;
}

const DEFAULT_BASE_CONFIDENCE = 0.5;

function clampConfidence(value: number): number {
  return Math.max(0, Math.min(1, Number(value.toFixed(2))));
}

function isValidIso(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(new Date(value).getTime());
}

function startMs(item: TimelineValidationItem): number {
  return new Date(item.scheduledStartIso).getTime();
}

function endMs(item: TimelineValidationItem): number {
  return isValidIso(item.scheduledEndIso) ? new Date(item.scheduledEndIso).getTime() : startMs(item);
}

/**
 * Resolve a wall-clock hour on the calendar day of a reference instant, in UTC.
 *
 * For late-night curfews, hours >= 24 roll to the next day (24 -> 00:00 next
 * day), and small-hours values (<= 6) are treated as the morning after an
 * evening reference (1 -> 01:00 next day). Daytime references (load-in) pass
 * `lateNightRollover: false` so an hour like 17 stays on the same day.
 */
function dayHourInstantMs(referenceIso: string, hour: number, lateNightRollover: boolean): number | null {
  const ref = new Date(referenceIso);

  if (Number.isNaN(ref.getTime()) || !Number.isFinite(hour)) {
    return null;
  }

  let resolvedHour = hour;
  let dayOffset = 0;

  if (resolvedHour >= 24) {
    resolvedHour -= 24;
    dayOffset = 1;
  } else if (lateNightRollover && resolvedHour <= 6) {
    dayOffset = 1;
  }

  return Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate() + dayOffset, resolvedHour, 0, 0, 0);
}

function formatHourLabel(hour: number): string {
  const normalized = ((Math.round(hour) % 24) + 24) % 24;
  return `${normalized.toString().padStart(2, '0')}:00`;
}

/**
 * Canonical room-flip risk rule, shared by the venue `tight_room_flip` trigger
 * (fed the venue's profile estimate) and timeline validation (fed the measured
 * ceremony->reception gap). Keeping the rule in one place means both surfaces
 * agree on what "tight" means.
 *
 * Fires when the turnaround window is shorter than the flip time and the venue
 * cannot pre-set. Critical when the window is under half the flip time, or the
 * venue explicitly cannot pre-set.
 */
export function assessRoomFlipRisk(input: RoomFlipRiskInput): RoomFlipRiskResult {
  const { ceremonyToReceptionMin, roomFlipMin, preSetSupported } = input;

  if (ceremonyToReceptionMin === null || roomFlipMin === null) {
    return { decidable: false, fired: false, critical: false };
  }

  const fired = ceremonyToReceptionMin < roomFlipMin && preSetSupported !== true;
  const critical = fired && (ceremonyToReceptionMin < 0.5 * roomFlipMin || preSetSupported === false);

  return { decidable: true, fired, critical };
}

/**
 * Derive the timeline markers that venue checks compare against. Reception
 * start/end span all reception items; the ceremony->reception gap is measured
 * from the latest ceremony end to the earliest reception start. Event-day
 * earliest is the first item sharing the (UTC) calendar day of the ceremony, or
 * of the reception when there is no ceremony, or of the overall earliest item.
 */
export function measureTimeline(items: TimelineValidationItem[]): TimelineMeasurements {
  const valid = items.filter((item) => isValidIso(item.scheduledStartIso));

  const ceremonyItems = valid.filter((item) => item.phaseCode === 'ceremony');
  const receptionItems = valid.filter((item) => item.phaseCode === 'reception');

  const ceremonyEnd = ceremonyItems.length > 0 ? Math.max(...ceremonyItems.map(endMs)) : null;
  const receptionStart = receptionItems.length > 0 ? Math.min(...receptionItems.map(startMs)) : null;
  const receptionEnd = receptionItems.length > 0 ? Math.max(...receptionItems.map(endMs)) : null;

  const ceremonyToReceptionMin =
    ceremonyEnd !== null && receptionStart !== null ? Math.round((receptionStart - ceremonyEnd) / 60_000) : null;

  const earliestStart = valid.length > 0 ? Math.min(...valid.map(startMs)) : null;

  const eventDayRefMs = ceremonyEnd ?? receptionStart ?? earliestStart;
  let eventDayEarliest: number | null = null;

  if (eventDayRefMs !== null) {
    const ref = new Date(eventDayRefMs);
    const refY = ref.getUTCFullYear();
    const refM = ref.getUTCMonth();
    const refD = ref.getUTCDate();

    const sameDay = valid.filter((item) => {
      const start = new Date(item.scheduledStartIso);
      return start.getUTCFullYear() === refY && start.getUTCMonth() === refM && start.getUTCDate() === refD;
    });

    eventDayEarliest = sameDay.length > 0 ? Math.min(...sameDay.map(startMs)) : null;
  }

  return {
    ceremonyEndIso: ceremonyEnd !== null ? new Date(ceremonyEnd).toISOString() : null,
    receptionStartIso: receptionStart !== null ? new Date(receptionStart).toISOString() : null,
    receptionEndIso: receptionEnd !== null ? new Date(receptionEnd).toISOString() : null,
    ceremonyToReceptionMin,
    earliestStartIso: earliestStart !== null ? new Date(earliestStart).toISOString() : null,
    eventDayEarliestStartIso: eventDayEarliest !== null ? new Date(eventDayEarliest).toISOString() : null
  };
}

function suppressedFinding(
  checkKey: TimelineValidationCheckKey,
  title: string,
  message: string,
  confidence: number,
  relatedPhaseCodes: string[],
  evidence: Record<string, unknown>
): TimelineValidationFinding {
  return {
    checkKey,
    status: 'suppressed',
    severity: 'info',
    confidence: clampConfidence(confidence),
    fired: false,
    title,
    message,
    cta: 'Continue Planning',
    evidence,
    missingFields: [],
    relatedPhaseCodes
  };
}

function buildCurfewFinding(
  measurements: TimelineMeasurements,
  venue: VenueTimelineConstraints,
  base: number
): TimelineValidationFinding {
  const related = ['reception'];
  const checkKey: TimelineValidationCheckKey = 'curfew_vs_reception_end';

  if (measurements.receptionStartIso === null || measurements.receptionEndIso === null) {
    return suppressedFinding(checkKey, 'No reception phase to check against curfew', 'This timeline has no reception phase, so there is no curfew exposure to evaluate.', base, related, {
      receptionEndIso: measurements.receptionEndIso
    });
  }

  if (venue.curfewType === 'none') {
    return suppressedFinding(checkKey, 'Reception end is within venue policy', 'The venue reports no noise curfew, so the reception end time is unconstrained.', base, related, {
      curfewType: 'none',
      receptionEndIso: measurements.receptionEndIso
    });
  }

  if (venue.curfewHour === null) {
    return {
      checkKey,
      status: 'needs_review',
      severity: 'warning',
      confidence: clampConfidence(base - 0.05),
      fired: false,
      title: 'Confirm venue noise curfew',
      message: 'Atlas has a reception end time but no confirmed venue curfew. Confirm the curfew with the venue before locking the timeline.',
      cta: 'Confirm with Venue',
      evidence: {
        curfewType: venue.curfewType,
        curfewHour: null,
        receptionEndIso: measurements.receptionEndIso
      },
      missingFields: ['operational.sound.curfew.localTime'],
      relatedPhaseCodes: related
    };
  }

  const curfewMs = dayHourInstantMs(measurements.receptionStartIso, venue.curfewHour, true);
  const receptionEndMs = new Date(measurements.receptionEndIso).getTime();

  if (curfewMs === null) {
    return suppressedFinding(checkKey, 'Reception end is within venue policy', 'Curfew could not be resolved from the available data.', base, related, {
      curfewHour: venue.curfewHour,
      receptionEndIso: measurements.receptionEndIso
    });
  }

  const overByMin = Math.round((receptionEndMs - curfewMs) / 60_000);
  const evidence = {
    curfewType: venue.curfewType,
    curfewHour: venue.curfewHour,
    receptionStartIso: measurements.receptionStartIso,
    receptionEndIso: measurements.receptionEndIso,
    overByMin
  };

  if (overByMin <= 0) {
    return suppressedFinding(checkKey, 'Reception ends within the curfew window', `Reception is scheduled to end by the venue curfew (~${formatHourLabel(venue.curfewHour)}).`, base, related, evidence);
  }

  const strict = venue.curfewType === 'strict';

  return {
    checkKey,
    status: 'active',
    severity: strict ? 'critical' : 'warning',
    confidence: clampConfidence(base + (strict ? 0.15 : 0.05)),
    fired: true,
    title: 'Reception Runs Past Venue Curfew',
    message: `Reception is scheduled to end about ${overByMin} minute${overByMin === 1 ? '' : 's'} after the venue curfew (~${formatHourLabel(venue.curfewHour)}). Pull high-volume segments earlier or arrange a curfew exception with the venue.`,
    cta: 'Adjust Reception End',
    evidence,
    missingFields: [],
    relatedPhaseCodes: related
  };
}

function buildFlipFinding(
  measurements: TimelineMeasurements,
  venue: VenueTimelineConstraints,
  base: number
): TimelineValidationFinding {
  const related = ['ceremony', 'reception'];
  const checkKey: TimelineValidationCheckKey = 'ceremony_to_reception_flip';

  if (measurements.ceremonyEndIso === null || measurements.receptionStartIso === null) {
    return suppressedFinding(checkKey, 'No ceremony-to-reception transition to check', 'This timeline does not contain both a ceremony and a reception phase, so there is no room flip to evaluate.', base, related, {
      measuredGapMin: measurements.ceremonyToReceptionMin
    });
  }

  const gap = measurements.ceremonyToReceptionMin as number;

  if (venue.roomFlipMin === null) {
    return {
      checkKey,
      status: 'needs_review',
      severity: 'warning',
      confidence: clampConfidence(base - 0.05),
      fired: false,
      title: 'Confirm venue room-flip time',
      message: `Atlas measured a ${gap}-minute ceremony-to-reception window but does not have the venue's room-flip time. Confirm the flip duration with the venue.`,
      cta: 'Confirm with Venue',
      evidence: {
        measuredGapMin: gap,
        roomFlipMin: null,
        preSetSupported: venue.preSetSupported
      },
      missingFields: ['operational.timeline.roomFlipMin'],
      relatedPhaseCodes: related
    };
  }

  const evidence = {
    measuredGapMin: gap,
    roomFlipMin: venue.roomFlipMin,
    preSetSupported: venue.preSetSupported,
    isOverlap: gap < 0
  };

  // Reception starting before the ceremony ends is a hard scheduling error that
  // pre-set cannot resolve, so it bypasses the flip-duration rule.
  if (gap < 0) {
    return {
      checkKey,
      status: 'active',
      severity: 'critical',
      confidence: clampConfidence(base + 0.1),
      fired: true,
      title: 'Ceremony and Reception Overlap',
      message: `Reception is scheduled to begin before the ceremony ends (${Math.abs(gap)} minute overlap). There is no room-flip window — resolve the overlap before locking the timeline.`,
      cta: 'Resolve Overlap',
      evidence,
      missingFields: [],
      relatedPhaseCodes: related
    };
  }

  const risk = assessRoomFlipRisk({
    ceremonyToReceptionMin: gap,
    roomFlipMin: venue.roomFlipMin,
    preSetSupported: venue.preSetSupported
  });

  if (!risk.fired) {
    const coveredByPreSet = venue.preSetSupported === true && gap < venue.roomFlipMin;
    const message = coveredByPreSet
      ? `The ${gap}-minute window is shorter than the ${venue.roomFlipMin}-minute flip, but the venue supports pre-set, which covers the turnaround.`
      : `The ${gap}-minute ceremony-to-reception window meets the venue's ${venue.roomFlipMin}-minute room-flip time.`;
    return suppressedFinding(checkKey, 'Room flip window looks workable', message, base, related, evidence);
  }

  return {
    checkKey,
    status: 'active',
    severity: risk.critical ? 'critical' : 'warning',
    confidence: clampConfidence(base + (risk.critical ? 0.1 : 0.05)),
    fired: true,
    title: 'Tight Room Flip Risk',
    message: `The ${gap}-minute ceremony-to-reception window is shorter than the venue's ${venue.roomFlipMin}-minute room flip. Plan a mitigation (pre-set, second space, or an extended cocktail hour).`,
    cta: 'Explore Flip Mitigations',
    evidence,
    missingFields: [],
    relatedPhaseCodes: related
  };
}

function buildLoadInFinding(
  measurements: TimelineMeasurements,
  venue: VenueTimelineConstraints,
  base: number
): TimelineValidationFinding {
  const related: string[] = [];
  const checkKey: TimelineValidationCheckKey = 'load_in_window';

  if (measurements.eventDayEarliestStartIso === null) {
    return suppressedFinding(checkKey, 'No event-day activity to check load-in against', 'This timeline has no event-day items, so there is no load-in exposure to evaluate.', base, related, {
      eventDayEarliestStartIso: null
    });
  }

  if (venue.loadInClosesHour === null) {
    return {
      checkKey,
      status: 'needs_review',
      severity: 'warning',
      confidence: clampConfidence(base - 0.05),
      fired: false,
      title: 'Confirm venue load-in window',
      message: 'Atlas does not have a structured load-in window for this venue. Confirm load-in and setup access times with the venue.',
      cta: 'Confirm with Venue',
      evidence: {
        loadInClosesHour: null,
        eventDayEarliestStartIso: measurements.eventDayEarliestStartIso
      },
      missingFields: ['operational.loadIn.closesHour'],
      relatedPhaseCodes: related
    };
  }

  const closeMs = dayHourInstantMs(measurements.eventDayEarliestStartIso, venue.loadInClosesHour, false);
  const firstMs = new Date(measurements.eventDayEarliestStartIso).getTime();

  if (closeMs === null) {
    return suppressedFinding(checkKey, 'Load-in window looks workable', 'Load-in window could not be resolved from the available data.', base, related, {
      loadInClosesHour: venue.loadInClosesHour,
      eventDayEarliestStartIso: measurements.eventDayEarliestStartIso
    });
  }

  const overByMin = Math.round((firstMs - closeMs) / 60_000);
  const evidence = {
    loadInClosesHour: venue.loadInClosesHour,
    eventDayEarliestStartIso: measurements.eventDayEarliestStartIso,
    overByMin
  };

  if (overByMin <= 0) {
    return suppressedFinding(checkKey, 'Load-in window looks workable', `The first on-site activity falls within the venue load-in window (closes ~${formatHourLabel(venue.loadInClosesHour)}).`, base, related, evidence);
  }

  return {
    checkKey,
    status: 'active',
    severity: 'warning',
    confidence: clampConfidence(base + 0.05),
    fired: true,
    title: 'Load-In Window May Be Missed',
    message: `The first on-site activity is scheduled about ${overByMin} minute${overByMin === 1 ? '' : 's'} after the venue load-in window closes (~${formatHourLabel(venue.loadInClosesHour)}). Confirm an earlier load-in or setup slot is booked.`,
    cta: 'Confirm Load-In Slot',
    evidence,
    missingFields: [],
    relatedPhaseCodes: related
  };
}

/**
 * Validate a generated timeline against venue feasibility constraints. Returns
 * the derived measurements plus one finding per check (curfew, room flip,
 * load-in). Suppressed findings are included so callers can render or filter
 * them; the contract mirrors the venue trigger recommendations.
 */
export function validateTimeline(input: TimelineValidationInput): TimelineValidationResult {
  const base = clampConfidence(input.baseConfidence ?? DEFAULT_BASE_CONFIDENCE);
  const measurements = measureTimeline(input.items);

  const findings = [
    buildCurfewFinding(measurements, input.venue, base),
    buildFlipFinding(measurements, input.venue, base),
    buildLoadInFinding(measurements, input.venue, base)
  ];

  return { measurements, findings };
}
