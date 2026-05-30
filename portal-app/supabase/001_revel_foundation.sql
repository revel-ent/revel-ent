-- REVEL Foundation Schema v1
-- Purpose:
-- 1) Add updated RBAC roles (including delegate_coordinator)
-- 2) Create venues + venue_constraints tables aligned to Atlas structure
-- 3) Create events + timelines tables for pre-populated onboarding output

create extension if not exists pgcrypto;

-- =====
-- Enums
-- =====

create type app_role as enum (
  'admin',
  'couple_owner',
  'planner_admin',
  'vendor',
  'guest',
  'delegate_coordinator'
);

create type event_status as enum (
  'draft',
  'active',
  'completed',
  'archived'
);

create type timeline_status as enum (
  'pending',
  'ready',
  'in_progress',
  'completed',
  'delayed',
  'blocked'
);

create type confidence_level as enum (
  'measured',
  'venue_doc',
  'sales_claim',
  'estimated'
);

create type verification_status as enum (
  'unverified',
  'partially_verified',
  'vendor_verified'
);

-- =====================
-- RBAC core membership
-- =====================

create table if not exists memberships (
  membership_id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  event_id uuid not null,
  role app_role not null,
  invited_by uuid,
  invited_at timestamptz,
  accepted_at timestamptz,
  active boolean not null default true,
  -- delegate_coordinator gets day-of elevated writes only for a bounded window
  day_of_window_start timestamptz,
  day_of_window_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, event_id, role)
);

create index if not exists idx_memberships_event_role on memberships (event_id, role);
create index if not exists idx_memberships_user on memberships (user_id);

-- =============
-- Atlas venues
-- =============

create table if not exists venues (
  venue_id uuid primary key default gen_random_uuid(),
  atlas_record_id text unique,
  atlas_slug text,
  name text not null,
  room_name text,
  city text,
  state text,
  address text,

  -- dimensions/capacity
  length_ft numeric(8,2),
  width_ft numeric(8,2),
  height_ft numeric(8,2),
  marketed_capacity integer,
  comfortable_range_min integer,
  comfortable_range_max integer,

  -- trust and lineage
  source_confidence confidence_level,
  verification_status verification_status not null default 'unverified',
  last_verified_on date,
  provenance jsonb not null default '{}'::jsonb,
  source_links jsonb not null default '[]'::jsonb,
  diagram_assets jsonb not null default '[]'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_venues_city on venues (city);
create index if not exists idx_venues_slug on venues (atlas_slug);

create table if not exists venue_constraints (
  constraint_id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references venues (venue_id) on delete cascade,
  category text not null, -- logistics, power, policy, access, sound, decor
  key text not null,
  value_text text,
  value_number numeric(12,2),
  value_boolean boolean,
  unit text,
  notes text,
  source_confidence confidence_level,
  source_reference text,
  reviewed_by text,
  reviewed_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (venue_id, category, key)
);

create index if not exists idx_venue_constraints_venue_category on venue_constraints (venue_id, category);

-- =====================
-- Events and timelines
-- =====================

create table if not exists events (
  event_id uuid primary key default gen_random_uuid(),
  couple_primary_name text not null,
  partner_name text,
  event_label text not null,
  venue_id uuid references venues (venue_id),
  city text,
  state text,
  guest_count_estimate integer,
  status event_status not null default 'draft',
  starts_on date,
  ends_on date,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_events_status_start on events (status, starts_on);
create index if not exists idx_events_venue on events (venue_id);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'memberships_event_id_fkey'
  ) then
    alter table memberships
      add constraint memberships_event_id_fkey
      foreign key (event_id)
      references events (event_id)
      on delete cascade;
  end if;
end
$$;

create table if not exists timelines (
  timeline_id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (event_id) on delete cascade,
  phase_code text not null, -- mehndi, haldi, sangeet, baraat, ceremony, reception
  title text not null,
  scheduled_start timestamptz not null,
  scheduled_end timestamptz,
  status timeline_status not null default 'pending',
  owner_membership_id uuid references memberships (membership_id),
  can_delegate_update boolean not null default true,
  is_template_generated boolean not null default false,
  atlas_prompt jsonb not null default '{}'::jsonb,
  escalation_hint text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_timelines_event_start on timelines (event_id, scheduled_start);
create index if not exists idx_timelines_event_status on timelines (event_id, status);

-- =====================================================
-- Optional helper table for reusable onboarding templates
-- =====================================================

create table if not exists timeline_templates (
  template_id uuid primary key default gen_random_uuid(),
  template_key text not null,
  phase_code text not null,
  title text not null,
  offset_minutes integer not null,
  default_duration_minutes integer,
  requires_venue_check boolean not null default false,
  active boolean not null default true,
  unique (template_key, phase_code, title)
);

create index if not exists idx_timeline_templates_key on timeline_templates (template_key, phase_code);

-- Seed a default South Asian weekend template baseline.
insert into timeline_templates (template_key, phase_code, title, offset_minutes, default_duration_minutes, requires_venue_check)
values
  ('south_asian_weekend_v1', 'mehndi', 'Mehndi Setup Complete', -1560, 60, false),
  ('south_asian_weekend_v1', 'haldi', 'Haldi Family Assembly', -840, 45, false),
  ('south_asian_weekend_v1', 'sangeet', 'Sangeet Production Check', -300, 30, true),
  ('south_asian_weekend_v1', 'baraat', 'Baraat Staging Ready', -90, 20, true),
  ('south_asian_weekend_v1', 'ceremony', 'Ceremony Guest Seating Open', -45, 30, false),
  ('south_asian_weekend_v1', 'reception', 'Reception Room Reset Complete', 90, 45, true)
on conflict do nothing;

-- =====================================================
-- RLS baseline notes (actual policies should be added next)
-- =====================================================
-- Example policy intent:
-- - delegate_coordinator can update timelines.status/notes only during day_of_window
-- - delegate_coordinator cannot modify contracts, billing, or admin objects
-- - couple_owner/planner_admin maintain broader event scope access
