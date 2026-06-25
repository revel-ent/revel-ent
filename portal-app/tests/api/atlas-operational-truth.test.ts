import { describe, expect, it } from 'vitest';

import {
  CONFIDENCE_POLICY_VERSION,
  PLACEHOLDER_TOKENS,
  SUFFICIENCY_POLICY_VERSION,
  TRUST_TIER_WEIGHTS,
  VERIFY_CREDIT,
  computeConfidence,
  computeDataSufficiency,
  countDetections,
  detectField,
  detectFields,
  resolveTrustTier,
  type FieldDetection,
  type RequiredFieldDescriptor,
  type VenueTrustSignal
} from '@/lib/atlas-operational-truth';

/**
 * Build a required-field descriptor with sensible defaults so individual tests
 * only specify what they care about.
 */
function field(overrides: Partial<RequiredFieldDescriptor> = {}): RequiredFieldDescriptor {
  return {
    key: 'ceilingClearanceFt',
    category: 'Physical',
    pillar: 'RiggingHeight',
    operationallyMaterial: false,
    value: 24,
    ...overrides
  };
}

const VENDOR_VERIFIED: VenueTrustSignal = { venueVerification: 'vendor_verified' };
const MARKETING: VenueTrustSignal = {};

describe('Layer 1 — detection', () => {
  describe('presence and placeholder tokens', () => {
    it('classifies a real value as PRESENT', () => {
      const result = detectFields([field({ value: 24 })], VENDOR_VERIFIED);
      expect(result.fields[0].status).toBe('PRESENT');
    });

    it('treats null and undefined as MISSING', () => {
      const result = detectFields(
        [field({ key: 'a', value: null }), field({ key: 'b', value: undefined })],
        VENDOR_VERIFIED
      );
      expect(result.fields.map((f) => f.status)).toEqual(['MISSING', 'MISSING']);
    });

    it('treats empty and whitespace-only strings as MISSING', () => {
      const result = detectFields(
        [field({ key: 'a', value: '' }), field({ key: 'b', value: '   ' })],
        VENDOR_VERIFIED
      );
      expect(result.fields.map((f) => f.status)).toEqual(['MISSING', 'MISSING']);
    });

    it('treats every placeholder token as MISSING (case-insensitive, trimmed)', () => {
      // Exercise the documented contract directly, plus mixed case / surrounding whitespace.
      const variants = ['unknown', 'verify', 'tbd', 'tba', '?', 'UNKNOWN', 'Tbd', '  TBA  ', ' ? '];
      const descriptors = variants.map((value, index) => field({ key: `f${index}`, value }));
      const result = detectFields(descriptors, VENDOR_VERIFIED);
      expect(result.fields.every((f) => f.status === 'MISSING')).toBe(true);
    });

    it('exports the exact placeholder token set', () => {
      expect([...PLACEHOLDER_TOKENS]).toEqual(['unknown', 'verify', 'tbd', 'tba', '?']);
    });

    it('does not treat a value that merely contains a token as a placeholder', () => {
      const result = detectFields([field({ value: 'unknown-but-actually-documented' })], VENDOR_VERIFIED);
      expect(result.fields[0].status).toBe('PRESENT');
    });

    it('treats falsy non-placeholder values (0, false) as PRESENT', () => {
      const result = detectFields(
        [field({ key: 'zero', value: 0 }), field({ key: 'flag', value: false })],
        VENDOR_VERIFIED
      );
      expect(result.fields.map((f) => f.status)).toEqual(['PRESENT', 'PRESENT']);
    });
  });

  describe('INVALID via validator', () => {
    it('downgrades a present value that fails its validator to INVALID', () => {
      const result = detectFields(
        [field({ value: -5, validate: (v) => typeof v === 'number' && v > 0 })],
        VENDOR_VERIFIED
      );
      expect(result.fields[0].status).toBe('INVALID');
    });

    it('keeps a present value that passes its validator as PRESENT', () => {
      const result = detectFields(
        [field({ value: 24, validate: (v) => typeof v === 'number' && v > 0 })],
        VENDOR_VERIFIED
      );
      expect(result.fields[0].status).toBe('PRESENT');
    });

    it('never runs the validator for absent/placeholder values (MISSING wins)', () => {
      let called = false;
      const result = detectFields(
        [
          field({
            value: 'tbd',
            validate: () => {
              called = true;
              return true;
            }
          })
        ],
        VENDOR_VERIFIED
      );
      expect(result.fields[0].status).toBe('MISSING');
      expect(called).toBe(false);
    });

    it('lets INVALID take precedence over trust-gating for material low-trust fields', () => {
      // Present + material + low trust would normally be VERIFY, but a failing
      // validator means the value is unusable regardless of trust.
      const result = detectFields(
        [field({ operationallyMaterial: true, value: 'oops', validate: () => false })],
        MARKETING
      );
      expect(result.fields[0].status).toBe('INVALID');
    });
  });

  describe('selective trust-gating', () => {
    const material = field({ key: 'capacityMax', operationallyMaterial: true, value: 400 });
    const immaterial = field({ key: 'venueName', operationallyMaterial: false, value: 'Grand Hall' });

    it('elevates PRESENT -> VERIFY for material fields when trust is low (MarketingData)', () => {
      const result = detectFields([material], MARKETING);
      expect(result.tier).toBe('MarketingData');
      expect(result.fields[0].status).toBe('VERIFY');
    });

    it('does not elevate immaterial fields even under low trust', () => {
      const result = detectFields([immaterial], MARKETING);
      expect(result.fields[0].status).toBe('PRESENT');
    });

    it('does not elevate material fields when trust is high (vendor-verified)', () => {
      const result = detectFields([material], VENDOR_VERIFIED);
      expect(result.tier).toBe('VendorVerifiedReality');
      expect(result.fields[0].status).toBe('PRESENT');
    });

    it('does not elevate material fields for VerifiedData or CalculatedData tiers', () => {
      const verified = detectFields([material], { source: 'partner_provided' });
      const calculated = detectFields([material], { source: 'inferred' });
      expect(verified.fields[0].status).toBe('PRESENT');
      expect(calculated.fields[0].status).toBe('PRESENT');
    });

    it('elevation never resurrects a MISSING material field', () => {
      const result = detectFields(
        [field({ operationallyMaterial: true, value: 'unknown' })],
        MARKETING
      );
      expect(result.fields[0].status).toBe('MISSING');
    });
  });

  it('echoes the original descriptor and key on each detection', () => {
    const descriptor = field({ key: 'riggingMaxFt', value: 18 });
    const result = detectFields([descriptor], VENDOR_VERIFIED);
    expect(result.fields[0].key).toBe('riggingMaxFt');
    expect(result.fields[0].descriptor).toBe(descriptor);
  });

  it('detectField classifies against a pre-resolved tier without re-resolving trust', () => {
    const descriptor = field({ operationallyMaterial: true, value: 400 });
    expect(detectField(descriptor, 'MarketingData').status).toBe('VERIFY');
    expect(detectField(descriptor, 'VendorVerifiedReality').status).toBe('PRESENT');
  });
});

describe('Layer 2 — data-sufficiency', () => {
  function detection(status: FieldDetection['status'], key: string): FieldDetection {
    return { key, status, descriptor: field({ key, value: status === 'MISSING' ? null : 1 }) };
  }

  it('exports the policy version and VERIFY_CREDIT constant', () => {
    expect(typeof SUFFICIENCY_POLICY_VERSION).toBe('string');
    expect(SUFFICIENCY_POLICY_VERSION.length).toBeGreaterThan(0);
    expect(VERIFY_CREDIT).toBe(0.5);
  });

  it('counts detections by status', () => {
    const counts = countDetections([
      detection('PRESENT', 'a'),
      detection('PRESENT', 'b'),
      detection('VERIFY', 'c'),
      detection('MISSING', 'd'),
      detection('INVALID', 'e')
    ]);
    expect(counts).toEqual({ present: 2, verify: 1, missing: 1, invalid: 1 });
  });

  it('awards full credit to PRESENT, half to VERIFY, none to MISSING/INVALID', () => {
    // 2 present (2.0) + 2 verify (1.0) + 1 missing (0) + 1 invalid (0) = 3 credits over 6 required.
    const result = computeDataSufficiency([
      detection('PRESENT', 'a'),
      detection('PRESENT', 'b'),
      detection('VERIFY', 'c'),
      detection('VERIFY', 'd'),
      detection('MISSING', 'e'),
      detection('INVALID', 'f')
    ]);
    expect(result.credits).toBe(3);
    expect(result.required).toBe(6);
    expect(result.score).toBe(50);
    expect(result.counts).toEqual({ present: 2, verify: 2, missing: 1, invalid: 1 });
    expect(result.policyVersion).toBe(SUFFICIENCY_POLICY_VERSION);
  });

  it('scores an all-PRESENT venue at 100', () => {
    const result = computeDataSufficiency([detection('PRESENT', 'a'), detection('PRESENT', 'b')]);
    expect(result.score).toBe(100);
  });

  it('scores an all-VERIFY venue at 50 (half credit each)', () => {
    const result = computeDataSufficiency([detection('VERIFY', 'a'), detection('VERIFY', 'b')]);
    expect(result.credits).toBe(1);
    expect(result.score).toBe(50);
  });

  describe('divide-by-zero guards', () => {
    it('returns score 0 for an empty requirement set (no divide-by-zero)', () => {
      const result = computeDataSufficiency([]);
      expect(result.required).toBe(0);
      expect(result.credits).toBe(0);
      expect(result.score).toBe(0);
      expect(result.counts).toEqual({ present: 0, verify: 0, missing: 0, invalid: 0 });
    });

    it('returns score 0 (not NaN) when every field is MISSING/INVALID', () => {
      const result = computeDataSufficiency([detection('MISSING', 'a'), detection('INVALID', 'b')]);
      expect(result.score).toBe(0);
      expect(Number.isNaN(result.score)).toBe(false);
    });
  });
});

describe('Layer 3 — confidence', () => {
  describe('resolveTrustTier', () => {
    it('returns VendorVerifiedReality (weight 1.00) for vendor_verified', () => {
      expect(resolveTrustTier(undefined, 'vendor_verified')).toBe('VendorVerifiedReality');
      expect(TRUST_TIER_WEIGHTS.VendorVerifiedReality).toBe(1.0);
    });

    it('returns VerifiedData (weight 0.75) for partner_provided or partially_verified', () => {
      expect(resolveTrustTier('partner_provided')).toBe('VerifiedData');
      expect(resolveTrustTier('partially_verified')).toBe('VerifiedData');
      expect(TRUST_TIER_WEIGHTS.VerifiedData).toBe(0.75);
    });

    it('returns CalculatedData (weight 0.50) for inferred', () => {
      expect(resolveTrustTier('inferred')).toBe('CalculatedData');
      expect(TRUST_TIER_WEIGHTS.CalculatedData).toBe(0.5);
    });

    it('returns MarketingData (weight 0.25) by default / when unverified', () => {
      expect(resolveTrustTier()).toBe('MarketingData');
      expect(resolveTrustTier('something_unrecognized')).toBe('MarketingData');
      expect(TRUST_TIER_WEIGHTS.MarketingData).toBe(0.25);
    });

    it('lets vendor_verified override an otherwise-marketing source', () => {
      expect(resolveTrustTier('something_unrecognized', 'vendor_verified')).toBe('VendorVerifiedReality');
      // Even an explicit inferred source is overridden by a vendor walk-through.
      expect(resolveTrustTier('inferred', 'vendor_verified')).toBe('VendorVerifiedReality');
    });
  });

  describe('computeConfidence scoring', () => {
    it('scales tier weight by the present/verify mix (all four tiers)', () => {
      const counts = { present: 3, verify: 1 }; // ratio = (3 + 0.5) / 4 = 0.875
      expect(computeConfidence({ venueVerification: 'vendor_verified', counts }).score).toBeCloseTo(87.5);
      expect(computeConfidence({ source: 'partner_provided', counts }).score).toBeCloseTo(65.625);
      expect(computeConfidence({ source: 'inferred', counts }).score).toBeCloseTo(43.75);
      expect(computeConfidence({ counts }).score).toBeCloseTo(21.875);
    });

    it('reports the resolved tier, its weight, and the policy version', () => {
      const result = computeConfidence({ source: 'inferred', counts: { present: 2, verify: 0 } });
      expect(result.tier).toBe('CalculatedData');
      expect(result.tierWeight).toBe(0.5);
      expect(result.score).toBe(50);
      expect(result.policyVersion).toBe(CONFIDENCE_POLICY_VERSION);
    });

    it('yields the full tier weight (×100) when all retained fields are PRESENT', () => {
      const result = computeConfidence({ venueVerification: 'vendor_verified', counts: { present: 4, verify: 0 } });
      expect(result.score).toBe(100);
    });

    it('halves the contribution of VERIFY fields', () => {
      // All-verify under vendor-verified: ratio = 0.5, weight 1.0 => 50.
      const result = computeConfidence({ venueVerification: 'vendor_verified', counts: { present: 0, verify: 2 } });
      expect(result.score).toBe(50);
    });

    it('guards (present + verify) === 0 to a score of 0 (not NaN)', () => {
      const result = computeConfidence({ venueVerification: 'vendor_verified', counts: { present: 0, verify: 0 } });
      expect(result.score).toBe(0);
      expect(Number.isNaN(result.score)).toBe(false);
    });
  });
});

describe('orthogonality — sufficiency and confidence are independent axes', () => {
  // Same required fields, evaluated under different trust signals. The trick:
  // a material field that is PRESENT under high trust becomes VERIFY under low
  // trust, so we keep the field set fully present-or-verify to isolate the axes.
  const requiredFields: RequiredFieldDescriptor[] = [
    field({ key: 'capacityMax', operationallyMaterial: true, value: 400 }),
    field({ key: 'ceilingClearanceFt', operationallyMaterial: true, value: 24 }),
    field({ key: 'riggingMaxFt', operationallyMaterial: true, value: 18 }),
    field({ key: 'powerNotes', operationallyMaterial: false, value: 'dedicated DJ circuit' })
  ];

  function runFramework(trust: VenueTrustSignal) {
    const detection = detectFields(requiredFields, trust);
    const sufficiency = computeDataSufficiency(detection.fields);
    const confidence = computeConfidence({
      source: trust.source,
      venueVerification: trust.venueVerification,
      counts: { present: sufficiency.counts.present, verify: sufficiency.counts.verify }
    });
    return { detection, sufficiency, confidence };
  }

  it('same fields under different trust -> different confidence, same overall completeness', () => {
    const trusted = runFramework(VENDOR_VERIFIED);
    const untrusted = runFramework(MARKETING);

    // Confidence axis differs sharply by trust.
    expect(trusted.confidence.tier).toBe('VendorVerifiedReality');
    expect(untrusted.confidence.tier).toBe('MarketingData');
    expect(trusted.confidence.score).toBeGreaterThan(untrusted.confidence.score);

    // Completeness axis: every field is either PRESENT (trusted) or VERIFY
    // (untrusted), so nothing is MISSING/INVALID either way.
    expect(trusted.sufficiency.counts.missing).toBe(0);
    expect(trusted.sufficiency.counts.invalid).toBe(0);
    expect(untrusted.sufficiency.counts.missing).toBe(0);
    expect(untrusted.sufficiency.counts.invalid).toBe(0);
    expect(trusted.sufficiency.required).toBe(untrusted.sufficiency.required);
  });

  it('completeness can be perfect while confidence is low, and vice versa', () => {
    // High completeness, low confidence: all fields immaterial + present, but unverified source.
    const completeButUntrusted = [
      field({ key: 'a', operationallyMaterial: false, value: 'x' }),
      field({ key: 'b', operationallyMaterial: false, value: 'y' })
    ];
    const a = (() => {
      const d = detectFields(completeButUntrusted, MARKETING);
      const s = computeDataSufficiency(d.fields);
      const c = computeConfidence({ counts: { present: s.counts.present, verify: s.counts.verify } });
      return { s, c };
    })();
    expect(a.s.score).toBe(100); // fully complete
    expect(a.c.score).toBe(25); // weight 0.25, all present => 0.25 * 1 * 100

    // Sparse but fully trusted: one present vendor-verified field, several missing.
    const sparseButTrusted = [
      field({ key: 'a', value: 1 }),
      field({ key: 'b', value: null }),
      field({ key: 'c', value: null }),
      field({ key: 'd', value: null })
    ];
    const b = (() => {
      const d = detectFields(sparseButTrusted, VENDOR_VERIFIED);
      const s = computeDataSufficiency(d.fields);
      const c = computeConfidence({
        venueVerification: 'vendor_verified',
        counts: { present: s.counts.present, verify: s.counts.verify }
      });
      return { s, c };
    })();
    expect(b.s.score).toBe(25); // only 1 of 4 present
    expect(b.c.score).toBe(100); // the data we DO have is fully trusted
  });
});
