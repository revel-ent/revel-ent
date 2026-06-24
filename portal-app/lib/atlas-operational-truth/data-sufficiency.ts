/**
 * Operational-truth framework — Layer 2: Data-sufficiency ("how complete?").
 *
 * Sufficiency measures completeness only — what share of the required fields we
 * actually hold. It is ORTHOGONAL to confidence (Layer 3): it says nothing about
 * how much those values can be trusted. PRESENT fields count in full; VERIFY
 * fields count half (we have a value, but it is flagged for re-confirmation);
 * MISSING and INVALID contribute nothing.
 *
 * Pure, framework-agnostic. No React/Next imports, no other portal-app lib
 * imports, no I/O.
 */

import type { FieldDetection } from './detection';

export const SUFFICIENCY_POLICY_VERSION = 'data-sufficiency@1.0.0';

/** Credit awarded to a VERIFY field. PRESENT = 1.0, MISSING/INVALID = 0. */
export const VERIFY_CREDIT = 0.5;

export interface SufficiencyCounts {
  present: number;
  verify: number;
  missing: number;
  invalid: number;
}

export interface SufficiencyResult {
  score: number;
  credits: number;
  required: number;
  counts: SufficiencyCounts;
  policyVersion: string;
}

/** Tally detections into per-status counts. */
export function countDetections(detections: readonly FieldDetection[]): SufficiencyCounts {
  const counts: SufficiencyCounts = { present: 0, verify: 0, missing: 0, invalid: 0 };

  for (const detection of detections) {
    switch (detection.status) {
      case 'PRESENT':
        counts.present += 1;
        break;
      case 'VERIFY':
        counts.verify += 1;
        break;
      case 'MISSING':
        counts.missing += 1;
        break;
      case 'INVALID':
        counts.invalid += 1;
        break;
    }
  }

  return counts;
}

/**
 * Layer 2 entry point.
 *
 *   credits = (#PRESENT * 1.0) + (#VERIFY * VERIFY_CREDIT)
 *   score   = required > 0 ? credits / required * 100 : 0
 *
 * `required` is the total number of required fields (every detection counts,
 * regardless of status), so an all-MISSING venue scores 0 rather than dividing
 * by zero, and an empty requirement set also scores 0.
 */
export function computeDataSufficiency(detections: readonly FieldDetection[]): SufficiencyResult {
  const counts = countDetections(detections);
  const required = detections.length;
  const credits = counts.present * 1.0 + counts.verify * VERIFY_CREDIT;
  const score = required > 0 ? (credits / required) * 100 : 0;

  return {
    score,
    credits,
    required,
    counts,
    policyVersion: SUFFICIENCY_POLICY_VERSION
  };
}
