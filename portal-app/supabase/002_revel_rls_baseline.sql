-- REVEL RLS Baseline v1
-- Apply after 001_revel_foundation.sql

-- Enable RLS
alter table memberships enable row level security;
alter table venues enable row level security;
alter table venue_constraints enable row level security;
alter table events enable row level security;
alter table timelines enable row level security;
alter table timeline_templates enable row level security;

-- Helper: check whether authenticated user has a role on event
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

-- memberships
create policy "memberships_self_or_admin_read"
on memberships
for select
using (
  user_id = auth.uid()
  or public.user_has_event_role(event_id, array['admin'::app_role, 'planner_admin'::app_role])
);

-- events
create policy "events_member_read"
on events
for select
using (
  public.user_has_event_role(event_id, array[
    'admin'::app_role,
    'couple_owner'::app_role,
    'planner_admin'::app_role,
    'vendor'::app_role,
    'guest'::app_role,
    'delegate_coordinator'::app_role
  ])
);

create policy "events_planner_or_couple_write"
on events
for all
using (
  public.user_has_event_role(event_id, array['admin'::app_role, 'planner_admin'::app_role, 'couple_owner'::app_role])
)
with check (
  public.user_has_event_role(event_id, array['admin'::app_role, 'planner_admin'::app_role, 'couple_owner'::app_role])
);

-- timelines
create policy "timelines_member_read"
on timelines
for select
using (
  public.user_has_event_role(event_id, array[
    'admin'::app_role,
    'couple_owner'::app_role,
    'planner_admin'::app_role,
    'vendor'::app_role,
    'guest'::app_role,
    'delegate_coordinator'::app_role
  ])
);

create policy "timelines_admin_planner_couple_full_write"
on timelines
for all
using (
  public.user_has_event_role(event_id, array['admin'::app_role, 'planner_admin'::app_role, 'couple_owner'::app_role])
)
with check (
  public.user_has_event_role(event_id, array['admin'::app_role, 'planner_admin'::app_role, 'couple_owner'::app_role])
);

create policy "timelines_delegate_dayof_limited_update"
on timelines
for update
using (
  can_delegate_update = true
  and public.user_has_event_role(event_id, array['delegate_coordinator'::app_role])
  and exists (
    select 1
    from memberships m
    where m.user_id = auth.uid()
      and m.event_id = timelines.event_id
      and m.role = 'delegate_coordinator'
      and m.active = true
      and m.day_of_window_start is not null
      and m.day_of_window_end is not null
      and now() between m.day_of_window_start and m.day_of_window_end
  )
)
with check (
  can_delegate_update = true
  and public.user_has_event_role(event_id, array['delegate_coordinator'::app_role])
);

-- venue intelligence read access for authenticated users
create policy "venues_authenticated_read"
on venues
for select
using (auth.uid() is not null);

create policy "venue_constraints_authenticated_read"
on venue_constraints
for select
using (auth.uid() is not null);

create policy "timeline_templates_authenticated_read"
on timeline_templates
for select
using (auth.uid() is not null);
