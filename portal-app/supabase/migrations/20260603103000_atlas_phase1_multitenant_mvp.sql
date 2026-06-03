-- Atlas Phase 1: multi-tenant MVP foundation (revised scope)
-- Purpose:
-- 1) Introduce organization context into the canonical auth chain.
-- 2) Keep authorization role-driven for Alpha (no permission tables yet).
-- 3) Make venue intelligence and vendor/event relationships first-class.
-- 4) Keep migration additive and backward-compatible.

create extension if not exists pgcrypto;

-- =====================================================
-- Organizations
-- =====================================================

create table if not exists organizations (
  organization_id uuid primary key default gen_random_uuid(),
  organization_slug text not null unique,
  display_name text not null,
  organization_type text not null default 'independent',
  status text not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  is_alpha boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (organization_type in ('revel', 'planning_company', 'venue_group', 'corporate_event_team', 'independent_couple')),
  check (status in ('active', 'suspended', 'archived'))
);

create index if not exists idx_organizations_type_status
  on organizations (organization_type, status);

create table if not exists organization_users (
  organization_user_id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (organization_id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'active',
  joined_at timestamptz,
  invited_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id),
  check (status in ('invited', 'active', 'suspended'))
);

create index if not exists idx_organization_users_user
  on organization_users (user_id);

-- Seed Alpha organization and backfill existing events.
insert into organizations (organization_slug, display_name, organization_type, status, is_alpha)
values ('revel-ent', 'Revel Entertainment', 'revel', 'active', true)
on conflict (organization_slug) do nothing;

alter table if exists events
  add column if not exists organization_id uuid;

update events e
set organization_id = o.organization_id
from organizations o
where e.organization_id is null
  and o.organization_slug = 'revel-ent';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'events_organization_id_fkey'
  ) then
    alter table events
      add constraint events_organization_id_fkey
      foreign key (organization_id)
      references organizations (organization_id)
      on delete restrict;
  end if;
end
$$;

create index if not exists idx_events_organization_id
  on events (organization_id);

-- Set non-null only after backfill.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'events'
      and column_name = 'organization_id'
      and is_nullable = 'YES'
  ) then
    alter table events alter column organization_id set not null;
  end if;
end
$$;

-- Backfill organization_users from existing event memberships.
insert into organization_users (organization_id, user_id, status, joined_at, invited_at)
select distinct
  e.organization_id,
  m.user_id,
  case when m.active then 'active' else 'suspended' end,
  m.accepted_at,
  m.invited_at
from memberships m
join events e on e.event_id = m.event_id
where m.user_id is not null
on conflict (organization_id, user_id) do nothing;

-- =====================================================
-- Canonical auth-chain helpers
-- =====================================================

create or replace function public.user_has_organization_access(target_organization_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from organization_users ou
    where ou.user_id = auth.uid()
      and ou.organization_id = target_organization_id
      and ou.status = 'active'
  )
  or exists (
    select 1
    from memberships m
    join events e on e.event_id = m.event_id
    where m.user_id = auth.uid()
      and m.active = true
      and e.organization_id = target_organization_id
  );
$$;

-- Canonical naming for auth chain while preserving backward compatibility.
create or replace view event_memberships as
select
  m.membership_id,
  m.user_id,
  m.event_id,
  e.organization_id,
  m.role,
  m.invited_by,
  m.invited_at,
  m.accepted_at,
  m.active,
  m.day_of_window_start,
  m.day_of_window_end,
  m.created_at,
  m.updated_at
from memberships m
join events e on e.event_id = m.event_id;

-- =====================================================
-- Role registry (role-driven in Alpha)
-- =====================================================

create table if not exists roles (
  role_key app_role primary key,
  display_name text not null,
  role_scope text not null default 'event',
  is_system boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (role_scope in ('event', 'organization', 'platform'))
);

insert into roles (role_key, display_name, role_scope, is_system)
values
  ('admin', 'Admin', 'event', true),
  ('couple', 'Couple', 'event', true),
  ('planner', 'Planner', 'event', true),
  ('vendor', 'Vendor', 'event', true),
  ('guest', 'Guest', 'event', true),
  ('delegate_coordinator', 'Family Coordinator', 'event', true),
  ('venue_coordinator', 'Venue Coordinator', 'event', true)
on conflict (role_key) do update
set display_name = excluded.display_name,
    role_scope = excluded.role_scope,
    is_system = excluded.is_system,
    updated_at = now();

-- =====================================================
-- Venue intelligence as first-class asset
-- =====================================================

create table if not exists venue_intelligence_facts (
  fact_id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references venues (venue_id) on delete cascade,
  organization_id uuid references organizations (organization_id) on delete cascade,
  event_id uuid references events (event_id) on delete set null,
  fact_category text not null,
  fact_key text not null,
  fact_value jsonb not null default '{}'::jsonb,
  confidence_level text not null default 'estimated',
  source_type text not null default 'field_observation',
  source_reference text,
  visibility_scope text not null default 'organization_internal',
  created_by_user_id uuid references auth.users (id) on delete set null,
  approved_by_user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (fact_category in ('load_in', 'power', 'rigging', 'policy', 'historical_note', 'recommendation', 'operations')),
  check (confidence_level in ('measured', 'venue_doc', 'sales_claim', 'estimated')),
  check (source_type in ('field_observation', 'vendor_packet', 'user_report', 'inferred', 'manual_entry')),
  check (visibility_scope in ('event_internal', 'organization_internal', 'platform_internal')),
  check (
    (visibility_scope = 'event_internal' and event_id is not null)
    or (visibility_scope in ('organization_internal', 'platform_internal'))
  )
);

create index if not exists idx_venue_intelligence_facts_venue
  on venue_intelligence_facts (venue_id, fact_category);

create index if not exists idx_venue_intelligence_facts_org
  on venue_intelligence_facts (organization_id, visibility_scope);

create index if not exists idx_venue_intelligence_facts_event
  on venue_intelligence_facts (event_id, visibility_scope)
  where event_id is not null;

create unique index if not exists uq_venue_intelligence_facts_scope_key
  on venue_intelligence_facts (
    venue_id,
    fact_category,
    fact_key,
    visibility_scope,
    coalesce(event_id, '00000000-0000-0000-0000-000000000000'::uuid),
    coalesce(organization_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );

-- =====================================================
-- Global vendor layer + event relationships
-- =====================================================

create table if not exists vendors (
  vendor_id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations (organization_id) on delete set null,
  legal_name text not null,
  display_name text,
  vendor_category text not null default 'general',
  primary_email text,
  primary_phone text,
  website_url text,
  status text not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('active', 'inactive', 'archived'))
);

create index if not exists idx_vendors_org_status
  on vendors (organization_id, status);

create table if not exists event_vendors (
  event_vendor_id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (event_id) on delete cascade,
  vendor_id uuid not null references vendors (vendor_id) on delete cascade,
  relationship_role text not null default 'primary',
  contact_user_id uuid references auth.users (id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, vendor_id, relationship_role)
);

create index if not exists idx_event_vendors_event
  on event_vendors (event_id, relationship_role);

create table if not exists event_venues (
  event_venue_id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (event_id) on delete cascade,
  venue_id uuid not null references venues (venue_id) on delete cascade,
  relationship_type text not null default 'primary',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, venue_id, relationship_type),
  check (relationship_type in ('primary', 'ceremony', 'reception', 'auxiliary', 'backup'))
);

create index if not exists idx_event_venues_event
  on event_venues (event_id, relationship_type);

-- Backfill event_venues from existing events.venue_id where present.
insert into event_venues (event_id, venue_id, relationship_type)
select e.event_id, e.venue_id, 'primary'
from events e
where e.venue_id is not null
on conflict (event_id, venue_id, relationship_type) do nothing;

-- =====================================================
-- Updated-at triggers
-- =====================================================

create or replace function public.touch_atlas_multitenant_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_organizations_touch_updated_at on organizations;
create trigger trg_organizations_touch_updated_at
before update on organizations
for each row
execute function public.touch_atlas_multitenant_updated_at();

drop trigger if exists trg_organization_users_touch_updated_at on organization_users;
create trigger trg_organization_users_touch_updated_at
before update on organization_users
for each row
execute function public.touch_atlas_multitenant_updated_at();

drop trigger if exists trg_roles_touch_updated_at on roles;
create trigger trg_roles_touch_updated_at
before update on roles
for each row
execute function public.touch_atlas_multitenant_updated_at();

drop trigger if exists trg_venue_intelligence_facts_touch_updated_at on venue_intelligence_facts;
create trigger trg_venue_intelligence_facts_touch_updated_at
before update on venue_intelligence_facts
for each row
execute function public.touch_atlas_multitenant_updated_at();

drop trigger if exists trg_vendors_touch_updated_at on vendors;
create trigger trg_vendors_touch_updated_at
before update on vendors
for each row
execute function public.touch_atlas_multitenant_updated_at();

drop trigger if exists trg_event_vendors_touch_updated_at on event_vendors;
create trigger trg_event_vendors_touch_updated_at
before update on event_vendors
for each row
execute function public.touch_atlas_multitenant_updated_at();

drop trigger if exists trg_event_venues_touch_updated_at on event_venues;
create trigger trg_event_venues_touch_updated_at
before update on event_venues
for each row
execute function public.touch_atlas_multitenant_updated_at();

-- =====================================================
-- RLS (role-driven in Alpha)
-- =====================================================

alter table if exists organizations enable row level security;
alter table if exists organization_users enable row level security;
alter table if exists roles enable row level security;
alter table if exists venue_intelligence_facts enable row level security;
alter table if exists vendors enable row level security;
alter table if exists event_vendors enable row level security;
alter table if exists event_venues enable row level security;

drop policy if exists "organizations_member_read" on organizations;
create policy "organizations_member_read"
on organizations
for select
using (public.user_has_organization_access(organization_id));

drop policy if exists "organization_users_self_or_org_member_read" on organization_users;
create policy "organization_users_self_or_org_member_read"
on organization_users
for select
using (
  user_id = auth.uid()
  or public.user_has_organization_access(organization_id)
);

drop policy if exists "roles_authenticated_read" on roles;
create policy "roles_authenticated_read"
on roles
for select
using (auth.uid() is not null);

drop policy if exists "venue_intelligence_facts_member_read" on venue_intelligence_facts;
create policy "venue_intelligence_facts_member_read"
on venue_intelligence_facts
for select
using (
  (visibility_scope = 'event_internal' and event_id is not null and public.user_has_event_role(event_id, array[
    'admin'::app_role,
    'planner'::app_role,
    'couple'::app_role,
    'delegate_coordinator'::app_role,
    'venue_coordinator'::app_role,
    'vendor'::app_role
  ]))
  or (visibility_scope = 'organization_internal' and organization_id is not null and public.user_has_organization_access(organization_id))
  or (visibility_scope = 'platform_internal' and organization_id is not null and public.user_has_organization_access(organization_id))
);

drop policy if exists "venue_intelligence_facts_member_write" on venue_intelligence_facts;
create policy "venue_intelligence_facts_member_write"
on venue_intelligence_facts
for all
using (
  (event_id is not null and public.user_has_event_role(event_id, array[
    'admin'::app_role,
    'planner'::app_role,
    'venue_coordinator'::app_role
  ]))
  or (organization_id is not null and public.user_has_organization_access(organization_id))
)
with check (
  (event_id is not null and public.user_has_event_role(event_id, array[
    'admin'::app_role,
    'planner'::app_role,
    'venue_coordinator'::app_role
  ]))
  or (organization_id is not null and public.user_has_organization_access(organization_id))
);

drop policy if exists "vendors_org_member_read" on vendors;
create policy "vendors_org_member_read"
on vendors
for select
using (
  organization_id is null
  or public.user_has_organization_access(organization_id)
);

drop policy if exists "event_vendors_event_member_read" on event_vendors;
create policy "event_vendors_event_member_read"
on event_vendors
for select
using (
  public.user_has_event_role(event_id, array[
    'admin'::app_role,
    'planner'::app_role,
    'couple'::app_role,
    'delegate_coordinator'::app_role,
    'venue_coordinator'::app_role,
    'vendor'::app_role
  ])
);

drop policy if exists "event_vendors_manage" on event_vendors;
create policy "event_vendors_manage"
on event_vendors
for all
using (
  public.user_has_event_role(event_id, array['admin'::app_role, 'planner'::app_role, 'couple'::app_role])
)
with check (
  public.user_has_event_role(event_id, array['admin'::app_role, 'planner'::app_role, 'couple'::app_role])
);

drop policy if exists "event_venues_event_member_read" on event_venues;
create policy "event_venues_event_member_read"
on event_venues
for select
using (
  public.user_has_event_role(event_id, array[
    'admin'::app_role,
    'planner'::app_role,
    'couple'::app_role,
    'delegate_coordinator'::app_role,
    'venue_coordinator'::app_role,
    'vendor'::app_role,
    'guest'::app_role
  ])
);

drop policy if exists "event_venues_manage" on event_venues;
create policy "event_venues_manage"
on event_venues
for all
using (
  public.user_has_event_role(event_id, array['admin'::app_role, 'planner'::app_role, 'couple'::app_role])
)
with check (
  public.user_has_event_role(event_id, array['admin'::app_role, 'planner'::app_role, 'couple'::app_role])
);

-- Notes:
-- 1) No permission tables are introduced in this phase.
-- 2) Existing memberships + app_role remain the enforcement source for role-driven auth.
-- 3) event_memberships view provides canonical naming without breaking legacy code paths.
