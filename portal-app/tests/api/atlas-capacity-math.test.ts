import { describe, expect, it } from 'vitest';

import {
  computeCapacity,
  resolveCapacityStatus,
  type CapacityInput
} from '@/lib/atlas-operational-truth/capacity-math';

const BASE_INPUT: CapacityInput = {
  lengthFt: 100,
  widthFt: 60,
  serviceLossPct: 0,
  eventMode: 'reception',
  hasDanceFloor: false,
  danceFloorSize: 'medium',
  hasDjPit: false,
  hasBand: false,
  hasAisleRiser: false,
  sqFtPerTable: 50,
  desiredGuests: null
};

function input(overrides: Partial<CapacityInput>): CapacityInput {
  return { ...BASE_INPUT, ...overrides };
}

describe('computeCapacity — area intermediates', () => {
  it('computes totalArea, serviceLossArea, and usableArea from dimensions and loss percent', () => {
    const result = computeCapacity(input({ lengthFt: 100, widthFt: 60, serviceLossPct: 15 }));

    expect(result.totalArea).toBe(6000);
    expect(result.serviceLossArea).toBeCloseTo(900, 6);
    expect(result.usableArea).toBeCloseTo(5100, 6);
  });

  it('treats a zero service loss as a no-op on usable area', () => {
    const result = computeCapacity(input({ lengthFt: 100, widthFt: 60, serviceLossPct: 0 }));

    expect(result.usableArea).toBe(6000);
    expect(result.serviceLossArea).toBe(0);
  });
});

describe('computeCapacity — reception mode', () => {
  it('deducts dance floor, dj pit, and band from usable area', () => {
    // total 6000, no loss -> usable 6000. medium dance floor 576, dj pit 200, band 300.
    const result = computeCapacity(
      input({
        eventMode: 'reception',
        hasDanceFloor: true,
        danceFloorSize: 'medium',
        hasDjPit: true,
        hasBand: true,
        sqFtPerTable: 50
      })
    );

    expect(result.danceArea).toBe(576);
    expect(result.isDanceClamped).toBe(false);
    expect(result.productionDeductions).toBe(576 + 200 + 300);
    expect(result.seatingArea).toBe(6000 - 1076);
    expect(result.maxTables).toBe(Math.floor((6000 - 1076) / 50));
    expect(result.maxCapacity).toBe(Math.floor((6000 - 1076) / 50) * 10);
  });

  it('omits dance, dj, and band deductions when their toggles are off', () => {
    const result = computeCapacity(input({ eventMode: 'reception', sqFtPerTable: 50 }));

    expect(result.danceArea).toBe(0);
    expect(result.productionDeductions).toBe(0);
    expect(result.seatingArea).toBe(6000);
    expect(result.maxCapacity).toBe(Math.floor(6000 / 50) * 10);
  });

  it('selects the correct fixed area for each dance floor size', () => {
    const small = computeCapacity(input({ hasDanceFloor: true, danceFloorSize: 'small' }));
    const medium = computeCapacity(input({ hasDanceFloor: true, danceFloorSize: 'medium' }));
    const large = computeCapacity(input({ hasDanceFloor: true, danceFloorSize: 'large' }));

    expect(small.danceArea).toBe(400);
    expect(medium.danceArea).toBe(576);
    expect(large.danceArea).toBe(900);
  });
});

describe('computeCapacity — dance floor clamp boundary', () => {
  it('does NOT clamp when dance area exactly equals 20% of usable area', () => {
    // usable 4500 -> cap = 900. large dance floor = 900. 900 > 900 is false.
    const result = computeCapacity(
      input({ lengthFt: 90, widthFt: 50, serviceLossPct: 0, hasDanceFloor: true, danceFloorSize: 'large' })
    );

    expect(result.usableArea).toBe(4500);
    expect(result.danceArea).toBe(900);
    expect(result.isDanceClamped).toBe(false);
  });

  it('clamps when dance area exceeds 20% of usable area, even by a sliver', () => {
    // usable 4499 -> cap = 899.8. large dance floor 900 > 899.8 -> clamp.
    const result = computeCapacity(
      input({ lengthFt: 4499, widthFt: 1, serviceLossPct: 0, hasDanceFloor: true, danceFloorSize: 'large' })
    );

    expect(result.usableArea).toBe(4499);
    expect(result.isDanceClamped).toBe(true);
    expect(result.danceArea).toBeCloseTo(899.8, 6);
    // clamped dance area must flow into reception production deductions
    expect(result.productionDeductions).toBeCloseTo(899.8, 6);
  });

  it('clamps a large dance floor hard in a small room', () => {
    // total 1000, no loss -> usable 1000, cap 200. large floor 900 -> clamp to 200.
    const result = computeCapacity(
      input({ lengthFt: 50, widthFt: 20, serviceLossPct: 0, hasDanceFloor: true, danceFloorSize: 'large' })
    );

    expect(result.usableArea).toBe(1000);
    expect(result.danceArea).toBe(200);
    expect(result.isDanceClamped).toBe(true);
    expect(result.seatingArea).toBe(800);
  });
});

describe('computeCapacity — sangeet mode', () => {
  it('reserves 60% of usable area for garba plus dj pit', () => {
    // total 6000, no loss -> usable 6000. garba 3600, dj pit 200 -> deductions 3800.
    const result = computeCapacity(
      input({ eventMode: 'sangeet', hasDjPit: true, hasDanceFloor: true, danceFloorSize: 'large', sqFtPerTable: 50 })
    );

    expect(result.productionDeductions).toBeCloseTo(3800, 6);
    expect(result.seatingArea).toBeCloseTo(2200, 6);
    expect(result.maxTables).toBe(Math.floor(2200 / 50));
    expect(result.maxCapacity).toBe(Math.floor(2200 / 50) * 10);
  });

  it('ignores the band toggle in sangeet mode (only dj pit applies)', () => {
    const withBand = computeCapacity(input({ eventMode: 'sangeet', hasBand: true }));
    const withoutBand = computeCapacity(input({ eventMode: 'sangeet', hasBand: false }));

    expect(withBand.productionDeductions).toBe(withoutBand.productionDeductions);
    expect(withBand.productionDeductions).toBeCloseTo(6000 * 0.6, 6);
  });
});

describe('computeCapacity — ceremony mode', () => {
  it('uses the fixed base deduction plus aisle riser and the /12 capacity path', () => {
    // total 5000, no loss -> usable 5000. 600 + 500 aisle = 1100 deduction. seating 3900.
    const result = computeCapacity(
      input({
        lengthFt: 100,
        widthFt: 50,
        serviceLossPct: 0,
        eventMode: 'ceremony',
        hasAisleRiser: true,
        sqFtPerTable: 50
      })
    );

    expect(result.productionDeductions).toBe(1100);
    expect(result.seatingArea).toBe(3900);
    // ceremony capacity uses seatingArea / 12, NOT maxTables * 10
    expect(result.maxCapacity).toBe(Math.floor(3900 / 12));
    expect(result.maxCapacity).toBe(325);
  });

  it('drops the aisle riser deduction when the toggle is off', () => {
    const result = computeCapacity(
      input({ lengthFt: 100, widthFt: 50, serviceLossPct: 0, eventMode: 'ceremony', hasAisleRiser: false })
    );

    expect(result.productionDeductions).toBe(600);
    expect(result.seatingArea).toBe(4400);
    expect(result.maxCapacity).toBe(Math.floor(4400 / 12));
  });

  it('ignores dance floor, dj pit, and band in ceremony deductions', () => {
    const result = computeCapacity(
      input({
        lengthFt: 100,
        widthFt: 50,
        eventMode: 'ceremony',
        hasDanceFloor: true,
        danceFloorSize: 'large',
        hasDjPit: true,
        hasBand: true
      })
    );

    expect(result.productionDeductions).toBe(600);
  });
});

describe('computeCapacity — sqFtPerTable floor of 10', () => {
  it('uses 10 sq ft per table when the supplied value is below the floor', () => {
    // total 1000 reception, no production -> seating 1000. sqFtPerTable 5 -> floored to 10.
    const result = computeCapacity(
      input({ lengthFt: 100, widthFt: 10, serviceLossPct: 0, eventMode: 'reception', sqFtPerTable: 5 })
    );

    expect(result.seatingArea).toBe(1000);
    expect(result.maxTables).toBe(Math.floor(1000 / 10));
    expect(result.maxTables).toBe(100);
    expect(result.maxCapacity).toBe(1000);
  });

  it('honors a supplied per-table value above the floor', () => {
    const result = computeCapacity(
      input({ lengthFt: 100, widthFt: 10, serviceLossPct: 0, eventMode: 'reception', sqFtPerTable: 25 })
    );

    expect(result.maxTables).toBe(Math.floor(1000 / 25));
    expect(result.maxTables).toBe(40);
    expect(result.maxCapacity).toBe(400);
  });

  it('treats exactly 10 sq ft per table as the floor value', () => {
    const result = computeCapacity(
      input({ lengthFt: 100, widthFt: 10, serviceLossPct: 0, eventMode: 'reception', sqFtPerTable: 10 })
    );

    expect(result.maxTables).toBe(100);
  });
});

describe('resolveCapacityStatus + computeCapacity — status boundaries', () => {
  it('returns neutral when desiredGuests is null', () => {
    expect(resolveCapacityStatus(500, null)).toBe('neutral');
    expect(computeCapacity(input({ desiredGuests: null })).status).toBe('neutral');
  });

  it('returns neutral when desiredGuests is zero or negative', () => {
    expect(resolveCapacityStatus(500, 0)).toBe('neutral');
    expect(resolveCapacityStatus(500, -25)).toBe('neutral');
  });

  it('returns safe when capacity meets or exceeds desired', () => {
    expect(resolveCapacityStatus(100, 100)).toBe('safe');
    expect(resolveCapacityStatus(150, 100)).toBe('safe');
  });

  it('returns tight at exactly the 90% edge (inclusive)', () => {
    // 0.9 * 100 = 90 -> capacity 90 is tight, not unsafe
    expect(resolveCapacityStatus(90, 100)).toBe('tight');
  });

  it('returns tight between 90% and 100% of desired', () => {
    expect(resolveCapacityStatus(95, 100)).toBe('tight');
    expect(resolveCapacityStatus(99, 100)).toBe('tight');
  });

  it('returns unsafe just below the 90% edge', () => {
    // 0.9 * 101 = 90.9 -> capacity 90 < 90.9 -> unsafe
    expect(resolveCapacityStatus(90, 101)).toBe('unsafe');
    expect(resolveCapacityStatus(89, 100)).toBe('unsafe');
  });

  it('returns unsafe when capacity is far short of desired', () => {
    expect(resolveCapacityStatus(10, 500)).toBe('unsafe');
  });
});

describe('computeCapacity — guards', () => {
  it('clamps negative seating area to zero rather than producing negative tables', () => {
    // sangeet on a tiny room: usable 100, garba 60, dj pit 200 -> deductions 260 > usable.
    const result = computeCapacity(
      input({ lengthFt: 10, widthFt: 10, serviceLossPct: 0, eventMode: 'sangeet', hasDjPit: true })
    );

    expect(result.usableArea).toBe(100);
    expect(result.productionDeductions).toBeGreaterThan(result.usableArea);
    expect(result.seatingArea).toBe(0);
    expect(result.maxTables).toBe(0);
    expect(result.maxCapacity).toBe(0);
  });

  it('coerces non-finite numeric inputs to zero and never returns NaN', () => {
    const result = computeCapacity(
      input({
        lengthFt: Number.NaN,
        widthFt: Number.POSITIVE_INFINITY,
        serviceLossPct: Number.NaN,
        sqFtPerTable: Number.NaN,
        eventMode: 'reception'
      })
    );

    for (const value of [
      result.totalArea,
      result.serviceLossArea,
      result.usableArea,
      result.danceArea,
      result.productionDeductions,
      result.seatingArea,
      result.maxTables,
      result.maxCapacity
    ]) {
      expect(Number.isFinite(value)).toBe(true);
    }

    expect(result.totalArea).toBe(0);
    expect(result.maxCapacity).toBe(0);
    expect(result.status).toBe('neutral');
  });

  it('treats a non-finite desiredGuests as neutral (coerced to zero)', () => {
    expect(resolveCapacityStatus(500, Number.NaN)).toBe('neutral');
    expect(resolveCapacityStatus(500, Number.POSITIVE_INFINITY)).toBe('neutral');
  });
});

describe('computeCapacity — realistic reception case', () => {
  it('produces a full, safe breakdown for an 80x50 ballroom with production load', () => {
    // total 4000, 15% loss -> usable 3400.
    // medium dance floor 576, cap 680 -> no clamp.
    // dj pit 200 + band 300 -> deductions 1076. seating 2324.
    // 72 sq ft per table -> 32 tables -> 320 capacity. desired 300 -> safe.
    const result = computeCapacity({
      lengthFt: 80,
      widthFt: 50,
      serviceLossPct: 15,
      eventMode: 'reception',
      hasDanceFloor: true,
      danceFloorSize: 'medium',
      hasDjPit: true,
      hasBand: true,
      hasAisleRiser: false,
      sqFtPerTable: 72,
      desiredGuests: 300
    });

    expect(result).toEqual({
      totalArea: 4000,
      serviceLossArea: 600,
      usableArea: 3400,
      danceArea: 576,
      isDanceClamped: false,
      productionDeductions: 1076,
      seatingArea: 2324,
      maxTables: 32,
      maxCapacity: 320,
      status: 'safe'
    });
  });

  it('flags the same room as tight when desired guests sit within 90% of capacity', () => {
    // capacity 320; desired 340 -> 0.9 * 340 = 306; 320 >= 306 -> tight.
    const result = computeCapacity({
      lengthFt: 80,
      widthFt: 50,
      serviceLossPct: 15,
      eventMode: 'reception',
      hasDanceFloor: true,
      danceFloorSize: 'medium',
      hasDjPit: true,
      hasBand: true,
      hasAisleRiser: false,
      sqFtPerTable: 72,
      desiredGuests: 340
    });

    expect(result.maxCapacity).toBe(320);
    expect(result.status).toBe('tight');
  });
});
