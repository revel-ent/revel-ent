/**
 * Operational-truth framework — Layer 1: Detection.
 *
 * Pure, framework-agnostic field classification. Given the required fields for a
 * venue and the venue's trust signal, classify each field as PRESENT, MISSING,
 * INVALID, or VERIFY. This is the first of three orthogonal layers and feeds
 * both data-sufficiency (Layer 2) and confidence (Layer 3).
 *
 * No React/Next imports, no other portal-app lib imports, no I/O.
 */

import { type TrustTier, resolveTrustTier } from './confidence';

export type FieldCategory =
  | 'Physical'
  | 'Operational'
  | 'Infrastructure'
  | 'Policy'
  | 'ExperienceIntelligence';

export type Pillar =
  | 'SpatialCapacity'
  | 'RiggingHeight'
  | 'LoadInLogistics'
  | 'PolicyCompliance'
  | 'ProductionInfrastructure'
  | 'CrossCutting';

export type DetectionStatus = 'PRESENT' | 'MISSING' | 'INVALID' | 'VERIFY';

/**
 * Placeholder tokens that read as "no real value here". Compared
 * case-insensitively against the trimmed string form of a field value.
 */
export const PLACEHOLDER_TOKENS: readonly string[] = ['unknown', 'verify', 'tbd', 'tba', '?'];

/**
 * Trust tiers whose trust signal is too low to take an operationally-material
 * marketing number at face value. PRESENT material fields are elevated to VERIFY
 * for these tiers (selective trust-gating).
 */
const LOW_TRUST_TIERS: readonly TrustTier[] = ['MarketingData'];

/**
 * Descriptor for a single required field. `validate` is optional; when supplied
 * and the value is otherwise present, a falsy result downgrades to INVALID.
 */
export interface RequiredFieldDescriptor {
  key: string;
  category: FieldCategory;
  pillar: Pillar;
  /**
   * When true, this field carries operational weight (a measured number a
   * production team would rely on). Material fields are trust-gated: a marketing
   * value is surfaced as VERIFY rather than trusted as if measured.
   */
  operationallyMaterial: boolean;
  value: unknown;
  /** Optional per-field validator. Truthy => valid, falsy => INVALID. */
  validate?: (value: unknown) => boolean;
}

/** Inputs that resolve the venue's trust tier (shared with Layer 3). */
export interface VenueTrustSignal {
  source?: string;
  venueVerification?: string;
}

export interface FieldDetection {
  key: string;
  status: DetectionStatus;
  descriptor: RequiredFieldDescriptor;
}

export interface DetectionResult {
  tier: TrustTier;
  fields: FieldDetection[];
}

/**
 * Whether a raw value should be treated as "not present". Null/undefined are
 * absent; strings that are empty or a placeholder token (trimmed,
 * case-insensitive) are absent. All other values count as present.
 */
function isAbsent(value: unknown): boolean {
  if (value === null || value === undefined) {
    return true;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === '') {
      return true;
    }
    return PLACEHOLDER_TOKENS.includes(normalized);
  }

  return false;
}

function isLowTrust(tier: TrustTier): boolean {
  return LOW_TRUST_TIERS.includes(tier);
}

/**
 * Classify a single descriptor against an already-resolved trust tier.
 *
 * Order of checks:
 *   1. Absent / placeholder -> MISSING (validator is not consulted).
 *   2. Present but validator returns falsy -> INVALID.
 *   3. Present, valid, but operationallyMaterial under a low-trust tier -> VERIFY.
 *   4. Otherwise -> PRESENT.
 */
export function detectField(descriptor: RequiredFieldDescriptor, tier: TrustTier): FieldDetection {
  let status: DetectionStatus;

  if (isAbsent(descriptor.value)) {
    status = 'MISSING';
  } else if (descriptor.validate && !descriptor.validate(descriptor.value)) {
    status = 'INVALID';
  } else if (descriptor.operationallyMaterial && isLowTrust(tier)) {
    status = 'VERIFY';
  } else {
    status = 'PRESENT';
  }

  return { key: descriptor.key, status, descriptor };
}

/**
 * Layer 1 entry point. Resolve the trust tier once, then classify every
 * required field. Returns the resolved tier alongside per-field detections so
 * downstream layers do not need to re-resolve trust.
 */
export function detectFields(
  fields: readonly RequiredFieldDescriptor[],
  trust: VenueTrustSignal
): DetectionResult {
  const tier = resolveTrustTier(trust.source, trust.venueVerification);

  return {
    tier,
    fields: fields.map((descriptor) => detectField(descriptor, tier))
  };
}
