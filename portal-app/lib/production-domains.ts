import { type Role } from '@/lib/auth';
import { buildBaseCanonicalTimeline } from '@/lib/canonical-timeline';
import { findEventById, findMembershipByRoleAndEvent } from '@/lib/mock-data';
import { createRoleScopedAdapter, getDomainScope } from '@/lib/role-scoped-adapters';
import { getSupabaseAdminClient } from '@/lib/supabase-server';

export type ProductionRiskSeverity = 'critical' | 'warning';
export type ProductionRiskStatus = 'open' | 'acknowledged';
export type EquipmentStatus = 'pending' | 'ready' | 'blocked' | 'complete';
export type CueStatus = 'pending' | 'ready' | 'in_progress' | 'complete' | 'blocked';

export interface VenueConstraintFact {
  id: string;
  label: string;
  value: string;
  notes: string;
}

export interface VenueRiskFlag {
  id: string;
  title: string;
  detail: string;
  severity: ProductionRiskSeverity;
  status: ProductionRiskStatus;
  mitigationGuidance: string;
  mitigationNote: string | null;
  sourceConstraintIds: string[];
}

export interface VenueIntelligenceRecord {
  eventId: string;
  venue: {
    name: string;
    city: string;
    guestCountEstimate: number;
  };
  constraints: VenueConstraintFact[];
  riskFlags: VenueRiskFlag[];
  summary: {
    openCriticalCount: number;
    openWarningCount: number;
    acknowledgedCount: number;
    totalCount: number;
  };
}

export interface EquipmentManifestItem {
  id: string;
  label: string;
  category: 'audio' | 'lighting' | 'staging' | 'power' | 'backline';
  ownerRole: Role;
  status: EquipmentStatus;
  note: string | null;
  blockedByRiskIds: string[];
  relatedCueIds: string[];
}

export interface EquipmentManifestRecord {
  eventId: string;
  items: EquipmentManifestItem[];
  summary: {
    totalCount: number;
    readyCount: number;
    blockedCount: number;
    completeCount: number;
  };
}

export interface CueBoardItem {
  id: string;
  title: string;
  phase: string;
  startsAtIso: string;
  ownerLabel: string;
  ownerRole: Role;
  status: CueStatus;
  note: string | null;
  requiredEquipmentIds: string[];
  blockedByRiskIds: string[];
  blockingReasons: string[];
  actualAtIso: string | null;
}

export interface RunOfShowRecord {
  eventId: string;
  cues: CueBoardItem[];
  summary: {
    totalCount: number;
    readyCount: number;
    blockedCount: number;
    inProgressCount: number;
    completeCount: number;
  };
}

export interface VenueRiskPatchInput {
  acknowledged?: boolean;
  mitigationNote?: string;
}

export interface EquipmentPatchInput {
  status?: EquipmentStatus;
  ownerRole?: Role;
  note?: string;
}

export interface CuePatchInput {
  status?: CueStatus;
  note?: string;
  actualAtIso?: string | null;
}

export interface ProductionWorkspaceProjection {
  eventId: string;
  domainScope: ReturnType<typeof getDomainScope>;
  hero: {
    state: 'action_required' | 'at_risk' | 'ready_to_execute' | 'in_progress';
    title: string;
    detail: string;
    ctaLabel: string;
    ctaTarget: '#production-venue' | '#production-equipment' | '#production-cues';
  };
  riskSnapshot: {
    critical: VenueRiskFlag[];
    warnings: VenueRiskFlag[];
  };
  venue: VenueIntelligenceRecord;
  equipment: EquipmentManifestRecord;
  cueBoard: RunOfShowRecord;
  nextActions: Array<{
    id: string;
    label: string;
    detail: string;
    target: '#production-venue' | '#production-equipment' | '#production-cues';
  }>;
}

interface DomainRuntimeState {
  riskOverrides: Record<string, { status?: ProductionRiskStatus; mitigationNote?: string | null }>;
  equipmentOverrides: Record<string, { status?: EquipmentStatus; ownerRole?: Role; note?: string | null }>;
  cueOverrides: Record<string, { status?: CueStatus; note?: string | null; actualAtIso?: string | null }>;
}

const runtimeState = new Map<string, DomainRuntimeState>();

function getOrCreateRuntimeState(eventId: string): DomainRuntimeState {
  let state = runtimeState.get(eventId);
  if (!state) {
    state = { riskOverrides: {}, equipmentOverrides: {}, cueOverrides: {} };
    runtimeState.set(eventId, state);
  }
  return state;
}

function createEmptyRuntimeState(): DomainRuntimeState {
  return { riskOverrides: {}, equipmentOverrides: {}, cueOverrides: {} };
}

function normalizeRuntimeState(input: unknown): DomainRuntimeState {
  if (!input || typeof input !== 'object') {
    return createEmptyRuntimeState();
  }

  const value = input as {
    riskOverrides?: DomainRuntimeState['riskOverrides'];
    equipmentOverrides?: DomainRuntimeState['equipmentOverrides'];
    cueOverrides?: DomainRuntimeState['cueOverrides'];
  };

  return {
    riskOverrides: value.riskOverrides && typeof value.riskOverrides === 'object' ? value.riskOverrides : {},
    equipmentOverrides: value.equipmentOverrides && typeof value.equipmentOverrides === 'object' ? value.equipmentOverrides : {},
    cueOverrides: value.cueOverrides && typeof value.cueOverrides === 'object' ? value.cueOverrides : {}
  };
}

export function getOperationalPersistenceMode(): 'durable' | 'degraded' {
  return getSupabaseAdminClient() ? 'durable' : 'degraded';
}

async function loadRuntimeState(eventId: string): Promise<DomainRuntimeState> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return getOrCreateRuntimeState(eventId);
  }

  const { data, error } = await supabase
    .from('atlas_operational_state')
    .select('risk_overrides,equipment_overrides,cue_overrides')
    .eq('event_id', eventId)
    .maybeSingle();

  if (error || !data) {
    return getOrCreateRuntimeState(eventId);
  }

  const state = normalizeRuntimeState({
    riskOverrides: data.risk_overrides,
    equipmentOverrides: data.equipment_overrides,
    cueOverrides: data.cue_overrides
  });

  runtimeState.set(eventId, state);
  return state;
}

async function persistRiskOverride(
  eventId: string,
  riskId: string,
  override: DomainRuntimeState['riskOverrides'][string]
): Promise<void> {
  const state = getOrCreateRuntimeState(eventId);
  state.riskOverrides[riskId] = override;
  runtimeState.set(eventId, state);

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return;
  }

  await supabase.rpc('atlas_operational_state_merge_override', {
    p_event_id: eventId,
    p_domain: 'risk',
    p_override_key: riskId,
    p_override_value: override
  });
}

async function persistEquipmentOverride(
  eventId: string,
  itemId: string,
  override: DomainRuntimeState['equipmentOverrides'][string]
): Promise<void> {
  const state = getOrCreateRuntimeState(eventId);
  state.equipmentOverrides[itemId] = override;
  runtimeState.set(eventId, state);

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return;
  }

  await supabase.rpc('atlas_operational_state_merge_override', {
    p_event_id: eventId,
    p_domain: 'equipment',
    p_override_key: itemId,
    p_override_value: override
  });
}

async function persistCueOverride(
  eventId: string,
  cueId: string,
  override: DomainRuntimeState['cueOverrides'][string]
): Promise<void> {
  const state = getOrCreateRuntimeState(eventId);
  state.cueOverrides[cueId] = override;
  runtimeState.set(eventId, state);

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return;
  }

  await supabase.rpc('atlas_operational_state_merge_override', {
    p_event_id: eventId,
    p_domain: 'cue',
    p_override_key: cueId,
    p_override_value: override
  });
}

function getDefaultVenueConstraints(eventId: string): VenueConstraintFact[] {
  const event = findEventById(eventId);
  const guestCount = event?.guestCountEstimate ?? 250;

  return [
    {
      id: 'constraint-curfew',
      label: 'Noise Curfew',
      value: '22:00 local venue cutoff',
      notes: 'All amplified sets must taper before curfew to avoid penalties.'
    },
    {
      id: 'constraint-loadin',
      label: 'Load-In Window',
      value: '15:00-17:00 dock access',
      notes: 'Shared dock with other events; late arrivals create setup compression.'
    },
    {
      id: 'constraint-power',
      label: 'Power Distribution',
      value: 'Two 20A circuits near stage',
      notes: 'Additional lighting rigs require balanced circuit planning.'
    },
    {
      id: 'constraint-guest-flow',
      label: 'Guest Traffic Flow',
      value: `${guestCount}+ guests across ceremony-cocktail transition`,
      notes: 'Transition corridor narrows at ballroom entrance.'
    }
  ];
}

function buildVenueRisks(constraints: VenueConstraintFact[]): VenueRiskFlag[] {
  return [
    {
      id: 'risk-curfew-compression',
      title: 'Curfew compression risk',
      detail: 'Reception cues may compress if earlier segments run long.',
      severity: 'critical',
      status: 'open',
      mitigationGuidance: 'Pre-stage speeches and tighten transition cues before grand entry.',
      mitigationNote: null,
      sourceConstraintIds: ['constraint-curfew']
    },
    {
      id: 'risk-loadin-collision',
      title: 'Load-in timing collision',
      detail: 'Shared dock window could delay staging for audio and lighting.',
      severity: 'warning',
      status: 'open',
      mitigationGuidance: 'Confirm truck arrival blocks and assign one production runner to dock coordination.',
      mitigationNote: null,
      sourceConstraintIds: ['constraint-loadin']
    },
    {
      id: 'risk-power-headroom',
      title: 'Power headroom is tight',
      detail: 'Expanded lighting scenes could trip available stage-side circuits.',
      severity: 'warning',
      status: 'open',
      mitigationGuidance: 'Finalize lighting program with staggered peaks and verify dedicated power lane.',
      mitigationNote: null,
      sourceConstraintIds: ['constraint-power']
    }
  ];
}

function computeVenueSummary(riskFlags: VenueRiskFlag[]): VenueIntelligenceRecord['summary'] {
  return {
    openCriticalCount: riskFlags.filter((risk) => risk.status === 'open' && risk.severity === 'critical').length,
    openWarningCount: riskFlags.filter((risk) => risk.status === 'open' && risk.severity === 'warning').length,
    acknowledgedCount: riskFlags.filter((risk) => risk.status === 'acknowledged').length,
    totalCount: riskFlags.length
  };
}

function applyRiskOverrides(risks: VenueRiskFlag[], state: DomainRuntimeState): VenueRiskFlag[] {
  return risks.map((risk) => {
    const override = state.riskOverrides[risk.id];
    if (!override) {
      return risk;
    }

    return {
      ...risk,
      status: override.status ?? risk.status,
      mitigationNote: override.mitigationNote === undefined ? risk.mitigationNote : override.mitigationNote
    };
  });
}

export function getVenueIntelligenceState(eventId: string): VenueIntelligenceRecord {
  const state = getOrCreateRuntimeState(eventId);
  const event = findEventById(eventId);
  const constraints = getDefaultVenueConstraints(eventId);
  const riskFlags = applyRiskOverrides(buildVenueRisks(constraints), state);

  return {
    eventId,
    venue: {
      name: event?.venueName ?? 'Venue not set',
      city: event?.city ?? 'Unknown city',
      guestCountEstimate: event?.guestCountEstimate ?? 0
    },
    constraints,
    riskFlags,
    summary: computeVenueSummary(riskFlags)
  };
}

function buildBaseEquipmentManifest(eventId: string): EquipmentManifestItem[] {
  const productionOwner = findMembershipByRoleAndEvent('production', eventId)?.role ?? 'production';
  const djOwner = findMembershipByRoleAndEvent('dj_mc', eventId)?.role ?? 'dj_mc';

  return [
    {
      id: 'equip-audio-line-array',
      label: 'Main line-array and ceremony delay stack',
      category: 'audio',
      ownerRole: djOwner,
      status: 'blocked',
      note: 'Awaiting dock-confirmed unload block.',
      blockedByRiskIds: ['risk-loadin-collision'],
      relatedCueIds: ['cue-baraat-stack', 'cue-grand-entry']
    },
    {
      id: 'equip-lighting-scenes',
      label: 'Reception lighting scenes and uplight zones',
      category: 'lighting',
      ownerRole: productionOwner,
      status: 'blocked',
      note: 'Power balancing still needs final sign-off.',
      blockedByRiskIds: ['risk-power-headroom'],
      relatedCueIds: ['cue-grand-entry', 'cue-first-dance']
    },
    {
      id: 'equip-staging-entry',
      label: 'Grand entry staging and family lineup marks',
      category: 'staging',
      ownerRole: productionOwner,
      status: 'pending',
      note: null,
      blockedByRiskIds: [],
      relatedCueIds: ['cue-grand-entry']
    },
    {
      id: 'equip-wireless-mics',
      label: 'Wireless mic bank for speeches and emcee handoff',
      category: 'backline',
      ownerRole: djOwner,
      status: 'ready',
      note: 'Primary and backup channels coordinated.',
      blockedByRiskIds: [],
      relatedCueIds: ['cue-toasts']
    }
  ];
}

function applyEquipmentDependencies(items: EquipmentManifestItem[], venue: VenueIntelligenceRecord): EquipmentManifestItem[] {
  const openRiskIds = new Set(venue.riskFlags.filter((risk) => risk.status === 'open').map((risk) => risk.id));

  return items.map((item) => {
    const hasOpenBlockingRisk = item.blockedByRiskIds.some((riskId) => openRiskIds.has(riskId));
    if (hasOpenBlockingRisk && item.status !== 'complete') {
      return {
        ...item,
        status: 'blocked'
      };
    }

    return item;
  });
}

function applyEquipmentOverrides(items: EquipmentManifestItem[], state: DomainRuntimeState): EquipmentManifestItem[] {
  return items.map((item) => {
    const override = state.equipmentOverrides[item.id];
    if (!override) {
      return item;
    }

    return {
      ...item,
      status: override.status ?? item.status,
      ownerRole: override.ownerRole ?? item.ownerRole,
      note: override.note === undefined ? item.note : override.note
    };
  });
}

function summarizeEquipment(items: EquipmentManifestItem[]): EquipmentManifestRecord['summary'] {
  return {
    totalCount: items.length,
    readyCount: items.filter((item) => item.status === 'ready').length,
    blockedCount: items.filter((item) => item.status === 'blocked').length,
    completeCount: items.filter((item) => item.status === 'complete').length
  };
}

export function getEquipmentManifestState(eventId: string): EquipmentManifestRecord {
  const state = getOrCreateRuntimeState(eventId);
  const venue = getVenueIntelligenceState(eventId);
  const base = buildBaseEquipmentManifest(eventId);
  const dependencyApplied = applyEquipmentDependencies(base, venue);
  const items = applyEquipmentOverrides(dependencyApplied, state);

  return {
    eventId,
    items,
    summary: summarizeEquipment(items)
  };
}

function mapTimelineCues(eventId: string): CueBoardItem[] {
  const timeline = buildBaseCanonicalTimeline(eventId);

  const pick = (timelineId: string) => timeline.find((item) => item.id === timelineId);

  const baraat = pick('step-baraat');
  const reception = pick('step-reception');
  const ceremony = pick('step-ceremony');
  const cocktail = pick('step-cocktail');

  const defaultStart = new Date().toISOString();

  return [
    {
      id: 'cue-baraat-stack',
      title: 'Baraat route cue stack',
      phase: 'baraat',
      startsAtIso: baraat?.scheduledStartIso ?? defaultStart,
      ownerLabel: 'DJ + Production',
      ownerRole: 'dj_mc',
      status: 'pending',
      note: null,
      requiredEquipmentIds: ['equip-audio-line-array'],
      blockedByRiskIds: ['risk-loadin-collision'],
      blockingReasons: [],
      actualAtIso: null
    },
    {
      id: 'cue-grand-entry',
      title: 'Grand entry light and audio go',
      phase: 'reception',
      startsAtIso: reception?.scheduledStartIso ?? defaultStart,
      ownerLabel: 'Production Lead',
      ownerRole: 'production',
      status: 'pending',
      note: null,
      requiredEquipmentIds: ['equip-audio-line-array', 'equip-lighting-scenes', 'equip-staging-entry'],
      blockedByRiskIds: ['risk-curfew-compression', 'risk-power-headroom'],
      blockingReasons: [],
      actualAtIso: null
    },
    {
      id: 'cue-first-dance',
      title: 'First dance spotlight and fade sequence',
      phase: 'reception',
      startsAtIso: ceremony?.scheduledEndIso ?? defaultStart,
      ownerLabel: 'Lighting + DJ',
      ownerRole: 'production',
      status: 'pending',
      note: null,
      requiredEquipmentIds: ['equip-lighting-scenes'],
      blockedByRiskIds: ['risk-power-headroom'],
      blockingReasons: [],
      actualAtIso: null
    },
    {
      id: 'cue-toasts',
      title: 'Toasts mic handoff cue',
      phase: 'cocktail',
      startsAtIso: cocktail?.scheduledEndIso ?? defaultStart,
      ownerLabel: 'MC Desk',
      ownerRole: 'dj_mc',
      status: 'ready',
      note: null,
      requiredEquipmentIds: ['equip-wireless-mics'],
      blockedByRiskIds: [],
      blockingReasons: [],
      actualAtIso: null
    }
  ];
}

function applyCueDependencies(cues: CueBoardItem[], equipment: EquipmentManifestRecord, venue: VenueIntelligenceRecord): CueBoardItem[] {
  const equipmentById = new Map(equipment.items.map((item) => [item.id, item]));
  const openRiskIds = new Set(venue.riskFlags.filter((risk) => risk.status === 'open').map((risk) => risk.id));

  return cues.map((cue) => {
    const blockingReasons: string[] = [];

    for (const equipmentId of cue.requiredEquipmentIds) {
      const item = equipmentById.get(equipmentId);
      if (!item || (item.status !== 'ready' && item.status !== 'complete')) {
        blockingReasons.push(`Equipment not ready: ${item?.label ?? equipmentId}`);
      }
    }

    for (const riskId of cue.blockedByRiskIds) {
      if (openRiskIds.has(riskId)) {
        const risk = venue.riskFlags.find((item) => item.id === riskId);
        blockingReasons.push(`Open venue risk: ${risk?.title ?? riskId}`);
      }
    }

    const autoStatus: CueStatus = blockingReasons.length > 0 ? 'blocked' : cue.status === 'blocked' ? 'pending' : cue.status;

    return {
      ...cue,
      status: cue.status === 'in_progress' || cue.status === 'complete' ? cue.status : autoStatus,
      blockingReasons
    };
  });
}

function applyCueOverrides(cues: CueBoardItem[], state: DomainRuntimeState): CueBoardItem[] {
  return cues.map((cue) => {
    const override = state.cueOverrides[cue.id];
    if (!override) {
      return cue;
    }

    return {
      ...cue,
      status: override.status ?? cue.status,
      note: override.note === undefined ? cue.note : override.note,
      actualAtIso: override.actualAtIso === undefined ? cue.actualAtIso : override.actualAtIso
    };
  });
}

function summarizeCues(cues: CueBoardItem[]): RunOfShowRecord['summary'] {
  return {
    totalCount: cues.length,
    readyCount: cues.filter((cue) => cue.status === 'ready').length,
    blockedCount: cues.filter((cue) => cue.status === 'blocked').length,
    inProgressCount: cues.filter((cue) => cue.status === 'in_progress').length,
    completeCount: cues.filter((cue) => cue.status === 'complete').length
  };
}

export function getRunOfShowState(eventId: string): RunOfShowRecord {
  const state = getOrCreateRuntimeState(eventId);
  const venue = getVenueIntelligenceState(eventId);
  const equipment = getEquipmentManifestState(eventId);
  const withDependencies = applyCueDependencies(mapTimelineCues(eventId), equipment, venue);
  const cues = applyCueOverrides(withDependencies, state);

  return {
    eventId,
    cues,
    summary: summarizeCues(cues)
  };
}

const projectVenue = createRoleScopedAdapter<VenueIntelligenceRecord, VenueIntelligenceRecord>({
  domain: 'venue_intelligence',
  projectors: {
    full: (input) => input,
    operations: (input) => input,
    venue: (input) => ({
      ...input,
      riskFlags: input.riskFlags.map((risk) => ({
        ...risk,
        mitigationNote: null
      }))
    }),
    assigned: (input) => ({
      ...input,
      riskFlags: input.riskFlags.filter((risk) => risk.severity === 'critical').map((risk) => ({
        ...risk,
        mitigationNote: null
      }))
    }),
    summary: (input) => ({
      ...input,
      constraints: input.constraints.slice(0, 2),
      riskFlags: input.riskFlags
        .filter((risk) => risk.severity === 'critical' || risk.status === 'open')
        .map((risk) => ({ ...risk, mitigationNote: null }))
    })
  }
});

const projectEquipment = createRoleScopedAdapter<EquipmentManifestRecord, EquipmentManifestRecord>({
  domain: 'equipment',
  projectors: {
    full: (input) => input,
    operations: (input) => input,
    venue: (input) => ({
      ...input,
      items: input.items.filter((item) => item.category === 'power' || item.category === 'staging')
    }),
    assigned: (input) => ({
      ...input,
      items: input.items.filter((item) => item.ownerRole === 'vendor' || item.ownerRole === 'dj_mc')
    }),
    summary: (input) => ({
      ...input,
      items: input.items.map((item) => ({ ...item, note: null }))
    })
  }
});

const projectRunOfShow = createRoleScopedAdapter<RunOfShowRecord, RunOfShowRecord>({
  domain: 'run_of_show',
  projectors: {
    full: (input) => input,
    operations: (input) => input,
    venue: (input) => ({
      ...input,
      cues: input.cues.filter((cue) => cue.phase === 'cocktail' || cue.phase === 'reception')
    }),
    assigned: (input) => ({
      ...input,
      cues: input.cues.filter((cue) => cue.ownerRole === 'vendor' || cue.ownerRole === 'dj_mc')
    }),
    summary: (input) => ({
      ...input,
      cues: input.cues.map((cue) => ({ ...cue, note: null, blockingReasons: cue.blockingReasons.slice(0, 1) }))
    })
  }
});

export async function getVenueIntelligenceProjectionForActor(params: { eventId: string; actorRole: Role }) {
  await loadRuntimeState(params.eventId);
  const venue = getVenueIntelligenceState(params.eventId);
  return {
    domainScope: getDomainScope('venue_intelligence', params.actorRole),
    venue: projectVenue(params.actorRole, venue)
  };
}

export async function patchVenueRiskForActor(params: {
  eventId: string;
  actorRole: Role;
  riskId: string;
  patch: VenueRiskPatchInput;
}): Promise<{ forbidden: boolean; risk: VenueRiskFlag | null; summary: VenueIntelligenceRecord['summary'] | null }> {
  const scope = getDomainScope('venue_intelligence', params.actorRole);
  if (scope.access !== 'read_write') {
    return { forbidden: true, risk: null, summary: null };
  }

  await loadRuntimeState(params.eventId);
  const current = getVenueIntelligenceState(params.eventId);
  const target = current.riskFlags.find((risk) => risk.id === params.riskId);
  if (!target) {
    return { forbidden: false, risk: null, summary: null };
  }

  await persistRiskOverride(params.eventId, params.riskId, {
    status: params.patch.acknowledged === undefined ? undefined : params.patch.acknowledged ? 'acknowledged' : 'open',
    mitigationNote: params.patch.mitigationNote === undefined ? undefined : params.patch.mitigationNote.trim() || null
  });

  const updated = getVenueIntelligenceState(params.eventId);
  return {
    forbidden: false,
    risk: updated.riskFlags.find((risk) => risk.id === params.riskId) ?? null,
    summary: updated.summary
  };
}

export async function getEquipmentManifestProjectionForActor(params: { eventId: string; actorRole: Role }) {
  await loadRuntimeState(params.eventId);
  const equipment = getEquipmentManifestState(params.eventId);
  return {
    domainScope: getDomainScope('equipment', params.actorRole),
    equipment: projectEquipment(params.actorRole, equipment)
  };
}

export async function patchEquipmentItemForActor(params: {
  eventId: string;
  actorRole: Role;
  itemId: string;
  patch: EquipmentPatchInput;
}): Promise<{ forbidden: boolean; item: EquipmentManifestItem | null; summary: EquipmentManifestRecord['summary'] | null }> {
  const scope = getDomainScope('equipment', params.actorRole);
  if (scope.access !== 'read_write') {
    return { forbidden: true, item: null, summary: null };
  }

  await loadRuntimeState(params.eventId);
  const current = getEquipmentManifestState(params.eventId);
  const target = current.items.find((item) => item.id === params.itemId);
  if (!target) {
    return { forbidden: false, item: null, summary: null };
  }

  await persistEquipmentOverride(params.eventId, params.itemId, {
    status: params.patch.status,
    ownerRole: params.patch.ownerRole,
    note: params.patch.note === undefined ? undefined : params.patch.note.trim() || null
  });

  const updated = getEquipmentManifestState(params.eventId);
  return {
    forbidden: false,
    item: updated.items.find((item) => item.id === params.itemId) ?? null,
    summary: updated.summary
  };
}

export async function getRunOfShowProjectionForActor(params: { eventId: string; actorRole: Role }) {
  await loadRuntimeState(params.eventId);
  const runOfShow = getRunOfShowState(params.eventId);
  return {
    domainScope: getDomainScope('run_of_show', params.actorRole),
    runOfShow: projectRunOfShow(params.actorRole, runOfShow)
  };
}

export async function patchCueForActor(params: {
  eventId: string;
  actorRole: Role;
  cueId: string;
  patch: CuePatchInput;
}): Promise<{ forbidden: boolean; cue: CueBoardItem | null; summary: RunOfShowRecord['summary'] | null }> {
  const scope = getDomainScope('run_of_show', params.actorRole);
  if (scope.access !== 'read_write') {
    return { forbidden: true, cue: null, summary: null };
  }

  await loadRuntimeState(params.eventId);
  const current = getRunOfShowState(params.eventId);
  const target = current.cues.find((cue) => cue.id === params.cueId);
  if (!target) {
    return { forbidden: false, cue: null, summary: null };
  }

  await persistCueOverride(params.eventId, params.cueId, {
    status: params.patch.status,
    note: params.patch.note === undefined ? undefined : params.patch.note.trim() || null,
    actualAtIso: params.patch.actualAtIso === undefined ? undefined : params.patch.actualAtIso
  });

  const updated = getRunOfShowState(params.eventId);
  return {
    forbidden: false,
    cue: updated.cues.find((cue) => cue.id === params.cueId) ?? null,
    summary: updated.summary
  };
}

function deriveHero(params: {
  venue: VenueIntelligenceRecord;
  equipment: EquipmentManifestRecord;
  runOfShow: RunOfShowRecord;
}): ProductionWorkspaceProjection['hero'] {
  const criticalRisk = params.venue.riskFlags.find((risk) => risk.status === 'open' && risk.severity === 'critical');
  if (criticalRisk) {
    return {
      state: 'at_risk',
      title: 'Critical venue risk needs your decision',
      detail: criticalRisk.detail,
      ctaLabel: 'Resolve Venue Risk',
      ctaTarget: '#production-venue'
    };
  }

  const blockedEquipment = params.equipment.items.find((item) => item.status === 'blocked');
  if (blockedEquipment) {
    return {
      state: 'action_required',
      title: 'Equipment readiness needs attention',
      detail: `${blockedEquipment.label} is blocking upcoming execution cues.`,
      ctaLabel: 'Unblock Equipment',
      ctaTarget: '#production-equipment'
    };
  }

  const inProgressCue = params.runOfShow.cues.find((cue) => cue.status === 'in_progress');
  if (inProgressCue) {
    return {
      state: 'in_progress',
      title: 'Execution is live and in motion',
      detail: `${inProgressCue.title} is currently in progress. Keep handoffs tight and precise.`,
      ctaLabel: 'Open Cue Board',
      ctaTarget: '#production-cues'
    };
  }

  return {
    state: 'ready_to_execute',
    title: 'Production is aligned and ready',
    detail: 'Venue constraints, equipment readiness, and cues are aligned for execution.',
    ctaLabel: 'Review Cue Board',
    ctaTarget: '#production-cues'
  };
}

function deriveNextActions(params: {
  venue: VenueIntelligenceRecord;
  equipment: EquipmentManifestRecord;
  runOfShow: RunOfShowRecord;
}): ProductionWorkspaceProjection['nextActions'] {
  const actions: ProductionWorkspaceProjection['nextActions'] = [];

  const openRisk = params.venue.riskFlags.find((risk) => risk.status === 'open');
  if (openRisk) {
    actions.push({
      id: `action-${openRisk.id}`,
      label: 'Acknowledge open venue risk',
      detail: openRisk.title,
      target: '#production-venue'
    });
  }

  const blockedEquipment = params.equipment.items.find((item) => item.status === 'blocked');
  if (blockedEquipment) {
    actions.push({
      id: `action-${blockedEquipment.id}`,
      label: 'Resolve blocked equipment',
      detail: blockedEquipment.label,
      target: '#production-equipment'
    });
  }

  const blockedCue = params.runOfShow.cues.find((cue) => cue.status === 'blocked');
  if (blockedCue) {
    actions.push({
      id: `action-${blockedCue.id}`,
      label: 'Unblock next cue',
      detail: blockedCue.title,
      target: '#production-cues'
    });
  }

  if (actions.length === 0) {
    actions.push({
      id: 'action-health-check',
      label: 'Run final production confidence check',
      detail: 'Everything is lined up. Perform a final pass before execution.',
      target: '#production-cues'
    });
  }

  return actions;
}

export async function getProductionWorkspaceProjectionForActor(params: {
  eventId: string;
  actorRole: Role;
}): Promise<ProductionWorkspaceProjection> {
  const venueProjection = await getVenueIntelligenceProjectionForActor(params);
  const equipmentProjection = await getEquipmentManifestProjectionForActor(params);
  const runOfShowProjection = await getRunOfShowProjectionForActor(params);

  const venue = venueProjection.venue ?? getVenueIntelligenceState(params.eventId);
  const equipment = equipmentProjection.equipment ?? getEquipmentManifestState(params.eventId);
  const runOfShow = runOfShowProjection.runOfShow ?? getRunOfShowState(params.eventId);

  return {
    eventId: params.eventId,
    domainScope: getDomainScope('run_of_show', params.actorRole),
    hero: deriveHero({ venue, equipment, runOfShow }),
    riskSnapshot: {
      critical: venue.riskFlags.filter((risk) => risk.severity === 'critical' && risk.status === 'open'),
      warnings: venue.riskFlags.filter((risk) => risk.severity === 'warning' && risk.status === 'open')
    },
    venue,
    equipment,
    cueBoard: runOfShow,
    nextActions: deriveNextActions({ venue, equipment, runOfShow })
  };
}

export function __resetProductionDomainsForTests() {
  runtimeState.clear();
}
