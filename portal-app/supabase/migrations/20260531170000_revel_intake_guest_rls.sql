-- REVEL intake + guest request RLS hardening
-- Purpose:
-- 1) Enable RLS on new persistence tables
-- 2) Apply event-scoped policies aligned with canonical role matrix

alter table intake_documents enable row level security;
alter table guest_requests enable row level security;

-- Cleanup for idempotent reruns.
drop policy if exists "intake_documents_planner_admin_read" on intake_documents;
drop policy if exists "intake_documents_planner_admin_insert" on intake_documents;
drop policy if exists "intake_documents_planner_admin_update" on intake_documents;
drop policy if exists "intake_documents_planner_admin_delete" on intake_documents;

drop policy if exists "guest_requests_planner_admin_read" on guest_requests;
drop policy if exists "guest_requests_event_member_insert" on guest_requests;
drop policy if exists "guest_requests_planner_admin_update" on guest_requests;
drop policy if exists "guest_requests_planner_admin_delete" on guest_requests;

-- Intake documents: planner/admin can read and manage within their event.
create policy "intake_documents_planner_admin_read"
on intake_documents
for select
using (
  public.user_has_event_role(event_id, array['admin'::app_role, 'planner'::app_role])
);

create policy "intake_documents_planner_admin_insert"
on intake_documents
for insert
with check (
  public.user_has_event_role(event_id, array['admin'::app_role, 'planner'::app_role])
);

create policy "intake_documents_planner_admin_update"
on intake_documents
for update
using (
  public.user_has_event_role(event_id, array['admin'::app_role, 'planner'::app_role])
)
with check (
  public.user_has_event_role(event_id, array['admin'::app_role, 'planner'::app_role])
);

create policy "intake_documents_planner_admin_delete"
on intake_documents
for delete
using (
  public.user_has_event_role(event_id, array['admin'::app_role, 'planner'::app_role])
);

-- Guest requests:
-- 1) guest/couple/delegate/planner/admin can create for their own event
-- 2) planner/admin can read and manage for their event
create policy "guest_requests_planner_admin_read"
on guest_requests
for select
using (
  public.user_has_event_role(event_id, array['admin'::app_role, 'planner'::app_role])
);

create policy "guest_requests_event_member_insert"
on guest_requests
for insert
with check (
  actor_user_id = auth.uid()
  and public.user_has_event_role(event_id, array[
    'admin'::app_role,
    'planner'::app_role,
    'guest'::app_role,
    'couple'::app_role,
    'delegate_coordinator'::app_role
  ])
  and public.user_has_event_role(event_id, array[actor_role])
);

create policy "guest_requests_planner_admin_update"
on guest_requests
for update
using (
  public.user_has_event_role(event_id, array['admin'::app_role, 'planner'::app_role])
)
with check (
  public.user_has_event_role(event_id, array['admin'::app_role, 'planner'::app_role])
);

create policy "guest_requests_planner_admin_delete"
on guest_requests
for delete
using (
  public.user_has_event_role(event_id, array['admin'::app_role, 'planner'::app_role])
);
