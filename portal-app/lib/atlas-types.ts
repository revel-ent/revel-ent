import { type Role } from '@/lib/auth';

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

export type AtlasEventMode = 'revel_managed' | 'independent';

export type AtlasWorkspacePlan = 'essential' | 'pro' | 'premium';

export type AtlasBillingState = 'included' | 'trialing' | 'active' | 'past_due' | 'canceled';

export type AtlasWorkspaceOwnerRole = 'admin' | 'planner' | 'couple';

export type AtlasEntitlementChangeKind =
  | 'mode_set'
  | 'plan_set'
  | 'billing_state_set'
  | 'owner_set'
  | 'entitlement_template_applied'
  | 'manual_override';

export type AtlasEntitlementSourceSurface = 'admin_console' | 'planner_dashboard' | 'couple_dashboard' | 'system_automation';

export type AtlasPaymentRail = 'card' | 'apple_google_pay' | 'ach' | 'zelle' | 'venmo' | 'cash_app';

export type AtlasPaymentProcessingMode = 'stripe' | 'external_manual';

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
  actorRole: Role;
  action: AtlasOverrideAction;
  reasonCode: string | null;
  note: string | null;
  snoozeUntil: string | null;
  expiresAt: string | null;
  sourceSurface: AtlasSourceSurface;
  createdAt: string;
}

export interface AtlasWorkspaceCommercialState {
  eventId: string;
  mode: AtlasEventMode;
  workspacePlan: AtlasWorkspacePlan | null;
  billingState: AtlasBillingState;
  workspaceOwnerUserId: string | null;
  workspaceOwnerRole: AtlasWorkspaceOwnerRole | null;
  entitlementSnapshot: Record<string, unknown>;
}

export interface AtlasEntitlementTemplate {
  templateId: string;
  mode: AtlasEventMode;
  workspacePlan: AtlasWorkspacePlan | null;
  templateKey: string;
  entitlementPayload: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AtlasEntitlementAuditEntry {
  auditId: string;
  eventId: string;
  actorUserId: string;
  actorRole: Role;
  changeKind: AtlasEntitlementChangeKind;
  reasonCode: string | null;
  note: string | null;
  previousState: Record<string, unknown>;
  nextState: Record<string, unknown>;
  sourceSurface: AtlasEntitlementSourceSurface;
  createdAt: string;
}

export interface AtlasWorkspacePaymentSettings {
  eventId: string;
  allowCard: boolean;
  allowAppleGooglePay: boolean;
  allowAch: boolean;
  allowZelle: boolean;
  allowVenmo: boolean;
  allowCashApp: boolean;
  acceptChecks: false;
  stripeAccountId: string | null;
  zelleHandle: string | null;
  venmoHandle: string | null;
  cashAppHandle: string | null;
  manualPaymentInstructions: string | null;
  updatedAt: string | null;
}