# Supabase Ops Playbook (REVEL Portal)

## Purpose

This playbook enables fast setup and reliable operation of REVEL onboarding persistence and RBAC policies.

## Minimum Inputs Needed

1. Supabase project URL
2. Supabase anon key
3. Supabase service role key

These map to:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Project Setup Steps

1. Create Supabase project (new or existing).
2. Open SQL Editor and run:
   - `portal-app/supabase/001_revel_foundation.sql`
   - `portal-app/supabase/002_revel_rls_baseline.sql`
3. Add env vars into local `.env.local` and Vercel project settings.
4. Restart local app and test onboarding approval flow.

## Verification Checklist

1. `POST /api/onboarding/timeline/generate` returns timeline with `templateSource`.
2. `POST /api/onboarding/timeline/approve` returns `mode = supabase`.
3. `events` table gets a new row.
4. `timelines` table gets generated rows tied to `event_id`.
5. Delegate coordinator role can read timeline and (during day-of window) perform limited updates.

## Known Fallback Behavior

If Supabase env vars are missing, onboarding still works in simulation mode:

- timeline is generated
- approval returns success response
- no persistent DB write occurs

This is intentional for local UX iteration before infra is configured.

## Security Notes

1. Keep `SUPABASE_SERVICE_ROLE_KEY` server-only.
2. Use RLS as source of truth for data access.
3. Keep day-of coordinator write windows bounded (`day_of_window_start`, `day_of_window_end`).
4. Audit all timeline status updates in production follow-up migration.

## Next Migration Priorities

1. Add `timeline_updates` audit table with actor + before/after status.
2. Add restricted Postgres function for delegate coordinator status updates.
3. Add event invite token flow for Pass the Baton links.
