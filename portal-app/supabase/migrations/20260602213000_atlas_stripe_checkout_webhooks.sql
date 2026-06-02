-- Atlas Stripe checkout + webhook pipeline foundation
-- Purpose:
-- 1) Persist Stripe customer mapping at the workspace/event boundary
-- 2) Persist Stripe checkout session lifecycle for reconciliation
-- 3) Persist webhook deliveries for idempotency + audit trail

create table if not exists atlas_workspace_stripe_customers (
  event_id uuid primary key references events (event_id) on delete cascade,
  stripe_customer_id text not null unique,
  created_by_user_id text,
  updated_by_user_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_atlas_workspace_stripe_customers_updated_at
  on atlas_workspace_stripe_customers (updated_at desc);

create table if not exists atlas_workspace_stripe_checkout_sessions (
  event_id uuid not null references events (event_id) on delete cascade,
  stripe_checkout_session_id text primary key,
  stripe_customer_id text,
  stripe_payment_intent_id text,
  workspace_plan atlas_workspace_plan,
  amount_cents integer,
  currency text,
  status text not null default 'open',
  checkout_url text,
  payment_status text,
  initiated_by_user_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_atlas_workspace_stripe_checkout_sessions_event
  on atlas_workspace_stripe_checkout_sessions (event_id, updated_at desc);

create index if not exists idx_atlas_workspace_stripe_checkout_sessions_pi
  on atlas_workspace_stripe_checkout_sessions (stripe_payment_intent_id);

create table if not exists atlas_workspace_stripe_webhook_events (
  stripe_event_id text primary key,
  stripe_event_type text not null,
  livemode boolean not null default false,
  event_id uuid references events (event_id) on delete set null,
  processing_status text not null default 'processed',
  error_message text,
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_atlas_workspace_stripe_webhook_events_event
  on atlas_workspace_stripe_webhook_events (event_id, processed_at desc);

create or replace function public.touch_atlas_workspace_stripe_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_atlas_workspace_stripe_customers_touch_updated_at on atlas_workspace_stripe_customers;
create trigger trg_atlas_workspace_stripe_customers_touch_updated_at
before update on atlas_workspace_stripe_customers
for each row
execute function public.touch_atlas_workspace_stripe_updated_at();

drop trigger if exists trg_atlas_workspace_stripe_checkout_sessions_touch_updated_at on atlas_workspace_stripe_checkout_sessions;
create trigger trg_atlas_workspace_stripe_checkout_sessions_touch_updated_at
before update on atlas_workspace_stripe_checkout_sessions
for each row
execute function public.touch_atlas_workspace_stripe_updated_at();

alter table if exists atlas_workspace_stripe_customers enable row level security;
alter table if exists atlas_workspace_stripe_checkout_sessions enable row level security;
alter table if exists atlas_workspace_stripe_webhook_events enable row level security;

drop policy if exists "atlas_workspace_stripe_customers_read" on atlas_workspace_stripe_customers;
create policy "atlas_workspace_stripe_customers_read"
on atlas_workspace_stripe_customers
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

drop policy if exists "atlas_workspace_stripe_customers_manage" on atlas_workspace_stripe_customers;
create policy "atlas_workspace_stripe_customers_manage"
on atlas_workspace_stripe_customers
for all
using (
  public.user_has_event_role(event_id, array['admin'::app_role, 'planner'::app_role, 'couple'::app_role])
)
with check (
  public.user_has_event_role(event_id, array['admin'::app_role, 'planner'::app_role, 'couple'::app_role])
);

drop policy if exists "atlas_workspace_stripe_checkout_sessions_read" on atlas_workspace_stripe_checkout_sessions;
create policy "atlas_workspace_stripe_checkout_sessions_read"
on atlas_workspace_stripe_checkout_sessions
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

drop policy if exists "atlas_workspace_stripe_checkout_sessions_manage" on atlas_workspace_stripe_checkout_sessions;
create policy "atlas_workspace_stripe_checkout_sessions_manage"
on atlas_workspace_stripe_checkout_sessions
for all
using (
  public.user_has_event_role(event_id, array['admin'::app_role, 'planner'::app_role, 'couple'::app_role])
)
with check (
  public.user_has_event_role(event_id, array['admin'::app_role, 'planner'::app_role, 'couple'::app_role])
);

drop policy if exists "atlas_workspace_stripe_webhook_events_read" on atlas_workspace_stripe_webhook_events;
create policy "atlas_workspace_stripe_webhook_events_read"
on atlas_workspace_stripe_webhook_events
for select
using (
  event_id is null
  or public.user_has_event_role(event_id, array['admin'::app_role, 'planner'::app_role, 'couple'::app_role])
);
