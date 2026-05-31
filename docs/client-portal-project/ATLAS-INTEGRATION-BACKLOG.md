# ATLAS Integration Backlog

## Purpose

Track all remaining work to turn the separate Atlas venue intelligence repo into a durable, trusted intelligence layer inside the portal.

## Completed

- Atlas source repo inspected: `C:/Users/17065/Projects/atlas-capacity-engine`
- Primary venue source identified: `src/lib/venues/venue_presets.ts`
- Capacity logic source identified: `src/lib/logic/capacity-math.ts`
- Portal importer pipeline added in `portal-app/scripts/import-atlas-venues.ts`
- Package scripts added for Atlas snapshot, SQL export, and direct apply modes

## Immediate Next Steps

- Run `npm run atlas:import:snapshot` and review normalized venue payload
- Run `npm run atlas:import:sql` and keep generated SQL under source review before live apply
- Provide `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in the shell used for `npm run atlas:import:apply`
- Upsert Atlas venues into `venues` and `venue_constraints`
- Verify imported rows in Supabase for `InterContinental Buckhead`, `Grand Hyatt Atlanta in Buckhead`, and `Westin Perimeter North`

## Data Model Follow-Ups

- Add a dedicated `atlas_room_type` or `space_type` field if room-level segmentation becomes important
- Add explicit `field_sources` JSONB column if provenance needs first-class querying beyond the current `provenance` blob
- Add `diagram_status` derived field for fast filtering (`available`, `missing`, `stale`)
- Add `client_safe_summary` field for curated portal output separate from vendor/planner detail
- Add `last_synced_from_atlas_at` and `atlas_source_version` for auditability

## Import / Sync Follow-Ups

- Add deletion/archive handling for venues removed from the Atlas repo
- Add nightly or manual re-sync workflow instead of one-shot import only
- Add dry-run diff output showing changed venues/constraints before apply
- Add import tests covering address parsing, provenance mapping, and constraint generation
- Add import logging table in Supabase for run history and error tracking

## Product Integration Follow-Ups

- Replace or reconcile the simplified local stub in `portal-app/lib/atlas-venues.ts`
- Wrap Atlas capacity logic in a typed service instead of exposing raw repo internals directly
- Surface planner-only feasibility checks before exposing couple-safe summaries
- Use Atlas constraints in onboarding timeline generation and approval warnings
- Use Atlas signals for contextual upsells tied to actual venue limitations
- Add venue-coordinator read/write slices powered by imported constraints

## Trust and Governance Follow-Ups

- Mark every imported field with visible confidence and last-verified metadata in planner tools
- Create correction-review workflow for vendor/planner submitted updates
- Add stale-data thresholds and warning badges when verification ages out
- Define which Atlas fields are internal-only versus couple-safe versus guest-safe
- Add policy for source links and external document retention

## Engineering Follow-Ups

- Add unit tests for `capacity-math.ts` behavior after wrapping it in the portal service layer
- Add Supabase SQL seed or materialized import artifact for repeatable environment setup
- Consider moving Atlas data to a shared package or export artifact to avoid brittle cross-repo imports
- Add feature flags for Atlas-powered recommendations in client-facing screens
- Add analytics for Atlas recommendation impressions, dismissals, approvals, and overrides

## Launch Checklist Before Atlas Goes Live in Client Workflows

- Top 10 venues verified by hand against current documents
- Import script tested against production-like environment
- Planner-facing venue view reviewed for clarity and trust
- Couple-facing Atlas summaries reviewed for tone and overexposure risk
- Escalation path defined when Atlas data conflicts with venue sales claims