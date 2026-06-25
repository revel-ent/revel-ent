import {
  type ClientEventPlan,
  type MilestoneCategory,
  type MilestoneStatus,
  type PaymentMilestone,
  type PlanningTodo,
  type UpgradeOption,
  getSeedClientPlanForEvent
} from '@/lib/mock-client-milestones';
import { getSupabaseAdminClient } from '@/lib/supabase-server';

interface PlanRow {
  contract_signed_date: string | null;
  primary_dates: unknown;
  venue_name: string | null;
  estimated_guests: number | null;
  total_contract_value: number | string | null;
}

interface MilestoneRow {
  id: string;
  label: string;
  amount: number | string | null;
  percent: number | string | null;
  due_date: string | null;
  status: string;
  completed_at: string | null;
  note: string | null;
  client_completable: boolean | null;
}

interface TodoRow {
  id: string;
  category: string;
  title: string;
  detail: string | null;
  due_date: string | null;
  status: string;
  completed_at: string | null;
  client_completable: boolean | null;
  badge_label: string | null;
}

interface UpgradeRow {
  id: string;
  title: string;
  description: string | null;
  price: number | string | null;
  unit: string | null;
  category: string | null;
  popular: boolean | null;
}

function toNumber(value: number | string | null | undefined): number {
  if (typeof value === 'number') {
    return value;
  }
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toPrimaryDates(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === 'string');
  }
  return [];
}

function mapMilestone(row: MilestoneRow): PaymentMilestone {
  return {
    id: row.id,
    label: row.label,
    amount: toNumber(row.amount),
    percent: toNumber(row.percent),
    dueDate: row.due_date ?? '',
    status: row.status as MilestoneStatus,
    completedAt: row.completed_at ?? undefined,
    note: row.note ?? undefined,
    clientCompletable: Boolean(row.client_completable)
  };
}

function mapTodo(row: TodoRow): PlanningTodo {
  return {
    id: row.id,
    category: row.category as MilestoneCategory,
    title: row.title,
    detail: row.detail ?? '',
    dueDate: row.due_date ?? undefined,
    status: row.status as MilestoneStatus,
    completedAt: row.completed_at ?? undefined,
    clientCompletable: Boolean(row.client_completable),
    badgeLabel: row.badge_label ?? undefined
  };
}

function mapUpgrade(row: UpgradeRow): UpgradeOption {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    price: toNumber(row.price),
    unit: row.unit ?? 'flat',
    category: row.category ?? 'General',
    popular: Boolean(row.popular)
  };
}

// Durable, data-driven client plan: reads event_client_plans + children for the event. Falls back
// to the in-code seed plan when Supabase is unconfigured or the event has no persisted plan yet.
export async function getClientPlanForEvent(eventId: string): Promise<ClientEventPlan | undefined> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return getSeedClientPlanForEvent(eventId);
  }

  const { data: planRow, error } = await supabase
    .from('event_client_plans')
    .select('contract_signed_date,primary_dates,venue_name,estimated_guests,total_contract_value')
    .eq('event_id', eventId)
    .maybeSingle<PlanRow>();

  if (error || !planRow) {
    return getSeedClientPlanForEvent(eventId);
  }

  const [milestonesResult, todosResult, upgradesResult] = await Promise.all([
    supabase
      .from('event_payment_milestones')
      .select('id,label,amount,percent,due_date,status,completed_at,note,client_completable')
      .eq('event_id', eventId)
      .order('sort_order', { ascending: true }),
    supabase
      .from('event_planning_todos')
      .select('id,category,title,detail,due_date,status,completed_at,client_completable,badge_label')
      .eq('event_id', eventId)
      .order('sort_order', { ascending: true }),
    supabase
      .from('event_upgrades')
      .select('id,title,description,price,unit,category,popular')
      .eq('event_id', eventId)
      .order('sort_order', { ascending: true })
  ]);

  return {
    eventId,
    contractSignedDate: planRow.contract_signed_date ?? '',
    primaryDates: toPrimaryDates(planRow.primary_dates),
    venueName: planRow.venue_name ?? '',
    estimatedGuests: planRow.estimated_guests ?? 0,
    totalContractValue: toNumber(planRow.total_contract_value),
    paymentMilestones: ((milestonesResult.data ?? []) as MilestoneRow[]).map(mapMilestone),
    planningTodos: ((todosResult.data ?? []) as TodoRow[]).map(mapTodo),
    upgrades: ((upgradesResult.data ?? []) as UpgradeRow[]).map(mapUpgrade)
  };
}
