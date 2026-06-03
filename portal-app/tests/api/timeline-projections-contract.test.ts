import { describe, expect, it } from 'vitest';

import { buildBaseCanonicalTimeline, createTimelineResponse, detectTimelineConflicts, recalculateTimeline } from '@/lib/canonical-timeline';

describe('timeline projections contract', () => {
  it('returns full planner projection and owner-filtered couple projection', () => {
    const items = buildBaseCanonicalTimeline('evt-akshay-rani');

    const plannerResponse = createTimelineResponse({
      eventId: 'evt-akshay-rani',
      role: 'planner',
      source: 'mock',
      items
    });
    const coupleResponse = createTimelineResponse({
      eventId: 'evt-akshay-rani',
      role: 'couple',
      source: 'mock',
      items
    });

    expect(plannerResponse.timeline.length).toBeGreaterThan(coupleResponse.timeline.length);
    expect(plannerResponse.timeline.every((item) => item.readOnly === false)).toBe(true);
    expect(coupleResponse.timeline.every((item) => item.readOnly === true)).toBe(true);
    expect(coupleResponse.timeline.every((item) => item.visibility !== 'operations')).toBe(true);
  });

  it('detects overlap conflicts and resolves them through recalculation', () => {
    const items = buildBaseCanonicalTimeline('evt-akshay-rani');
    const conflicted = items.map((item, index) => {
      if (index === 1) {
        return {
          ...item,
          scheduledStartIso: items[0].scheduledStartIso,
          scheduledEndIso: items[0].scheduledEndIso
        };
      }

      return item;
    });

    const conflicts = detectTimelineConflicts(conflicted);
    expect(conflicts.some((conflict) => conflict.type === 'overlap')).toBe(true);

    const recalculated = recalculateTimeline(conflicted);
    expect(recalculated.adjustments.length).toBeGreaterThan(0);
    expect(recalculated.conflicts.some((conflict) => conflict.type === 'overlap')).toBe(false);
  });
});