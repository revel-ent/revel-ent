/**
 * Atlas operational truth — CANONICAL capacity math.
 *
 * Single source of truth for floor-plan seating capacity. This module is pure
 * and framework-agnostic: it has zero React/Next coupling, performs no I/O, and
 * imports nothing from the rest of the portal-app lib tree. It takes plain typed
 * inputs and returns plain typed outputs so it can be unit-tested in isolation.
 */

export type CapacityEventMode = 'reception' | 'sangeet' | 'ceremony';

export type CapacityDanceFloorSize = 'small' | 'medium' | 'large';

export type CapacityStatus = 'neutral' | 'safe' | 'tight' | 'unsafe';

export interface CapacityInput {
  lengthFt: number;
  widthFt: number;
  serviceLossPct: number;
  eventMode: CapacityEventMode;
  hasDanceFloor: boolean;
  danceFloorSize: CapacityDanceFloorSize;
  hasDjPit: boolean;
  hasBand: boolean;
  hasAisleRiser: boolean;
  sqFtPerTable: number;
  desiredGuests: number | null;
}

export interface CapacityResult {
  totalArea: number;
  serviceLossArea: number;
  usableArea: number;
  danceArea: number;
  isDanceClamped: boolean;
  productionDeductions: number;
  seatingArea: number;
  maxTables: number;
  maxCapacity: number;
  status: CapacityStatus;
}

/** Square footage of each dance floor size option. */
export const DANCE_FLOOR_AREA: Readonly<Record<CapacityDanceFloorSize, number>> = {
  small: 400,
  medium: 576,
  large: 900
};

/** Dance floor may not consume more than this fraction of the usable area. */
export const DANCE_FLOOR_MAX_USABLE_FRACTION = 0.2;

/** Sangeet reserves this fraction of the usable area for garba. */
export const SANGEET_GARBA_FRACTION = 0.6;

/** Fixed ceremony stage/altar deduction (square feet). */
export const CEREMONY_BASE_DEDUCTION = 600;

/** Production add-on deductions (square feet). */
export const DJ_PIT_DEDUCTION = 200;
export const BAND_DEDUCTION = 300;
export const AISLE_RISER_DEDUCTION = 500;

/** Square footage assumed per round table for ceremony capacity (chairs only). */
export const CEREMONY_SEAT_SQFT = 12;

/** Floor on per-table square footage, regardless of caller-supplied value. */
export const MIN_SQFT_PER_TABLE = 10;

/** Guests per table for non-ceremony seating. */
export const GUESTS_PER_TABLE = 10;

/** A desired-guest count at or above this fraction of capacity is "tight". */
export const TIGHT_FRACTION = 0.9;

/**
 * Coerce a value to a finite number, falling back to 0 for NaN / Infinity /
 * non-numeric input. Keeps the downstream arithmetic total and prevents NaN
 * from propagating through the result object.
 */
function finiteOr(value: number, fallback = 0): number {
  return Number.isFinite(value) ? value : fallback;
}

/**
 * Resolve the capacity status of a layout against a desired guest count.
 *
 * - desiredGuests null or <= 0 -> 'neutral'
 * - maxCapacity >= desiredGuests -> 'safe'
 * - maxCapacity >= 0.9 * desiredGuests -> 'tight'
 * - otherwise -> 'unsafe'
 */
export function resolveCapacityStatus(maxCapacity: number, desiredGuests: number | null): CapacityStatus {
  const desired = desiredGuests === null ? 0 : finiteOr(desiredGuests, 0);

  if (desired <= 0) {
    return 'neutral';
  }

  if (maxCapacity >= desired) {
    return 'safe';
  }

  if (maxCapacity >= TIGHT_FRACTION * desired) {
    return 'tight';
  }

  return 'unsafe';
}

/**
 * Compute canonical seating capacity for a floor plan.
 *
 * Returns every intermediate value (areas, deductions, table count) alongside
 * the final capacity and status so callers can render the full breakdown.
 */
export function computeCapacity(input: CapacityInput): CapacityResult {
  const lengthFt = finiteOr(input.lengthFt, 0);
  const widthFt = finiteOr(input.widthFt, 0);
  const serviceLossPct = finiteOr(input.serviceLossPct, 0);
  const sqFtPerTable = finiteOr(input.sqFtPerTable, 0);

  const totalArea = lengthFt * widthFt;
  const serviceLossArea = totalArea * (serviceLossPct / 100);
  const usableArea = totalArea - serviceLossArea;

  let danceArea = input.hasDanceFloor ? DANCE_FLOOR_AREA[input.danceFloorSize] : 0;
  let isDanceClamped = false;
  const danceCap = usableArea * DANCE_FLOOR_MAX_USABLE_FRACTION;
  if (danceArea > danceCap) {
    danceArea = danceCap;
    isDanceClamped = true;
  }

  let productionDeductions: number;
  switch (input.eventMode) {
    case 'sangeet':
      // 0.60 of usable area reserved for garba.
      productionDeductions = usableArea * SANGEET_GARBA_FRACTION + (input.hasDjPit ? DJ_PIT_DEDUCTION : 0);
      break;
    case 'ceremony':
      productionDeductions = CEREMONY_BASE_DEDUCTION + (input.hasAisleRiser ? AISLE_RISER_DEDUCTION : 0);
      break;
    case 'reception':
    default:
      productionDeductions =
        danceArea + (input.hasDjPit ? DJ_PIT_DEDUCTION : 0) + (input.hasBand ? BAND_DEDUCTION : 0);
      break;
  }

  const seatingArea = Math.max(0, usableArea - productionDeductions);

  const tableFootprint = Math.max(MIN_SQFT_PER_TABLE, sqFtPerTable);
  const maxTables = Math.floor(seatingArea / tableFootprint);

  const maxCapacity =
    input.eventMode === 'ceremony' ? Math.floor(seatingArea / CEREMONY_SEAT_SQFT) : maxTables * GUESTS_PER_TABLE;

  const status = resolveCapacityStatus(maxCapacity, input.desiredGuests);

  return {
    totalArea,
    serviceLossArea,
    usableArea,
    danceArea,
    isDanceClamped,
    productionDeductions,
    seatingArea,
    maxTables,
    maxCapacity,
    status
  };
}
