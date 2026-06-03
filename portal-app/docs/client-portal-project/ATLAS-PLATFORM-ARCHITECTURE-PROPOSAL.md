# ATLAS-PLATFORM-ARCHITECTURE-PROPOSAL

## Scope
This proposal defines Atlas as a standalone multi-tenant Event Intelligence Platform where Revel is the Alpha tenant, not a special-case code path. It supersedes event-code-centric assumptions and prepares for production invite/auth lifecycle work.

Grounding note: this proposal is based on the existing Atlas/Revel schema and migrations already in this repo (including memberships, events, venues, timelines, workspace commercial mode, and payment settings), not a greenfield redesign.

## Design guardrails (Alpha practicality)
- Start with the simplest model that satisfies current requirements and known near-term expansion.
- Prefer additive schema evolution over broad foundational rewrites.
- Keep flexibility where change is likely (role-permission mappings) and keep code-owned decisions where behavior is product-critical (workspace routing policy, billing gates).
- Avoid full enterprise ABAC/RBAC engines in Alpha.

### Target complexity boundary for Alpha
Core tables should stay close to this shape before Phase 2 expansion:
- organizations
- organization_users
- events
- event_memberships
- roles
- permissions
- membership_roles
- invites (invite_tokens)
- venues
- vendors
Supporting tables can be added only when directly justified by shipped capability.

## 1) ERD and Canonical Schema

### Logical ERD (core)
Organization
- has many OrganizationUsers
- has many Events
- has many OrganizationRoles (optional custom)

User
- has many OrganizationUsers
- has many EventMemberships
- has many InviteTokens (accepted_by)

OrganizationUser
- joins User to Organization
- can hold organization-scoped roles/permissions

Event
- belongs to Organization
- has many EventMemberships
- references global entities through junction tables

EventMembership
- joins User to Event
- attaches role assignments and policy bindings

Role
- global or organization-scoped role definition

Permission
- atomic action, resource, scope tuple

RolePermission
- many-to-many role to permission mapping

MembershipRole
- many-to-many event membership to role mapping

MembershipPermissionOverride
- optional allow/deny overrides for edge cases

### Logical ERD (global data layer)
Venue (global)
- has many VenueSpaces
- has many VenueAssets
- has many VenueIntelligenceFacts
- has many EventVenues (event links)

Vendor (global)
- has many VendorServices
- has many VendorAssets
- has many EventVendors (event links)

Template (global)
- reusable event and timeline templates

Asset (global)
- media and documents, linked by polymorphic refs

### Proposed core tables (new or evolved)
- organizations
- organization_users
- events (add organization_id and workspace metadata)
- event_memberships
- roles
- permissions
- role_permissions
- membership_roles
- membership_permission_overrides
- invite_tokens
- audit_log

## 2) Organization / Event / User / Membership model

### organizations
- organization_id uuid pk
- org_type text check in (revel, planning_company, venue_group, corporate, independent)
- display_name text
- status text check in (active, suspended, archived)
- billing_owner_user_id uuid null
- metadata jsonb
- created_at, updated_at

### organization_users
- organization_user_id uuid pk
- organization_id fk organizations
- user_id fk auth.users
- status text check in (invited, active, suspended)
- joined_at, last_active_at
- unique (organization_id, user_id)

### events
- event_id uuid pk
- organization_id fk organizations not null
- atlas_mode enum (revel_managed, independent)
- workspace_plan enum (essential, pro, premium)
- billing_state enum (included, trialing, active, past_due, canceled)
- workspace_owner_user_id fk auth.users
- starts_on, ends_on
- status
- metadata jsonb

### event_memberships
- membership_id uuid pk
- event_id fk events
- user_id fk auth.users
- status text check in (invited, active, revoked)
- invited_by_user_id
- invited_at, accepted_at, revoked_at
- access_window_start, access_window_end null
- unique (event_id, user_id)

Notes:
- One person can belong to many events and many organizations.
- Roles are attached through membership_roles so role sets are extensible.

## 3) Global Data Layer schema

### venues (global canonical)
Public profile fields:
- venue_id uuid pk
- name, address_line1, city, state, postal_code, country
- geo_point
- published_capacity int
- public_amenities jsonb
- public_description text
- verified_status

### venue_spaces
- venue_space_id uuid pk
- venue_id fk venues
- space_name
- capacity_standing, capacity_seated
- dimensions jsonb

### venue_assets
- venue_asset_id uuid pk
- venue_id fk venues
- asset_type (photo, floorplan, spec_sheet)
- asset_url
- visibility_scope (public, org_internal, atlas_internal)

### venue_intelligence_facts (strategic layer)
- fact_id uuid pk
- venue_id fk venues
- fact_category (load_in, power, rigging, policy, risk, recommendation, historical_note)
- fact_key text
- fact_value jsonb
- confidence_score numeric
- source_type (field_observation, vendor_packet, user_report, inferred)
- source_ref text
- visibility_scope (org_internal, atlas_internal)
- created_by_user_id
- approved_by_user_id null
- created_at, updated_at

### event_venues
- event_id fk events
- venue_id fk venues
- relationship_type (primary, ceremony, reception, backup)
- notes
- unique (event_id, venue_id, relationship_type)

Parallel pattern for vendors:
- vendors
- vendor_services
- vendor_assets
- event_vendors

## 4) Permission model

Recommendation: Hybrid authorization.
- Roles for ergonomics and default bundles.
- Permissions for precision and future expansion.

### Role storage options and tradeoffs
Option A: enum roles only
- Pros: fast, simple constraints, easy RLS checks.
- Cons: migration-heavy for every new role, poor tenant customization, brittle at scale.

Option B: free-form string roles
- Pros: flexible, low migration overhead.
- Cons: weak integrity guarantees, typo risk, inconsistent semantics across tenants.

Option C: dedicated roles table only
- Pros: strongest extensibility and tenant-specific roles.
- Cons: more joins and policy complexity, can be overkill if introduced too early.

Option D: hybrid (recommended)
- Keep current enum during transition for compatibility.
- Introduce roles table + membership_roles for extensibility.
- Gradually move enforcement toward role/permission tables, then retire enum dependence.

Recommendation: Option D, phased. This minimizes rewrite risk while avoiding long-term lock-in.

### permissions (atomic)
Columns:
- permission_id uuid pk
- resource text (event, timeline, venue_intelligence, billing, invite, asset, vendor)
- action text (read, create, update, delete, approve, dispatch)
- scope text (org, event, own_assignment, public)
- unique (resource, action, scope)

### roles
Columns:
- role_id uuid pk
- role_key text unique
- role_scope text (platform, organization, event)
- is_system boolean
- organization_id null for global system roles

### mapping tables
- role_permissions(role_id, permission_id)
- membership_roles(membership_id, role_id)
- membership_permission_overrides(membership_id, permission_id, effect allow|deny, reason)

### Access evaluation order
1. Resolve tenant context (organization, event).
2. Resolve active membership for event.
3. Aggregate role permissions.
4. Apply explicit deny overrides, then allow overrides.
5. Apply temporal constraints (day-of windows).
6. Enforce RLS and API policy checks.

### Configuration-time vs code-time flexibility boundary
Configuration-time (data-driven):
- Role definitions and role-permission mappings.
- Tenant-specific role clones.
- Invite templates and notification routing rules.

Code-time (application-owned):
- Workspace landing algorithm priority rules.
- Sensitive escalation policies and billing gate transitions.
- Security invariants (token consumption semantics, lockout/rate-limit behavior).

## 5) Workspace routing architecture

Single platform routing with context resolver, not separate portals.

### URL model
- /app
- /app/o/:organizationSlug
- /app/o/:organizationSlug/e/:eventSlug
- /app/o/:organizationSlug/e/:eventSlug/workspace
- /app/o/:organizationSlug/e/:eventSlug/modules/:moduleKey

### Route resolution flow
1. Authenticate user.
2. Resolve organization and event from URL or last-active context.
3. Load event_membership and role/permission graph.
4. Return workspace shell with module cards filtered by permission.
5. Deep links gate by permission, not by hardcoded role name.

### Workspace landing logic (explicit)
Goal: route authenticated users into the correct Atlas experience based on event relationship, not URL presence alone.

Proposed deterministic algorithm:
1. If URL includes organization and event and user has active membership, load that workspace.
2. Else, load last-active event membership in same organization if valid.
3. Else, if only one active event membership exists, route there.
4. Else, route to event picker scoped to organizations the user belongs to.
5. Inside an event workspace, compute default module by highest-priority permission bundle (for example timeline.control before guest.concierge).
6. Persist selected context to user preference for next login.

This section intentionally defines workspace routing behavior, not only URL structure.

### Module registry pattern
Use module capability keys:
- timeline.control
- venue.intelligence
- vendor.coordination
- guest.concierge
- billing.workspace
This avoids role-name coupling in route code.

## 6) Migration strategy from current structure

Current schema has a strong event-first core with memberships, events, venues, timeline, and initial workspace commercial fields. Migration should be additive and staged.

### Phase 0: Freeze and align naming
- Freeze new enum proliferation.
- Standardize role semantics between SQL and app code.
- Introduce canonical role registry table before changing existing policy behavior.
- Document and reconcile existing role-name drift between SQL enum values and TypeScript role keys before any new auth migration.

### Phase 1: Introduce organizations layer (additive)
- Create organizations and organization_users.
- Add events.organization_id nullable, backfill to Revel org, then set not null.
- Add indexes and RLS helpers for organization scope.

### Phase 2: Introduce hybrid RBAC tables (additive)
- Create roles, permissions, role_permissions, membership_roles, overrides.
- Backfill membership_roles from legacy memberships.role.
- Keep existing memberships.role temporarily for compatibility.

### Phase 3: Global data layer normalization
- Evolve venues into global canonical model.
- Add event_venues and event_vendors junction tables.
- Migrate event direct text references to relation ids.

### Phase 4: Permission-first enforcement
- Introduce policy helper function user_has_permission(event_id, resource, action, scope).
- Gradually update RLS policies and API guards from role checks to permission checks.
- Keep role-based fallback during transition.

### Phase 5: Legacy column deprecation
- After parity validation, deprecate direct role enum dependence in APIs.
- Remove legacy-only columns and old policy functions.

### Migration safety principles
- Additive first, no destructive rewrite in early phases.
- Backfill scripts idempotent.
- Dual-read period for role and permission checks.
- Feature flags for policy cutover.

## 7) Role vs permission recommendation

Best fit for Atlas: Hybrid model.

Why:
- Pure role-based cannot scale to nuanced cross-industry event operations.
- Pure permission-based is too heavy for operations and onboarding UX.
- Hybrid provides operational clarity and granular security.

Recommended default role bundles (system roles)
- workspace_owner
- planner_lead
- couple_lead
- venue_operator
- vendor_operator
- production_operator
- guest_viewer
- org_admin

These are seed bundles only. Custom organization roles should be supported through role cloning and permission edits.

## Anti-overengineering checks
Reject proposals in Alpha that require:
- 20+ new access-control tables before invite lifecycle ships.
- Fully dynamic policy expression languages.
- Cross-tenant custom policy compilers.

Require each new auth table to map to an immediate product capability in this sequence:
1. Multi-tenant organization context
2. Event membership lifecycle
3. Invite issuance and consumption
4. Permission-aware workspace/module gating

## Policy constraints to lock now
- No role keys hardcoded in route access checks.
- No event-code or shared credential assumptions in auth model.
- All reusable entities (venues, vendors, templates, assets) modeled as global resources with junctions.
- Intelligence layer has explicit visibility scopes and audit trail.
- RLS policy helpers are permission-aware and tenant-aware.

## Proposed decision checkpoint
Approve this architecture before implementing production invite lifecycle tables and endpoints. Invite system should then bind to:
- organizations
- event_memberships
- membership_roles
- invite_tokens
- audit_log
with billing gate checks at organization/event level.

## Phase 1 Implementation Decisions (Real-Time Log)

### Decision 1: Canonical event-membership naming without breaking existing table contracts
- Choice made: keep memberships as the physical table for compatibility and add event_memberships as a canonical SQL view.
- Why: avoids immediate rewrite risk in existing RLS/functions/API while aligning architecture language to Organization -> Event -> EventMembership -> Role.
- Expansion impact: low; physical-table rename can be deferred until post-Alpha with zero behavior change.

### Decision 2: Role-driven authorization remains source of truth in Alpha
- Choice made: no permissions tables or overrides in Phase 1; roles table is a registry mapped to existing app_role enum.
- Why: preserves simple enforcement and keeps policy behavior stable during multi-tenant foundation rollout.
- Expansion impact: medium-positive; permissions can be layered later without refactoring the auth chain.

### Decision 3: Organization context added to auth/session for workspace routing correctness
- Choice made: add organization_id at event level in schema and propagate organizationId in session payload.
- Why: workspace routing requires explicit tenant context to avoid ambiguous event-only assumptions.
- Expansion impact: high-positive; prevents tenant-boundary routing issues as multiple orgs go live.

### Decision 4: Venue intelligence facts introduced as first-class table in MVP
- Choice made: create venue_intelligence_facts with scoped visibility and lineage fields.
- Why: venue intelligence is a core differentiator and must be modeled as durable platform data from day one.
- Expansion impact: high-positive; supports accumulation of strategic operational intelligence across events.

### Decision 5: Monetization-specific tables intentionally not part of Phase 1 dependency path
- Choice made: Phase 1 migration does not depend on atlas_workspace_payment_settings or atlas_entitlement_templates.
- Why: keeps MVP focused on core platform value and auth chain while preserving additive path for billing later.
- Expansion impact: low risk; minimal commercial fields remain available on events for forward compatibility.

### Decision 6: Production invite lifecycle starts from role-driven chain, not permission engine
- Choice made: implement invite lifecycle on Organization -> Event -> EventMembership -> Invite Token -> User Accepts -> Role Assigned.
- Why: this is the minimum production-safe path aligned with current app_role + memberships enforcement.
- Expansion impact: positive; permission tables can be added later without redesigning invite acceptance semantics.

### Decision 7: Decorator/DJ/Production onboarding uses vendor role profile in Alpha
- Choice made: keep app_role unchanged in first production invite release; map decorator/dj_mc/production to vendor with role_profile metadata.
- Why: avoids enum/RLS churn before distinct access patterns are proven.
- Expansion impact: medium-positive; first-class roles can be introduced only when policy divergence is operationally validated.

### Decision 8: Invite lifecycle tables use token hashing and immutable audit records
- Choice made: introduce invite_tokens (hashed token values, lifecycle status) and invite_audit_events (immutable event log).
- Why: status fields alone are insufficient for traceability, incident response, and operational debugging.
- Expansion impact: high-positive; supports compliance-grade invite provenance without changing auth chain semantics.

### Decision 9: Role assignment remains role-driven via memberships during invite acceptance
- Choice made: invite acceptance writes directly to memberships role/active/accepted_at and issues session claims from that role.
- Why: keeps chain aligned with current runtime authorization model and avoids introducing permission tables early.
- Expansion impact: medium-positive; permission layer can later consume same membership anchor.

### Decision 10: Organization context is validated at invite issuance and acceptance boundaries
- Choice made: invite token always carries organization_id + event_id + membership_id binding, and acceptance enforces that bound context.
- Why: prevents cross-tenant token replay and preserves workspace routing integrity.
- Expansion impact: high-positive; multi-tenant isolation becomes explicit at lifecycle boundary.