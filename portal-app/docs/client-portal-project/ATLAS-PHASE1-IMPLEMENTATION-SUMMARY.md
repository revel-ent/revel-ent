# ATLAS-PHASE1-IMPLEMENTATION-SUMMARY

## Updated ERD (Phase 1 MVP)
Organization
- organizations
- organization_users

Event Context
- events (now tenant-bound via organization_id)
- memberships (canonical alias view: event_memberships)
- roles (registry mapped to app_role enum)

Core Platform Data
- venues
- venue_intelligence_facts
- vendors
- event_venues
- event_vendors
- timelines

Auth chain in production intent (Alpha role-driven):
Organization -> Event -> EventMembership -> Role

## Migration Summary
Migration added:
- supabase/migrations/20260603103000_atlas_phase1_multitenant_mvp.sql

What it does (additive):
1. Creates organizations and organization_users.
2. Adds events.organization_id with Revel backfill and FK/index.
3. Creates user_has_organization_access helper for tenant checks.
4. Adds canonical event_memberships view over memberships.
5. Creates roles registry table (no permission tables).
6. Creates venue_intelligence_facts as first-class intelligence asset.
7. Creates vendors, event_vendors, and event_venues.
8. Backfills event_venues from existing events.venue_id.
9. Enables RLS and adds role-driven policies for new tables.

Assumptions captured:
- Existing memberships + app_role remain enforcement source in Alpha.
- Existing monetization tables are not required dependencies for this phase.
- Single Alpha org (Revel) is seeded, with schema prepared for multi-org growth.

## Auth Flow Summary (Phase 1)
1. User authenticates.
2. Session carries organizationId, eventId, role.
3. Backend resolves event membership through memberships/event_memberships.
4. Role-driven checks (user_has_event_role) enforce event access.
5. Organization-level checks use user_has_organization_access for tenant-bound resources.

Current code updates:
- mock-login now signs organizationId in session token.
- session payload and session helper now expose organizationId.
- mock data includes organizationId for events and members.

## Workspace Routing Summary (Phase 1)
Deterministic landing policy (unchanged in intent, now tenant-aware):
1. If URL has org/event and membership is active, route there.
2. Else route to last valid org+event context if present.
3. Else if one active membership, route directly to that event workspace.
4. Else show org/event picker.
5. Module landing remains role-driven in Alpha.

## Architectural Decisions Made During Implementation
1. EventMembership naming is introduced as a view, not a physical table rename.
2. Authorization remains role-driven; no permission tables/overrides in this phase.
3. Venue intelligence is modeled as durable first-class data now, not deferred.
4. Vendor-event relationships are relational now, not text fields.
5. Multi-tenant org context is added at schema and session layers early to avoid route/auth rewrites later.
