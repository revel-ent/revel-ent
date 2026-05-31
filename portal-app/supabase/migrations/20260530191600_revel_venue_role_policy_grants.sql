-- REVEL venue role policy grants
-- Purpose:
-- Add venue_coordinator access in a follow-up migration after the enum value is committed.

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

drop policy if exists "events_member_read" on events;
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
    'delegate_coordinator'::app_role,
    'venue_coordinator'::app_role
  ])
);

drop policy if exists "timelines_member_read" on timelines;
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
    'delegate_coordinator'::app_role,
    'venue_coordinator'::app_role
  ])
);

drop policy if exists "timelines_delegate_dayof_limited_update" on timelines;
create policy "timelines_delegate_dayof_limited_update"
on timelines
for update
using (
  can_delegate_update = true
  and public.user_has_event_role(event_id, array['delegate_coordinator'::app_role, 'venue_coordinator'::app_role])
)
with check (
  can_delegate_update = true
  and public.user_has_event_role(event_id, array['delegate_coordinator'::app_role, 'venue_coordinator'::app_role])
);

drop policy if exists "timeline_dependencies_member_read" on timeline_dependencies;
create policy "timeline_dependencies_member_read"
on timeline_dependencies
for select
using (
  public.user_has_event_role(event_id, array[
    'admin'::app_role,
    'planner'::app_role,
    'couple'::app_role,
    'vendor'::app_role,
    'delegate_coordinator'::app_role,
    'venue_coordinator'::app_role
  ])
);

drop policy if exists "alerts_member_read" on alerts;
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
    'delegate_coordinator'::app_role,
    'venue_coordinator'::app_role
  ])
);

drop policy if exists "alerts_dispatch_write" on alerts;
create policy "alerts_dispatch_write"
on alerts
for all
using (
  public.user_has_event_role(event_id, array['admin'::app_role, 'planner'::app_role, 'delegate_coordinator'::app_role, 'venue_coordinator'::app_role])
)
with check (
  public.user_has_event_role(event_id, array['admin'::app_role, 'planner'::app_role, 'delegate_coordinator'::app_role, 'venue_coordinator'::app_role])
);

drop policy if exists "notification_deliveries_read" on notification_deliveries;
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
        'delegate_coordinator'::app_role,
        'venue_coordinator'::app_role
      ])
  )
  or recipient_user_id = auth.uid()
);

drop policy if exists "recommendation_feedback_member_read" on recommendation_feedback;
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
    'delegate_coordinator'::app_role,
    'venue_coordinator'::app_role
  ])
);

drop policy if exists "recommendation_feedback_member_write" on recommendation_feedback;
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
    'delegate_coordinator'::app_role,
    'venue_coordinator'::app_role
  ])
);

drop policy if exists "venue_advisories_member_read" on venue_advisories;
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
    'delegate_coordinator'::app_role,
    'venue_coordinator'::app_role
  ])
);

drop policy if exists "venue_advisories_write" on venue_advisories;
create policy "venue_advisories_write"
on venue_advisories
for all
using (
  public.user_has_event_role(event_id, array['admin'::app_role, 'planner'::app_role, 'venue_coordinator'::app_role])
)
with check (
  public.user_has_event_role(event_id, array['admin'::app_role, 'planner'::app_role, 'venue_coordinator'::app_role])
);
