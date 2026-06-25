import { type ClientEventPlan, type PaymentMilestone, type PlanningTodo } from '@/lib/mock-client-milestones';
import { getClientPlanForEvent } from '@/lib/client-plans';
import { createRoleScopedAdapter, getDomainScope } from '@/lib/role-scoped-adapters';
import { type Role } from '@/lib/auth';
import { getSupabaseAdminClient } from '@/lib/supabase-server';

export const MUSIC_GENRE_KEYS = [
  'bhangraNewer',
  'bhangraOldSchool',
  'bollywoodNewer',
  'bollywoodOlder',
  'oldSchoolHipHop',
  'currentHipHopTop40',
  'house',
  'latin',
  'other'
] as const;

export type MusicGenreKey = (typeof MUSIC_GENRE_KEYS)[number];
export type ApprovalStatus = 'locked' | 'pending' | 'complete';
export type MusicWorkflowStatus = 'locked' | 'ready' | 'completed';

export interface MusicQuestionnaireInput {
  genreMix: Record<MusicGenreKey, number>;
  otherGenres: string;
  danceOffNotes: string;
  additionalNotes: string;
}

export interface MusicProfileCard {
  title: string;
  summary: string;
  genreSplit: string;
  danceOffPlan: string;
  otherNotes: string;
  additionalNotes: string;
  plannerStatus: 'Complete' | 'Pending';
  generatedAt: string;
}

export interface MusicDomainRecord {
  eventId: string;
  status: MusicWorkflowStatus;
  unlockedByDeposit: boolean;
  questionnaire: MusicQuestionnaireInput | null;
  profile: MusicProfileCard | null;
  submittedAt: string | null;
}

export interface ChecklistItemProjection extends PlanningTodo {
  locked: boolean;
  unlockReason: string | null;
  actionLabel: string | null;
  workflowKey: 'music' | null;
  readOnly: boolean;
}

export interface ChecklistProjection {
  payments: PaymentMilestone[];
  checklist: ChecklistItemProjection[];
  summary: {
    completedChecklistCount: number;
    totalChecklistCount: number;
    paidAmount: number;
    remainingAmount: number;
    depositConfirmed: boolean;
    musicStatus: MusicWorkflowStatus;
  };
}

export interface ApprovalItem {
  id: string;
  title: string;
  description: string;
  status: ApprovalStatus;
  dueDate: string | null;
  sourceDomain: 'music' | 'planning';
  readOnly: boolean;
}

export interface ApprovalProjection {
  approvals: ApprovalItem[];
  summary: {
    completeCount: number;
    totalCount: number;
    musicStatus: ApprovalStatus;
  };
}

interface MusicSubmissionState {
  questionnaire: MusicQuestionnaireInput;
  profile: MusicProfileCard;
  submittedAt: string;
}

interface DomainRuntimeState {
  paymentOverrides: Record<string, Pick<PaymentMilestone, 'status' | 'completedAt'>>;
  todoOverrides: Record<string, Pick<PlanningTodo, 'status' | 'completedAt' | 'badgeLabel'>>;
  musicSubmission: MusicSubmissionState | null;
}

// In-memory cache of the per-event override state. When Supabase is configured it is hydrated from
// atlas_couple_workspace_state on every read and written through on every mutation; without Supabase
// (local dev, tests) it behaves as a process-lifetime store, matching prior behavior exactly.
const runtimeState = new Map<string, DomainRuntimeState>();

function createEmptyRuntimeState(): DomainRuntimeState {
  return { paymentOverrides: {}, todoOverrides: {}, musicSubmission: null };
}

function getOrCreateRuntimeState(eventId: string): DomainRuntimeState {
  let state = runtimeState.get(eventId);
  if (!state) {
    state = createEmptyRuntimeState();
    runtimeState.set(eventId, state);
  }

  return state;
}

function normalizeRuntimeState(input: {
  paymentOverrides?: unknown;
  todoOverrides?: unknown;
  musicSubmission?: unknown;
}): DomainRuntimeState {
  const paymentOverrides =
    input.paymentOverrides && typeof input.paymentOverrides === 'object'
      ? (input.paymentOverrides as DomainRuntimeState['paymentOverrides'])
      : {};
  const todoOverrides =
    input.todoOverrides && typeof input.todoOverrides === 'object'
      ? (input.todoOverrides as DomainRuntimeState['todoOverrides'])
      : {};
  const musicSubmission =
    input.musicSubmission && typeof input.musicSubmission === 'object'
      ? (input.musicSubmission as MusicSubmissionState)
      : null;

  return { paymentOverrides, todoOverrides, musicSubmission };
}

export function getCouplePersistenceMode(): 'durable' | 'degraded' {
  return getSupabaseAdminClient() ? 'durable' : 'degraded';
}

// Hydrate the in-memory cache for an event from Supabase. Falls back to the in-memory store when
// Supabase is unavailable or the row does not exist yet.
async function loadRuntimeState(eventId: string): Promise<DomainRuntimeState> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return getOrCreateRuntimeState(eventId);
  }

  const { data, error } = await supabase
    .from('atlas_couple_workspace_state')
    .select('payment_overrides,todo_overrides,music_submission')
    .eq('event_id', eventId)
    .maybeSingle();

  if (error || !data) {
    return getOrCreateRuntimeState(eventId);
  }

  const state = normalizeRuntimeState({
    paymentOverrides: data.payment_overrides,
    todoOverrides: data.todo_overrides,
    musicSubmission: data.music_submission
  });

  runtimeState.set(eventId, state);
  return state;
}

async function requirePlan(eventId: string): Promise<ClientEventPlan> {
  const plan = await getClientPlanForEvent(eventId);
  if (!plan) {
    throw new Error(`Missing client plan for event ${eventId}`);
  }

  return plan;
}

// Hydrate both the durable plan and the override state for an event.
async function loadCouple(eventId: string): Promise<{ plan: ClientEventPlan; state: DomainRuntimeState }> {
  const [plan, state] = await Promise.all([requirePlan(eventId), loadRuntimeState(eventId)]);
  return { plan, state };
}

async function persistPaymentOverride(
  eventId: string,
  milestoneId: string,
  override: DomainRuntimeState['paymentOverrides'][string]
): Promise<void> {
  const state = getOrCreateRuntimeState(eventId);
  state.paymentOverrides[milestoneId] = override;
  runtimeState.set(eventId, state);

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return;
  }

  await supabase.rpc('atlas_couple_workspace_state_merge', {
    p_event_id: eventId,
    p_domain: 'payment',
    p_override_key: milestoneId,
    p_override_value: override
  });
}

async function persistTodoOverride(
  eventId: string,
  itemId: string,
  override: DomainRuntimeState['todoOverrides'][string]
): Promise<void> {
  const state = getOrCreateRuntimeState(eventId);
  state.todoOverrides[itemId] = override;
  runtimeState.set(eventId, state);

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return;
  }

  await supabase.rpc('atlas_couple_workspace_state_merge', {
    p_event_id: eventId,
    p_domain: 'todo',
    p_override_key: itemId,
    p_override_value: override
  });
}

async function persistMusicSubmission(eventId: string, submission: MusicSubmissionState): Promise<void> {
  const state = getOrCreateRuntimeState(eventId);
  state.musicSubmission = submission;
  runtimeState.set(eventId, state);

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return;
  }

  await supabase.rpc('atlas_couple_workspace_state_merge', {
    p_event_id: eventId,
    p_domain: 'music',
    p_override_key: 'submission',
    p_override_value: submission as unknown as Record<string, unknown>
  });
}

function cloneMilestone(base: PaymentMilestone, override?: Pick<PaymentMilestone, 'status' | 'completedAt'>): PaymentMilestone {
  return {
    ...base,
    ...(override ?? {})
  };
}

function cloneTodo(base: PlanningTodo, override?: Pick<PlanningTodo, 'status' | 'completedAt' | 'badgeLabel'>): PlanningTodo {
  return {
    ...base,
    ...(override ?? {})
  };
}

// Sync builder over an already-resolved plan + hydrated override state.
function buildChecklistState(plan: ClientEventPlan, state: DomainRuntimeState): ChecklistProjection {
  const payments = plan.paymentMilestones.map((item) => cloneMilestone(item, state.paymentOverrides[item.id]));
  const paidAmount = payments.filter((item) => item.status === 'completed').reduce((sum, item) => sum + item.amount, 0);
  const remainingAmount = plan.totalContractValue - paidAmount;
  const depositConfirmed = payments.some((item) => item.percent === 30 && item.status === 'completed');

  const musicState = buildMusicState(plan, state);
  const checklist = plan.planningTodos.map((item) => {
    const override = state.todoOverrides[item.id];
    const todo = cloneTodo(item, override);

    if (item.id === 'todo-music-questionnaire') {
      const completed = musicState.status === 'completed';
      return {
        ...todo,
        title: 'Complete Music Questionnaire',
        detail: completed
          ? 'Your music questionnaire is complete and has been shared with your DJ and planner.'
          : 'Complete your music questionnaire once your booking deposit is confirmed so your DJ and planner can begin shaping your set.',
        status: completed ? 'completed' : depositConfirmed ? 'pending' : 'pending',
        completedAt: completed ? musicState.submittedAt?.slice(0, 10) : undefined,
        badgeLabel: completed ? 'Done' : depositConfirmed ? 'Action Required' : 'Deposit Required',
        locked: !depositConfirmed,
        unlockReason: depositConfirmed ? null : 'Available after deposit confirmation.',
        actionLabel: completed ? 'View Music Profile' : depositConfirmed ? 'Complete Music Questionnaire' : null,
        workflowKey: 'music',
        readOnly: false
      } satisfies ChecklistItemProjection;
    }

    return {
      ...todo,
      locked: false,
      unlockReason: null,
      actionLabel: todo.clientCompletable && todo.status !== 'completed' ? 'Mark Done' : null,
      workflowKey: null,
      readOnly: false
    } satisfies ChecklistItemProjection;
  });

  return {
    payments,
    checklist,
    summary: {
      completedChecklistCount: checklist.filter((item) => item.status === 'completed').length,
      totalChecklistCount: checklist.length,
      paidAmount,
      remainingAmount,
      depositConfirmed,
      musicStatus: musicState.status
    }
  };
}

// Public read: hydrate plan + override state from Supabase (if configured), then project.
export async function getChecklistState(eventId: string): Promise<ChecklistProjection> {
  const { plan, state } = await loadCouple(eventId);
  return buildChecklistState(plan, state);
}

function topGenres(genreMix: Record<MusicGenreKey, number>) {
  return Object.entries(genreMix)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([key, value]) => `${formatGenreLabel(key as MusicGenreKey)} ${value}%`);
}

function formatGenreLabel(key: MusicGenreKey): string {
  const labels: Record<MusicGenreKey, string> = {
    bhangraNewer: 'Bhangra (newer)',
    bhangraOldSchool: 'Bhangra (old school)',
    bollywoodNewer: 'Bollywood (newer)',
    bollywoodOlder: 'Bollywood (older)',
    oldSchoolHipHop: 'Old school hip-hop',
    currentHipHopTop40: 'Current hip-hop / Top 40',
    house: 'House',
    latin: 'Latin',
    other: 'Other'
  };

  return labels[key];
}

export function generateMusicProfile(input: MusicQuestionnaireInput): MusicProfileCard {
  const generatedAt = new Date().toISOString();
  const highlights = topGenres(input.genreMix);

  return {
    title: 'Music Experience Profile',
    summary: `Primary music blend: ${highlights.join(', ')}. Questionnaire completed and shared with your planner and DJ team.`,
    genreSplit: `Requested genre split: ${highlights.join(', ')}.`,
    danceOffPlan: input.danceOffNotes.trim().length > 0 ? `Dance-off notes: ${input.danceOffNotes.trim()}` : 'Dance-off notes: none provided.',
    otherNotes: input.otherGenres.trim().length > 0 ? input.otherGenres.trim() : 'No other genres specified.',
    additionalNotes: input.additionalNotes.trim().length > 0 ? input.additionalNotes.trim() : 'No additional notes provided.',
    plannerStatus: 'Complete',
    generatedAt
  };
}

// Sync builder over an already-resolved plan + hydrated override state.
function buildMusicState(plan: ClientEventPlan, state: DomainRuntimeState): MusicDomainRecord {
  const payments = plan.paymentMilestones.map((item) => cloneMilestone(item, state.paymentOverrides[item.id]));
  const unlockedByDeposit = payments.some((item) => item.percent === 30 && item.status === 'completed');
  const eventId = plan.eventId;

  if (state.musicSubmission) {
    return {
      eventId,
      status: 'completed',
      unlockedByDeposit,
      questionnaire: state.musicSubmission.questionnaire,
      profile: state.musicSubmission.profile,
      submittedAt: state.musicSubmission.submittedAt
    };
  }

  return {
    eventId,
    status: unlockedByDeposit ? 'ready' : 'locked',
    unlockedByDeposit,
    questionnaire: null,
    profile: null,
    submittedAt: null
  };
}

const projectMusic = createRoleScopedAdapter<MusicDomainRecord, MusicDomainRecord>({
  domain: 'music',
  projectors: {
    full: (input) => input,
    owner_filtered: (input) => input,
    operations: (input) => ({
      ...input,
      questionnaire: input.questionnaire,
      profile: input.profile
    }),
    summary: (input) => ({
      ...input,
      questionnaire: null,
      profile: input.profile
    })
  }
});

const projectApprovals = createRoleScopedAdapter<ApprovalProjection, ApprovalProjection>({
  domain: 'approvals',
  projectors: {
    full: (input) => input,
    owner_filtered: (input) => input
  }
});

export async function getMusicProjectionForActor(params: { eventId: string; actorRole: Role }) {
  const { plan, state } = await loadCouple(params.eventId);
  const record = buildMusicState(plan, state);
  return {
    domainScope: getDomainScope('music', params.actorRole),
    music: projectMusic(params.actorRole, record)
  };
}

export async function getApprovalProjectionForActor(params: { eventId: string; actorRole: Role }): Promise<ApprovalProjection & { domainScope: ReturnType<typeof getDomainScope> }> {
  const { plan, state } = await loadCouple(params.eventId);
  const checklist = buildChecklistState(plan, state);
  const music = buildMusicState(plan, state);
  const approvalState: ApprovalProjection = {
    approvals: [
      {
        id: 'approval-music-profile',
        title: 'Music Profile',
        description: 'Structured music questionnaire and generated planner and DJ profile.',
        status: music.status === 'completed' ? 'complete' : music.status === 'ready' ? 'pending' : 'locked',
        dueDate: checklist.checklist.find((item) => item.id === 'todo-music-questionnaire')?.dueDate ?? null,
        sourceDomain: 'music',
        readOnly: params.actorRole !== 'couple'
      },
      {
        id: 'approval-vendor-list',
        title: 'Recommended Vendor List',
        description: 'Planner-curated vendor shortlist and alternates.',
        status: checklist.checklist.find((item) => item.id === 'todo-vendor-approval')?.status === 'completed' ? 'complete' : 'pending',
        dueDate: checklist.checklist.find((item) => item.id === 'todo-vendor-approval')?.dueDate ?? null,
        sourceDomain: 'planning',
        readOnly: params.actorRole !== 'couple'
      },
      {
        id: 'approval-day-of-timeline',
        title: 'Day-of Timeline Sign-off',
        description: 'Final planner timeline approval from couple.',
        status: checklist.checklist.find((item) => item.id === 'todo-day-of-brief')?.status === 'completed' ? 'complete' : 'pending',
        dueDate: checklist.checklist.find((item) => item.id === 'todo-day-of-brief')?.dueDate ?? null,
        sourceDomain: 'planning',
        readOnly: params.actorRole !== 'couple'
      }
    ],
    summary: {
      completeCount: 0,
      totalCount: 3,
      musicStatus: music.status === 'completed' ? 'complete' : music.status === 'ready' ? 'pending' : 'locked'
    }
  };

  approvalState.summary.completeCount = approvalState.approvals.filter((item) => item.status === 'complete').length;

  return {
    domainScope: getDomainScope('approvals', params.actorRole),
    ...(projectApprovals(params.actorRole, approvalState) ?? approvalState)
  };
}

export async function markPaymentMilestoneComplete(eventId: string, milestoneId: string, completedAt = new Date().toISOString().slice(0, 10)) {
  const { plan } = await loadCouple(eventId);
  const milestone = plan.paymentMilestones.find((item) => item.id === milestoneId);

  if (!milestone) {
    return null;
  }

  const override = { status: 'completed' as const, completedAt };
  await persistPaymentOverride(eventId, milestoneId, override);

  return cloneMilestone(milestone, override);
}

export async function toggleChecklistItem(eventId: string, itemId: string) {
  const { plan, state } = await loadCouple(eventId);
  const item = plan.planningTodos.find((todo) => todo.id === itemId);

  if (!item || !item.clientCompletable || item.id === 'todo-music-questionnaire') {
    return null;
  }

  const current = state.todoOverrides[itemId]?.status ?? item.status;
  const override = current === 'completed'
    ? { status: 'pending' as const, completedAt: undefined, badgeLabel: item.badgeLabel }
    : { status: 'completed' as const, completedAt: new Date().toISOString().slice(0, 10), badgeLabel: 'Done' };

  await persistTodoOverride(eventId, itemId, override);

  return cloneTodo(item, override);
}

export async function submitMusicQuestionnaire(eventId: string, input: MusicQuestionnaireInput) {
  const total = MUSIC_GENRE_KEYS.reduce((sum, key) => sum + (input.genreMix[key] ?? 0), 0);
  if (total !== 100) {
    throw new Error('genre_mix_total_invalid');
  }

  const { plan, state } = await loadCouple(eventId);
  const musicState = buildMusicState(plan, state);
  if (musicState.status === 'locked') {
    throw new Error('music_locked');
  }

  const normalized: MusicQuestionnaireInput = {
    ...input,
    otherGenres: input.otherGenres.trim(),
    danceOffNotes: input.danceOffNotes.trim(),
    additionalNotes: input.additionalNotes.trim()
  };

  const profile = generateMusicProfile(normalized);
  const submittedAt = new Date().toISOString();

  await persistMusicSubmission(eventId, { questionnaire: normalized, profile, submittedAt });
  await persistTodoOverride(eventId, 'todo-music-questionnaire', {
    status: 'completed',
    completedAt: submittedAt.slice(0, 10),
    badgeLabel: 'Done'
  });

  return buildMusicState(plan, getOrCreateRuntimeState(eventId));
}

export function __resetCoupleDomainsForTests() {
  runtimeState.clear();
}
