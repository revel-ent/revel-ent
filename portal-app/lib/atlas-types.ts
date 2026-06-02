export type AtlasConfidenceLevel = 'measured' | 'venue_doc' | 'sales_claim' | 'estimated';

export type AtlasSeverity = 'info' | 'warning' | 'critical';

export type AtlasStatus =
  | 'active'
  | 'dismissed'
  | 'accepted'
  | 'snoozed'
  | 'expired'
  | 'superseded'
  | 'needs_review'
  | 'skipped'
  | 'suppressed';

export type AtlasTriggerKey =
  | 'outdoor_power_or_curfew'
  | 'capacity_squeeze'
  | 'tight_room_flip'
  | 'rigging_or_ceiling_constraint';

export type AtlasOverrideAction = 'dismiss' | 'accept' | 'snooze' | 'force_on' | 'force_off' | 'expire';

export type AtlasSourceSurface = 'couple_dashboard' | 'planner_dashboard' | 'venue_workspace' | 'live_mode' | 'admin_console';

export type AtlasConstraintDomain = 'power' | 'sound' | 'capacity' | 'timeline' | 'rigging' | 'ceiling' | 'outdoor';

export interface VenueConstraintProfile {
  schemaVersion: 'venue_constraints_v1';
  operational: {
    power: {
      limited: boolean | null;
      dedicatedDjCircuit: boolean | null;
      generatorOnly: boolean | null;
      outdoorAvailability: 'allowed' | 'restricted' | 'unknown';
      notes: string[];
    };
    sound: {
      curfew: {
        type: 'none' | 'soft' | 'strict' | 'unknown';
        localTime: string | null;
        timezone: string | null;
      };
      outdoorAmplifiedMusicAllowed: boolean | null;
      maxDb: number | null;
      notes: string[];
    };
    capacity: {
      marketed: number | null;
      comfortableAcousticMax: number | null;
      overflowRecommendedAbove: number | null;
      notes: string[];
    };
    timeline: {
      roomFlipMin: number | null;
      ceremonyToReceptionMin: number | null;
      preSetSupported: boolean | null;
      notes: string[];
    };
    rigging: {
      allowed: boolean | null;
      maxClearanceFt: number | null;
      notes: string[];
    };
    ceiling: {
      clearanceFt: number | null;
      lowCeilingThresholdFt: number;
      notes: string[];
    };
    outdoor: {
      ceremonyAllowed: boolean | null;
      baraatAllowed: boolean | null;
      baraatRouteNotes: string | null;
      weatherFallbackAvailable: boolean | null;
      notes: string[];
    };
  };
  confidence: {
    overall: AtlasConfidenceLevel;
    fields: Record<AtlasConstraintDomain, AtlasConfidenceLevel>;
  };
  provenance: {
    sourceLinks: Array<{ label: string; url: string }>;
    reviewedBy: string | null;
    reviewedOn: string | null;
    lastEvaluatedAt: string | null;
  };
  derived: {
    activeTriggerKeys: AtlasTriggerKey[];
    fingerprint: string | null;
  };
}

export interface AtlasEvaluation {
  id: string;
  eventId: string;
  venueId: string;
  triggerKey: AtlasTriggerKey;
  groupedRecommendationKey: string;
  fingerprint: string;
  severity: AtlasSeverity;
  confidence: number;
  status: AtlasStatus;
  evidence: Record<string, unknown>;
  recommendationPayload: Record<string, unknown>;
  missingFields: string[];
  evaluatedBySource: 'api' | 'worker' | 'manual_refresh' | 'backfill' | 'dry_run';
  createdAt: string;
  updatedAt: string;
}

export interface AtlasOverride {
  id: string;
  evaluationId: string;
  eventId: string;
  venueId: string;
  triggerKey: AtlasTriggerKey;
  actorUserId: string;
  actorRole: 'admin' | 'couple' | 'planner' | 'vendor' | 'guest' | 'delegate_coordinator' | 'venue_coordinator';
  action: AtlasOverrideAction;
  reasonCode: string | null;
  note: string | null;
  snoozeUntil: string | null;
  expiresAt: string | null;
  sourceSurface: AtlasSourceSurface;
  createdAt: string;
}