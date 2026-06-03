# ATLAS-PHASE2-INVITE-LIFECYCLE-IMPLEMENTATION-SUMMARY

## Migration summary
Added migration:
- supabase/migrations/20260603114000_atlas_invite_lifecycle_phase2.sql

What was added:
1. invite_tokens
- Stores org/event/membership-bound invite lifecycle records.
- Stores token_hash (never plaintext token) and lifecycle status.
- Tracks generated/delivered/accepted/expired/revoked transitions.
- Tracks delivery, expiry, acceptance actor, and revocation actor metadata.

2. invite_audit_events
- Immutable audit stream for invite lifecycle and membership role change events.
- Supports: invite_generated, invite_delivered, invite_delivery_failed, invite_accepted, invite_expired, invite_revoked, membership_role_changed.

3. RLS policies (role-driven)
- invite_tokens_event_member_read
- invite_tokens_manage
- invite_audit_events_event_member_read
- invite_audit_events_insert_manage

## API summary
Implemented endpoints:
1. POST /api/events/invites
- Generate invite token for event membership, deliver (simulated provider), write generated+delivered audit events.

2. GET /api/events/invites
- List invite lifecycle records for current event context.

3. POST /api/events/invites/:tokenId/resend
- Revoke existing pending token, issue new token, simulate delivery, write revoke/generate/deliver audit events.

4. POST /api/events/invites/:tokenId/revoke
- Revoke token; if already accepted, deactivate membership and audit deactivation.

5. POST /api/invites/accept
- Validate token hash/email binding/status/expiry, mark accepted, activate membership role, issue session, write acceptance audit.

6. PATCH /api/events/memberships/:membershipId/role
- Role transition endpoint with actor guardrails and membership_role_changed audit.

Shared lifecycle helper:
- lib/invite-lifecycle.ts

## Invite state machine
State set:
- generated
- delivered
- accepted
- expired
- revoked

Transitions:
1. generated -> delivered
- Trigger: successful delivery write during invite creation or resend.

2. delivered -> accepted
- Trigger: invite acceptance endpoint validates token and email and activates membership.

3. generated|delivered -> expired
- Trigger: acceptance attempt after expires_at (status persisted to expired).

4. generated|delivered -> revoked
- Trigger: explicit revoke endpoint or resend replacement flow.

5. accepted -> revoked
- Trigger: explicit revoke endpoint after acceptance; membership is deactivated.

Terminal behavior:
- accepted, revoked, expired are terminal for that token instance.
- resend always creates a fresh token instance.

## Auth and role assignment flow
Canonical chain in runtime:
Organization -> Event -> EventMembership -> Invite Token -> User Accepts -> Role Assigned

Acceptance semantics:
1. Resolve token by token_hash.
2. Validate org/event/membership binding and invitee email.
3. Validate lifecycle state and expiry.
4. Update membership role + accepted_at + active=true.
5. Mark token accepted and write audit event.
6. Issue session claims including organizationId, eventId, role.

## Workspace routing summary impact
- Session now contains organizationId + eventId + role from accepted invite context.
- Existing role-driven routing remains unchanged and continues to use event-scoped access checks.
- Invite lifecycle guarantees tenant/event-bound context before route access begins.

## Akshay and Rani live onboarding walkthrough
Reference event:
- event_id: b3c9e1f2-4a7d-4e8b-a1c2-d5e6f7a8b9c0
- organization: Revel Entertainment (Alpha)

Flow:
1. Akshay (couple) issues invite for Rani as couple role using POST /api/events/invites.
2. Planner issues invite for AM to PM as planner role.
3. Planner issues invite for Dreamcatchers as vendor role with role_profile=dj_mc.
4. Planner issues invite for decorator partner as vendor role with role_profile=decorator.
5. Planner issues invite for venue coordinator as venue_coordinator.
6. Couple/planner issue guest and family coordinator invites.
7. Each stakeholder accepts via POST /api/invites/accept using unique token + bound email.
8. Acceptance activates event membership and writes invite_accepted audit.
9. Session is issued with org/event/role claims.
10. User lands in event workspace with role-driven module access.

## Architectural decisions made during implementation
1. Token storage uses hashed token values only.
2. Invite acceptance is membership-first and role-driven (no permissions table dependency).
3. Decorator/DJ/Production remain vendor role with role_profile metadata in Alpha.
4. Resend is implemented as token replacement (old token revoked, new token generated/delivered).
5. Audit events are append-only and required for each state transition.

## Deferred intentionally from this phase
1. Permission-table-based authorization for invites.
2. Non-email delivery channels.
3. Automatic background expiration sweeper (expiration enforced on acceptance path; sweeper can be added as worker).
4. Dynamic role designer and custom policy engine.
