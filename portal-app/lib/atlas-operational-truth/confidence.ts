/**
 * Operational-truth framework — Layer 3: Confidence ("how trustworthy?").
 *
 * Confidence is ORTHOGONAL to sufficiency. Sufficiency asks "how complete is the
 * data?"; confidence asks "how much do we trust the data we have?". A venue can
 * be fully complete yet low-trust (all marketing numbers), or sparse yet
 * high-trust (a couple of vendor-verified measurements). These two axes must
 * never be collapsed into one.
 *
 * Pure, framework-agnostic. No React/Next imports, no other portal-app lib
 * imports, no I/O. Also exports `resolveTrustTier`, the shared helper used by
 * both Layer 1 gating and this layer.
 */

export const CONFIDENCE_POLICY_VERSION = 'confidence@1.0.0';

export type TrustTier = 'VendorVerifiedReality' | 'VerifiedData' | 'CalculatedData' | 'MarketingData';

/** Weight applied to a tier's confidence score. */
export const TRUST_TIER_WEIGHTS: Record<TrustTier, number> = {
  VendorVerifiedReality: 1.0,
  VerifiedData: 0.75,
  CalculatedData: 0.5,
  MarketingData: 0.25
};

/**
 * Resolve the trust tier from raw signals. `venueVerification === 'vendor_verified'`
 * always wins (a vendor walked the room) and overrides any marketing source.
 * Otherwise the data source decides the tier; anything unrecognized or absent
 * falls back to MarketingData (least trusted).
 *
 * Shared by Layer 1 (selective trust-gating) and Layer 3 (confidence scoring) so
 * the two layers can never disagree about how trusted a venue is.
 */
export function resolveTrustTier(source?: string, venueVerification?: string): TrustTier {
  if (venueVerification === 'vendor_verified') {
    return 'VendorVerifiedReality';
  }

  if (source === 'partner_provided' || source === 'partially_verified') {
    return 'VerifiedData';
  }

  if (source === 'inferred') {
    return 'CalculatedData';
  }

  return 'MarketingData';
}

/** Counts of detected fields by status, as produced by Layer 1 / Layer 2. */
export interface ConfidenceCounts {
  present: number;
  verify: number;
}

export interface ConfidenceResult {
  tier: TrustTier;
  tierWeight: number;
  score: number;
  policyVersion: string;
}

export interface ConfidenceInput {
  source?: string;
  venueVerification?: string;
  counts: ConfidenceCounts;
}

/**
 * Layer 3 entry point. Confidence is the tier weight scaled by the share of the
 * trusted-or-present data that is fully present (VERIFY fields count half — they
 * are present but explicitly flagged for re-confirmation).
 *
 *   score = tierWeight * ((present * 1 + verify * 0.5) / (present + verify)) * 100
 *
 * When there is nothing present or pending verification, the ratio is undefined,
 * so the score is guarded to 0.
 */
export function computeConfidence(input: ConfidenceInput): ConfidenceResult {
  const tier = resolveTrustTier(input.source, input.venueVerification);
  const tierWeight = TRUST_TIER_WEIGHTS[tier];

  const { present, verify } = input.counts;
  const denominator = present + verify;
  const ratio = denominator === 0 ? 0 : (present * 1 + verify * 0.5) / denominator;
  const score = tierWeight * ratio * 100;

  return {
    tier,
    tierWeight,
    score,
    policyVersion: CONFIDENCE_POLICY_VERSION
  };
}
