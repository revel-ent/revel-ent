-- Atlas workspace payment settings
-- Purpose:
-- 1) Persist event/workspace payment rail availability
-- 2) Enforce no-check policy at schema level
-- 3) Support Stripe and external-manual rails without mixing processing semantics

create table if not exists atlas_workspace_payment_settings (
  event_id uuid primary key references events (event_id) on delete cascade,
  allow_card boolean not null default true,
  allow_apple_google_pay boolean not null default true,
  allow_ach boolean not null default true,
  allow_zelle boolean not null default false,
  allow_venmo boolean not null default false,
  allow_cash_app boolean not null default false,
  accept_checks boolean not null default false,
  stripe_account_id text,
  zelle_handle text,
  venmo_handle text,
  cash_app_handle text,
  manual_payment_instructions text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (accept_checks = false)
);

create index if not exists idx_atlas_workspace_payment_settings_updated_at
  on atlas_workspace_payment_settings (updated_at desc);

create or replace function public.touch_atlas_workspace_payment_settings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_atlas_workspace_payment_settings_touch_updated_at on atlas_workspace_payment_settings;
create trigger trg_atlas_workspace_payment_settings_touch_updated_at
before update on atlas_workspace_payment_settings
for each row
execute function public.touch_atlas_workspace_payment_settings_updated_at();

alter table if exists atlas_workspace_payment_settings enable row level security;

drop policy if exists "atlas_workspace_payment_settings_event_member_read" on atlas_workspace_payment_settings;
create policy "atlas_workspace_payment_settings_event_member_read"
on atlas_workspace_payment_settings
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

drop policy if exists "atlas_workspace_payment_settings_manage" on atlas_workspace_payment_settings;
create policy "atlas_workspace_payment_settings_manage"
on atlas_workspace_payment_settings
for all
using (
  public.user_has_event_role(event_id, array['admin'::app_role, 'planner'::app_role, 'couple'::app_role])
)
with check (
  public.user_has_event_role(event_id, array['admin'::app_role, 'planner'::app_role, 'couple'::app_role])
  and accept_checks = false
);

-- Seed defaults for existing events based on mode.
insert into atlas_workspace_payment_settings (
  event_id,
  allow_card,
  allow_apple_google_pay,
  allow_ach,
  allow_zelle,
  allow_venmo,
  allow_cash_app,
  accept_checks
)
select
  e.event_id,
  true,
  true,
  true,
  case when e.atlas_mode = 'revel_managed' then true else false end,
  case when e.atlas_mode = 'revel_managed' then true else false end,
  case when e.atlas_mode = 'revel_managed' then true else false end,
  false
from events e
left join atlas_workspace_payment_settings s on s.event_id = e.event_id
where s.event_id is null
on conflict (event_id) do nothing;
