-- Atlas workspace foundation (review-first)
-- Purpose:
-- 1) Model workspace commercial mode (revel-managed vs independent)
-- 2) Add workspace ownership, billing, and entitlement snapshot on events
-- 3) Add entitlement templates and an immutable entitlement transition audit trail

-- =====================================================
-- Enums
-- =====================================================

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'atlas_event_mode'
  ) then
    create type atlas_event_mode as enum ('revel_managed', 'independent');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'atlas_workspace_plan'
  ) then
    create type atlas_workspace_plan as enum ('essential', 'pro', 'premium');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'atlas_billing_state'
  ) then
    create type atlas_billing_state as enum ('included', 'trialing', 'active', 'past_due', 'canceled');
  end if;
end
$$;

-- =====================================================
-- Event/workspace commercial foundation
-- =====================================================

alter table if exists events
  add column if not exists atlas_mode atlas_event_mode not null default 'revel_managed',
  add column if not exists atlas_workspace_plan atlas_workspace_plan,
  add column if not exists atlas_billing_state atlas_billing_state not null default 'included',
  add column if not exists atlas_workspace_owner_user_id uuid references auth.users (id) on delete set null,
  add column if not exists atlas_workspace_owner_role app_role,
  add column if not exists atlas_entitlement_snapshot jsonb not null default '{}'::jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'events_atlas_workspace_owner_role_check'
  ) then
    alter table events
      add constraint events_atlas_workspace_owner_role_check
      check (
        atlas_workspace_owner_role is null
        or atlas_workspace_owner_role in ('admin'::app_role, 'planner'::app_role, 'couple'::app_role)
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'events_atlas_mode_plan_consistency_check'
  ) then
    alter table events
      add constraint events_atlas_mode_plan_consistency_check
      check (
        (atlas_mode = 'revel_managed' and atlas_workspace_plan is null and atlas_billing_state = 'included')
        or (atlas_mode = 'independent' and atlas_workspace_plan is not null)
      );
  end if;
end
$$;

create index if not exists idx_events_atlas_mode on events (atlas_mode);
create index if not exists idx_events_atlas_workspace_owner_user_id on events (atlas_workspace_owner_user_id);

-- Preserve compatibility for existing records by deriving owner from created_by.
update events
set atlas_workspace_owner_user_id = coalesce(atlas_workspace_owner_user_id, created_by)
where atlas_workspace_owner_user_id is null
  and created_by is not null;

update events e
set atlas_workspace_owner_role = x.role
from (
  select
    m.event_id,
    m.user_id,
    (
      array_agg(m.role order by case m.role
        when 'admin' then 1
        when 'planner' then 2
        when 'couple' then 3
        else 99
      end)
    )[1] as role
  from memberships m
  where m.role in ('admin'::app_role, 'planner'::app_role, 'couple'::app_role)
  group by m.event_id, m.user_id
) x
where e.atlas_workspace_owner_role is null
  and e.atlas_workspace_owner_user_id is not null
  and e.event_id = x.event_id
  and e.atlas_workspace_owner_user_id = x.user_id;

update events
set atlas_workspace_owner_role = coalesce(atlas_workspace_owner_role, 'admin'::app_role)
where atlas_workspace_owner_role is null;

-- =====================================================
-- Entitlement templates (policy defaults)
-- =====================================================

create table if not exists atlas_entitlement_templates (
  template_id uuid primary key default gen_random_uuid(),
  mode atlas_event_mode not null,
  workspace_plan atlas_workspace_plan,
  template_key text not null,
  entitlement_payload jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (mode, workspace_plan, template_key),
  check ((mode = 'revel_managed' and workspace_plan is null) or (mode = 'independent' and workspace_plan is not null))
);

create index if not exists idx_atlas_entitlement_templates_mode_plan
  on atlas_entitlement_templates (mode, workspace_plan)
  where is_active = true;

-- =====================================================
-- Entitlement transition audit (append-only)
-- =====================================================

create table if not exists atlas_entitlement_audit (
  audit_id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (event_id) on delete cascade,
  actor_user_id uuid not null references auth.users (id) on delete cascade,
  actor_role app_role not null,
  change_kind text not null,
  reason_code text,
  note text,
  previous_state jsonb not null default '{}'::jsonb,
  next_state jsonb not null default '{}'::jsonb,
  source_surface text not null,
  created_at timestamptz not null default now(),
  check (change_kind in ('mode_set', 'plan_set', 'billing_state_set', 'owner_set', 'entitlement_template_applied', 'manual_override')),
  check (source_surface in ('admin_console', 'planner_dashboard', 'couple_dashboard', 'system_automation'))
);

create index if not exists idx_atlas_entitlement_audit_event_id
  on atlas_entitlement_audit (event_id, created_at desc);

create index if not exists idx_atlas_entitlement_audit_actor_user_id
  on atlas_entitlement_audit (actor_user_id, created_at desc);

alter table if exists atlas_entitlement_audit enable row level security;

drop policy if exists "atlas_entitlement_audit_event_member_read" on atlas_entitlement_audit;
create policy "atlas_entitlement_audit_event_member_read"
on atlas_entitlement_audit
for select
using (
  public.user_has_event_role(event_id, array[
    'admin'::app_role,
    'planner'::app_role,
    'couple'::app_role,
    'delegate_coordinator'::app_role,
    'venue_coordinator'::app_role
  ])
);

drop policy if exists "atlas_entitlement_audit_member_insert" on atlas_entitlement_audit;
create policy "atlas_entitlement_audit_member_insert"
on atlas_entitlement_audit
for insert
with check (
  actor_user_id = auth.uid()
  and public.user_has_event_role(event_id, array[actor_role])
  and actor_role in ('admin'::app_role, 'planner'::app_role, 'couple'::app_role)
);

create or replace function public.touch_atlas_entitlement_templates_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_atlas_entitlement_templates_touch_updated_at on atlas_entitlement_templates;
create trigger trg_atlas_entitlement_templates_touch_updated_at
before update on atlas_entitlement_templates
for each row
execute function public.touch_atlas_entitlement_templates_updated_at();

-- Seed canonical templates for phase-1 policy defaults.
insert into atlas_entitlement_templates (mode, workspace_plan, template_key, entitlement_payload)
values
  (
    'revel_managed',
    null,
    'revel_managed_default_v1',
    '{"workspaceMode":"revel_managed","capabilities":{"coreWorkspace":true,"coreIntelligence":true},"billing":{"payer":"revel","seatBilling":false}}'::jsonb
  ),
  (
    'independent',
    'essential',
    'independent_essential_v1',
    '{"workspaceMode":"independent","capabilities":{"coreWorkspace":true,"coreIntelligence":true,"advancedSignals":false,"conciergeSupport":false},"billing":{"payer":"workspace_owner","seatBilling":false}}'::jsonb
  ),
  (
    'independent',
    'pro',
    'independent_pro_v1',
    '{"workspaceMode":"independent","capabilities":{"coreWorkspace":true,"coreIntelligence":true,"advancedSignals":true,"conciergeSupport":false},"billing":{"payer":"workspace_owner","seatBilling":false}}'::jsonb
  ),
  (
    'independent',
    'premium',
    'independent_premium_v1',
    '{"workspaceMode":"independent","capabilities":{"coreWorkspace":true,"coreIntelligence":true,"advancedSignals":true,"conciergeSupport":true},"billing":{"payer":"workspace_owner","seatBilling":false}}'::jsonb
  )
on conflict do nothing;

-- Notes:
-- 1) This migration is zero-downtime safe: additive columns/tables, idempotent guards, no table rewrites.
-- 2) Applying this migration does not change route RBAC; it only introduces commercial/entitlement primitives.
-- 3) Recommended rollout: write columns first, then API/UI consumption in separate release.