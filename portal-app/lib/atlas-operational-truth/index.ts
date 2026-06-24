/**
 * Operational-truth framework barrel.
 *
 * Three pure, deterministic, orthogonal layers, each consuming the previous:
 *
 *   Layer 1 — Detection:        classify each required field
 *                               (PRESENT | MISSING | INVALID | VERIFY).
 *   Layer 2 — Data-sufficiency: "how complete?" — orthogonal to confidence.
 *   Layer 3 — Confidence:       "how trustworthy?" — orthogonal to sufficiency.
 *
 * Completeness (sufficiency) and trustworthiness (confidence) are TWO ORTHOGONAL
 * axes. They are deliberately computed by separate modules and must stay
 * independent.
 *
 * Every module here is framework-agnostic: no React/Next coupling, no other
 * portal-app lib imports, no I/O.
 */

export {
  PLACEHOLDER_TOKENS,
  detectField,
  detectFields,
  type DetectionResult,
  type DetectionStatus,
  type FieldCategory,
  type FieldDetection,
  type Pillar,
  type RequiredFieldDescriptor,
  type VenueTrustSignal
} from './detection';

export {
  SUFFICIENCY_POLICY_VERSION,
  VERIFY_CREDIT,
  computeDataSufficiency,
  countDetections,
  type SufficiencyCounts,
  type SufficiencyResult
} from './data-sufficiency';

export {
  CONFIDENCE_POLICY_VERSION,
  TRUST_TIER_WEIGHTS,
  computeConfidence,
  resolveTrustTier,
  type ConfidenceCounts,
  type ConfidenceInput,
  type ConfidenceResult,
  type TrustTier
} from './confidence';

export {
  assessRoomFlipRisk,
  measureTimeline,
  validateTimeline,
  type RoomFlipRiskInput,
  type RoomFlipRiskResult,
  type TimelineMeasurements,
  type TimelineValidationCheckKey,
  type TimelineValidationFinding,
  type TimelineValidationInput,
  type TimelineValidationItem,
  type TimelineValidationResult,
  type TimelineValidationSeverity,
  type TimelineValidationStatus,
  type VenueTimelineConstraints
} from './timeline-validation';
