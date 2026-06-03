-- Atlas Phase 2: production invite lifecycle
-- Grounded in canonical chain:
-- Organization -> Event -> EventMembership -> Invite Token -> User Accepts -> Role Assigned

create extension if not exists pgcrypto;

create table if not exists invite_tokens (
  token_id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (organization_id) on delete cascade,
  event_id uuid not null references events (event_id) on delete cascade,
  membership_id uuid not null references memberships (membership_id) on delete cascade,
  invitee_email text not null,
  invitee_display_name text,
  target_role app_role not null,
  role_profile text not null default 'general',
  token_hash text not null unique,
  status text not null default 'generated',
  delivery_channel text not null default 'email',
  delivery_provider text,
  delivery_reference text,
  delivered_at timestamptz,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  accepted_by_user_id text,
  revoked_at timestamptz,
  revoked_by_user_id text,
  created_by_user_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('generated', 'delivered', 'accepted', 'expired', 'revoked')),
  check (delivery_channel in ('email')),
  check (role_profile in ('general', 'decorator', 'dj_mc', 'production')),
  check (expires_at > created_at)
);

create index if not exists idx_invite_tokens_event_status
  on invite_tokens (event_id, status, created_at desc);

create index if not exists idx_invite_tokens_membership
  on invite_tokens (membership_id, created_at desc);

create index if not exists idx_invite_tokens_email
  on invite_tokens (invitee_email, created_at desc);

create table if not exists invite_audit_events (
  audit_id uuid primary key default gen_random_uuid(),
  token_id uuid references invite_tokens (token_id) on delete cascade,
  organization_id uuid not null references organizations (organization_id) on delete cascade,
  event_id uuid not null references events (event_id) on delete cascade,
  membership_id uuid references memberships (membership_id) on delete set null,
  actor_user_id text,
  actor_role app_role,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (event_type in (
    'invite_generated',
    'invite_delivered',
    'invite_delivery_failed',
    'invite_accepted',
    'invite_expired',
    'invite_revoked',
    'membership_role_changed'
  ))
);

create index if not exists idx_invite_audit_events_event
  on invite_audit_events (event_id, created_at desc);

create index if not exists idx_invite_audit_events_token
  on invite_audit_events (token_id, created_at desc);

create or replace function public.touch_invite_lifecycle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_invite_tokens_touch_updated_at on invite_tokens;
create trigger trg_invite_tokens_touch_updated_at
before update on invite_tokens
for each row
execute function public.touch_invite_lifecycle_updated_at();

alter table if exists invite_tokens enable row level security;
alter table if exists invite_audit_events enable row level security;

drop policy if exists "invite_tokens_event_member_read" on invite_tokens;
create policy "invite_tokens_event_member_read"
on invite_tokens
for select
using (
  public.user_has_event_role(event_id, array['admin'::app_role, 'planner'::app_role, 'couple'::app_role])
);

drop policy if exists "invite_tokens_manage" on invite_tokens;
create policy "invite_tokens_manage"
on invite_tokens
for all
using (
  public.user_has_event_role(event_id, array['admin'::app_role, 'planner'::app_role, 'couple'::app_role])
)
with check (
  public.user_has_event_role(event_id, array['admin'::app_role, 'planner'::app_role, 'couple'::app_role])
);

drop policy if exists "invite_audit_events_event_member_read" on invite_audit_events;
create policy "invite_audit_events_event_member_read"
on invite_audit_events
for select
using (
  public.user_has_event_role(event_id, array['admin'::app_role, 'planner'::app_role, 'couple'::app_role])
);

drop policy if exists "invite_audit_events_insert_manage" on invite_audit_events;
create policy "invite_audit_events_insert_manage"
on invite_audit_events
for insert
with check (
  public.user_has_event_role(event_id, array['admin'::app_role, 'planner'::app_role, 'couple'::app_role])
);
