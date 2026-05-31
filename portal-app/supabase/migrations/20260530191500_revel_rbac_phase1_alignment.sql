-- REVEL RBAC phase 1 alignment
-- Purpose:
-- 1) Align DB role enum with app role names
-- 2) Add venue_coordinator role support
-- 3) Add phase-1 coordination entities from PRD
-- 4) Tighten and extend RLS policy coverage

create extension if not exists pgcrypto;

-- =========================
-- Align role enum values
-- =========================

do $$
begin
  if exists (
    select 1
    from pg_type t
    where t.typname = 'app_role'
  ) then
    begin
      alter type app_role rename value 'couple_owner' to 'couple';
    exception
      when invalid_parameter_value then null;
      when undefined_object then null;
    end;

    begin
      alter type app_role rename value 'planner_admin' to 'planner';
    exception
      when invalid_parameter_value then null;
      when undefined_object then null;
    end;

    if not exists (
      select 1
      from pg_enum e
      join pg_type t on t.oid = e.enumtypid
      where t.typname = 'app_role'
        and e.enumlabel = 'venue_coordinator'
    ) then
      alter type app_role add value 'venue_coordinator';
    end if;
  end if;
end
$$;

-- =========================
-- Timeline metadata fields
-- =========================

alter table if exists timelines
  add column if not exists execution_state text not null default 'not_started',
  add column if not exists owner_role app_role,
  add column if not exists risk_level text not null default 'normal';

create index if not exists idx_timelines_event_execution_state on timelines (event_id, execution_state);

-- ==================================
-- New phase-1 workflow entities
-- ==================================

create table if not exists timeline_dependencies (
  dependency_id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(event_id) on delete cascade,
  predecessor_timeline_id uuid not null references timelines(timeline_id) on delete cascade,
  successor_timeline_id uuid not null references timelines(timeline_id) on delete cascade,
  dependency_type text not null default 'finish_to_start',
  created_by uuid,
  created_at timestamptz not null default now(),
  check (predecessor_timeline_id <> successor_timeline_id)
);

create index if not exists idx_timeline_dependencies_event on timeline_dependencies (event_id);

create table if not exists alerts (
  alert_id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(event_id) on delete cascade,
  timeline_id uuid references timelines(timeline_id) on delete set null,
  created_by uuid,
  target_roles app_role[] not null default '{}'::app_role[],
  severity text not null default 'info',
  template_key text,
  message text not null,
  status text not null default 'queued',
  dispatched_at timestamptz,
  created_at timestamptz not null default now(),
  check (severity in ('info', 'warning', 'critical')),
  check (status in ('queued', 'sent', 'failed', 'cancelled'))
);

create index if not exists idx_alerts_event_created on alerts (event_id, created_at desc);

create table if not exists notification_deliveries (
  delivery_id uuid primary key default gen_random_uuid(),
  alert_id uuid not null references alerts(alert_id) on delete cascade,
  channel text not null,
  recipient_user_id uuid,
  recipient_role app_role,
  destination text,
  status text not null default 'pending',
  provider_message_id text,
  attempts integer not null default 0,
  sent_at timestamptz,
  delivered_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  check (channel in ('in_app', 'sms', 'email')),
  check (status in ('pending', 'sent', 'delivered', 'failed'))
);

create index if not exists idx_notification_deliveries_alert on notification_deliveries (alert_id, status);

create table if not exists recommendation_feedback (
  feedback_id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(event_id) on delete cascade,
  recommendation_id text not null,
  feedback_type text not null,
  feedback_note text,
  created_by uuid,
  created_role app_role,
  created_at timestamptz not null default now(),
  check (feedback_type in ('accepted', 'dismissed', 'flag_inaccurate', 'request_review'))
);

create index if not exists idx_recommendation_feedback_event on recommendation_feedback (event_id, created_at desc);

create table if not exists guest_invites (
  invite_id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(event_id) on delete cascade,
  guest_email text not null,
  guest_name text,
  token text not null unique,
  status text not null default 'pending',
  expires_at timestamptz,
  accepted_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  check (status in ('pending', 'accepted', 'revoked', 'expired'))
);

create index if not exists idx_guest_invites_event on guest_invites (event_id, status);

create table if not exists venue_advisories (
  advisory_id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(event_id) on delete cascade,
  venue_id uuid references venues(venue_id) on delete set null,
  advisory_type text not null default 'operations',
  message text not null,
  starts_at timestamptz,
  ends_at timestamptz,
  active boolean not null default true,
  created_by uuid,
  created_at timestamptz not null default now(),
  check (advisory_type in ('operations', 'compliance', 'safety', 'weather'))
);

create index if not exists idx_venue_advisories_event_active on venue_advisories (event_id, active);

-- =========================
-- RLS policy refresh
-- =========================

create or replace function public.user_has_event_role(target_event_id uuid, allowed_roles app_role[])
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from memberships m
    where m.user_id = auth.uid()
      and m.event_id = target_event_id
      and m.active = true
      and m.role = any(allowed_roles)
  );
$$;

alter table memberships enable row level security;
alter table events enable row level security;
alter table timelines enable row level security;
alter table timeline_dependencies enable row level security;
alter table alerts enable row level security;
alter table notification_deliveries enable row level security;
alter table recommendation_feedback enable row level security;
alter table guest_invites enable row level security;
alter table venue_advisories enable row level security;

-- Drop outdated policies so role label changes do not break checks.
drop policy if exists "memberships_self_or_admin_read" on memberships;
drop policy if exists "events_member_read" on events;
drop policy if exists "events_planner_or_couple_write" on events;
drop policy if exists "timelines_member_read" on timelines;
drop policy if exists "timelines_admin_planner_couple_full_write" on timelines;
drop policy if exists "timelines_delegate_dayof_limited_update" on timelines;

create policy "memberships_self_or_admin_read"
on memberships
for select
using (
  user_id = auth.uid()
  or public.user_has_event_role(event_id, array['admin'::app_role, 'planner'::app_role])
);

create policy "events_member_read"
on events
for select
using (
  public.user_has_event_role(event_id, array[
    'admin'::app_role,
    'couple'::app_role,
    'planner'::app_role,
    'vendor'::app_role,
    'guest'::app_role,
    'delegate_coordinator'::app_role
  ])
);

create policy "events_planner_or_couple_write"
on events
for all
using (
  public.user_has_event_role(event_id, array['admin'::app_role, 'planner'::app_role, 'couple'::app_role])
)
with check (
  public.user_has_event_role(event_id, array['admin'::app_role, 'planner'::app_role, 'couple'::app_role])
);

create policy "timelines_member_read"
on timelines
for select
using (
  public.user_has_event_role(event_id, array[
    'admin'::app_role,
    'couple'::app_role,
    'planner'::app_role,
    'vendor'::app_role,
    'guest'::app_role,
    'delegate_coordinator'::app_role
  ])
);

create policy "timelines_admin_planner_couple_full_write"
on timelines
for all
using (
  public.user_has_event_role(event_id, array['admin'::app_role, 'planner'::app_role, 'couple'::app_role])
)
with check (
  public.user_has_event_role(event_id, array['admin'::app_role, 'planner'::app_role, 'couple'::app_role])
);

create policy "timelines_delegate_dayof_limited_update"
on timelines
for update
using (
  can_delegate_update = true
  and public.user_has_event_role(event_id, array['delegate_coordinator'::app_role])
)
with check (
  can_delegate_update = true
  and public.user_has_event_role(event_id, array['delegate_coordinator'::app_role])
);

create policy "timeline_dependencies_member_read"
on timeline_dependencies
for select
using (
  public.user_has_event_role(event_id, array[
    'admin'::app_role,
    'planner'::app_role,
    'couple'::app_role,
    'vendor'::app_role,
    'delegate_coordinator'::app_role
  ])
);

create policy "timeline_dependencies_planner_write"
on timeline_dependencies
for all
using (
  public.user_has_event_role(event_id, array['admin'::app_role, 'planner'::app_role])
)
with check (
  public.user_has_event_role(event_id, array['admin'::app_role, 'planner'::app_role])
);

create policy "alerts_member_read"
on alerts
for select
using (
  public.user_has_event_role(event_id, array[
    'admin'::app_role,
    'couple'::app_role,
    'planner'::app_role,
    'vendor'::app_role,
    'guest'::app_role,
    'delegate_coordinator'::app_role
  ])
);

create policy "alerts_dispatch_write"
on alerts
for all
using (
  public.user_has_event_role(event_id, array['admin'::app_role, 'planner'::app_role, 'delegate_coordinator'::app_role])
)
with check (
  public.user_has_event_role(event_id, array['admin'::app_role, 'planner'::app_role, 'delegate_coordinator'::app_role])
);

create policy "notification_deliveries_read"
on notification_deliveries
for select
using (
  exists (
    select 1
    from alerts a
    where a.alert_id = notification_deliveries.alert_id
      and public.user_has_event_role(a.event_id, array[
        'admin'::app_role,
        'planner'::app_role,
        'delegate_coordinator'::app_role
      ])
  )
  or recipient_user_id = auth.uid()
);

create policy "notification_deliveries_write"
on notification_deliveries
for all
using (
  exists (
    select 1
    from alerts a
    where a.alert_id = notification_deliveries.alert_id
      and public.user_has_event_role(a.event_id, array['admin'::app_role, 'planner'::app_role])
  )
)
with check (
  exists (
    select 1
    from alerts a
    where a.alert_id = notification_deliveries.alert_id
      and public.user_has_event_role(a.event_id, array['admin'::app_role, 'planner'::app_role])
  )
);

create policy "recommendation_feedback_member_read"
on recommendation_feedback
for select
using (
  public.user_has_event_role(event_id, array[
    'admin'::app_role,
    'couple'::app_role,
    'planner'::app_role,
    'vendor'::app_role,
    'guest'::app_role,
    'delegate_coordinator'::app_role
  ])
);

create policy "recommendation_feedback_member_write"
on recommendation_feedback
for insert
with check (
  public.user_has_event_role(event_id, array[
    'admin'::app_role,
    'couple'::app_role,
    'planner'::app_role,
    'vendor'::app_role,
    'guest'::app_role,
    'delegate_coordinator'::app_role
  ])
);

create policy "guest_invites_member_read"
on guest_invites
for select
using (
  public.user_has_event_role(event_id, array['admin'::app_role, 'planner'::app_role, 'couple'::app_role])
);

create policy "guest_invites_member_write"
on guest_invites
for all
using (
  public.user_has_event_role(event_id, array['admin'::app_role, 'planner'::app_role, 'couple'::app_role])
)
with check (
  public.user_has_event_role(event_id, array['admin'::app_role, 'planner'::app_role, 'couple'::app_role])
);

create policy "venue_advisories_member_read"
on venue_advisories
for select
using (
  public.user_has_event_role(event_id, array[
    'admin'::app_role,
    'couple'::app_role,
    'planner'::app_role,
    'vendor'::app_role,
    'guest'::app_role,
    'delegate_coordinator'::app_role
  ])
);

create policy "venue_advisories_write"
on venue_advisories
for all
using (
  public.user_has_event_role(event_id, array['admin'::app_role, 'planner'::app_role])
)
with check (
  public.user_has_event_role(event_id, array['admin'::app_role, 'planner'::app_role])
);
