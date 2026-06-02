# ATLAS-DB-FOUNDATION-DELTA

## Scope
Review-only package to align Atlas schema and domain types with the strategy lock in:
- ATLAS-SOURCE-OF-TRUTH
- ATLAS-MONETIZATION-MODEL

No production apply has been performed in this step.

## Files Added/Updated
- supabase/migrations/20260602121000_atlas_workspace_foundation.sql
- lib/atlas-types.ts

## What This Delta Introduces
1. Workspace commercial mode on events (`revel_managed` or `independent`).
2. Independent plan tier (`essential`, `pro`, `premium`).
3. Billing state primitive (`included`, `trialing`, `active`, `past_due`, `canceled`).
4. Workspace ownership fields on events (owner user + owner role).
5. Entitlement snapshot field on events for resolved capability state.
6. Entitlement templates table for policy defaults by mode/plan.
7. Immutable entitlement transition audit table with RLS read/insert policies.

## Strategy-to-Schema Mapping
- Canonical event mode field and ownership model: `events.atlas_mode`, owner fields.
- Entitlement templates by mode and plan: `atlas_entitlement_templates`.
- Policy mapping between billing state and role permissions: stored via event fields + snapshots, consumed by policy/application layers in next phase.
- Audit model for overrides and entitlement transitions: `atlas_entitlement_audit`.

## Zero-Downtime Notes
- Additive only (new columns/tables/types, no destructive renames).
- Existing rows remain valid through defaults/backfill.
- No existing route permission policies are changed in this migration.

## Backfill Behavior
- `events.atlas_workspace_owner_user_id` is backfilled from `events.created_by` when present.
- `events.atlas_workspace_owner_role` is inferred from memberships in priority order: `admin` -> `planner` -> `couple`.
- Remaining null owner roles default to `admin`.

## Rollout Order (Recommended)
1. Apply migration in staging.
2. Add API write/read support for new event commercial fields.
3. Add entitlement resolver in application layer using template + mode/plan.
4. Add UI controls in admin/planner/couple surfaces with explicit audit writes.
5. Validate independent/revel-managed mode transitions and billing state changes.
6. Apply to production during a low-traffic window.

## Rollback Plan
- If needed, disable writes to new fields/features in application layer first.
- Keep additive schema in place (safe rollback path) and revert app behavior by deploy.
- Avoid dropping new columns/tables until data retention decisions are approved.