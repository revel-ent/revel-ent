-- Atlas triggers MVP foundation
-- Purpose:
-- 1) Add a read-optimized venue constraint profile to venues
-- 2) Persist trigger evaluations with idempotent fingerprints
-- 3) Persist role-based overrides as an immutable audit trail

create extension if not exists pgcrypto;

-- =====================================================
-- Venue profile cache
-- =====================================================

alter table if exists venues
  add column if not exists constraint_profile jsonb default '{
    "schemaVersion": "venue_constraints_v1",
    "operational": {
      "power": {
        "limited": false,
        "dedicatedDjCircuit": false,
        "generatorOnly": false,
        "outdoorAvailability": "unknown",
        "notes": []
      },
      "sound": {
        "curfew": {
          "type": "unknown",
          "localTime": null,
          "timezone": null
        },
        "outdoorAmplifiedMusicAllowed": false,
        "maxDb": null,
        "notes": []
      },
      "capacity": {
        "marketed": null,
        "comfortableAcousticMax": null,
        "overflowRecommendedAbove": null,
        "notes": []
      },
      "timeline": {
        "roomFlipMin": 90,
        "ceremonyToReceptionMin": null,
        "preSetSupported": false,
        "notes": []
      },
      "rigging": {
        "allowed": false,
        "maxClearanceFt": null,
        "notes": []
      },
      "ceiling": {
        "clearanceFt": null,
        "lowCeilingThresholdFt": 14,
        "notes": []
      },
      "outdoor": {
        "ceremonyAllowed": false,
        "baraatAllowed": false,
        "baraatRouteNotes": null,
        "weatherFallbackAvailable": false,
        "notes": []
      }
    },
    "confidence": {
      "overall": "estimated",
      "fields": {
        "power": "estimated",
        "sound": "estimated",
        "capacity": "estimated",
        "timeline": "estimated",
        "rigging": "estimated",
        "ceiling": "estimated",
        "outdoor": "estimated"
      }
    },
    "provenance": {
      "sourceLinks": [],
      "reviewedBy": null,
      "reviewedOn": null,
      "lastEvaluatedAt": null
    },
    "derived": {
      "activeTriggerKeys": [],
      "fingerprint": null
    }
  }'::jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'venues_constraint_profile_shape_check'
  ) then
    alter table venues
      add constraint venues_constraint_profile_shape_check
      check (
        constraint_profile ?& array['schemaVersion', 'operational', 'confidence', 'provenance', 'derived']
      );
  end if;
end
$$;

-- =====================================================
-- Evaluation logging
-- =====================================================

create table if not exists atlas_evaluations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (event_id) on delete cascade,
  venue_id uuid not null references venues (venue_id) on delete cascade,
  trigger_key text not null,
  grouped_recommendation_key text not null,
  fingerprint text not null,
  severity text not null,
  confidence numeric(5,4) not null,
  status text not null,
  evidence jsonb not null default '{}'::jsonb,
  recommendation_payload jsonb not null default '{}'::jsonb,
  missing_fields text[] not null default '{}'::text[],
  evaluated_by_source text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (fingerprint),
  check (severity in ('info', 'warning', 'critical')),
  check (confidence >= 0 and confidence <= 1),
  check (status in ('active', 'dismissed', 'accepted', 'snoozed', 'expired', 'superseded', 'needs_review', 'skipped', 'suppressed')),
  check (trigger_key in (
    'outdoor_power_or_curfew',
    'capacity_squeeze',
    'tight_room_flip',
    'rigging_or_ceiling_constraint'
  )),
  check (evaluated_by_source in ('api', 'worker', 'manual_refresh', 'backfill', 'dry_run'))
);

create index if not exists idx_atlas_evaluations_event_id on atlas_evaluations (event_id);
create index if not exists idx_atlas_evaluations_venue_id on atlas_evaluations (venue_id);
create index if not exists idx_atlas_evaluations_status on atlas_evaluations (status);

-- =====================================================
-- Override audit trail
-- =====================================================

create table if not exists atlas_overrides (
  id uuid primary key default gen_random_uuid(),
  evaluation_id uuid not null references atlas_evaluations (id) on delete cascade,
  event_id uuid not null references events (event_id) on delete cascade,
  venue_id uuid not null references venues (venue_id) on delete cascade,
  trigger_key text not null,
  actor_user_id uuid not null references auth.users (id) on delete cascade,
  actor_role app_role not null,
  action text not null,
  reason_code text,
  note text,
  snooze_until timestamptz,
  expires_at timestamptz,
  source_surface text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (action in ('dismiss', 'accept', 'snooze', 'force_on', 'force_off', 'expire')),
  check (source_surface in ('couple_dashboard', 'planner_dashboard', 'venue_workspace', 'live_mode', 'admin_console')),
  check ((action <> 'snooze') or snooze_until is not null),
  check ((action <> 'expire') or expires_at is not null),
  check (trigger_key in (
    'outdoor_power_or_curfew',
    'capacity_squeeze',
    'tight_room_flip',
    'rigging_or_ceiling_constraint'
  ))
);

create index if not exists idx_atlas_overrides_event_id on atlas_overrides (event_id);
create index if not exists idx_atlas_overrides_evaluation_id on atlas_overrides (evaluation_id);
create index if not exists idx_atlas_overrides_actor_user_id on atlas_overrides (actor_user_id);

-- =====================================================
-- Updated-at maintenance
-- =====================================================

create or replace function public.touch_atlas_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_atlas_evaluations_touch_updated_at on atlas_evaluations;
create trigger trg_atlas_evaluations_touch_updated_at
before update on atlas_evaluations
for each row
execute function public.touch_atlas_updated_at();

drop trigger if exists trg_atlas_overrides_touch_updated_at on atlas_overrides;
create trigger trg_atlas_overrides_touch_updated_at
before update on atlas_overrides
for each row
execute function public.touch_atlas_updated_at();

-- =====================================================
-- RLS
-- =====================================================

alter table if exists atlas_evaluations enable row level security;
alter table if exists atlas_overrides enable row level security;

drop policy if exists "atlas_evaluations_event_member_read" on atlas_evaluations;
create policy "atlas_evaluations_event_member_read"
on atlas_evaluations
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

drop policy if exists "atlas_overrides_event_member_read" on atlas_overrides;
create policy "atlas_overrides_event_member_read"
on atlas_overrides
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

drop policy if exists "atlas_overrides_member_insert" on atlas_overrides;
create policy "atlas_overrides_member_insert"
on atlas_overrides
for insert
with check (
  actor_user_id = auth.uid()
  and public.user_has_event_role(event_id, array[actor_role])
  and (
    (
      actor_role in ('admin'::app_role, 'planner'::app_role)
      and action in ('dismiss', 'accept', 'snooze', 'force_on', 'force_off', 'expire')
    )
    or (
      actor_role = 'couple'::app_role
      and action in ('dismiss', 'accept')
    )
    or (
      actor_role = 'venue_coordinator'::app_role
      and action in ('dismiss', 'snooze')
    )
  )
);

-- Review notes:
-- 1) constraint_profile is intentionally nullable/defaulted so existing venue rows remain valid.
-- 2) fingerprint is unique to enforce idempotent re-evaluation.
-- 3) indexes are intentionally lean for MVP.
-- 4) atlas_overrides is append-only in this foundation migration.