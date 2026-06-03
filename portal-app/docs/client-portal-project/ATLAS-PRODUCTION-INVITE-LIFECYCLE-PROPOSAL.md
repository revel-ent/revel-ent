# ATLAS-PRODUCTION-INVITE-LIFECYCLE-PROPOSAL

## Scope and grounding
This proposal is grounded in the approved Phase 1 chain:
Organization -> Event -> EventMembership -> Invite Token -> User Accepts -> Role Assigned

Current enforcement remains role-driven in Alpha using app_role and memberships.
No permission tables are introduced in this phase.

## 1) Invite lifecycle (implementation plan)

### Lifecycle states
Invite token states:
- generated
- delivered
- accepted
- expired
- revoked

Membership states (existing shape):
- invited (accepted_at is null, active may remain true until acceptance policy lock)
- active (accepted_at set)
- revoked (active false)

### Generation
Who can generate:
- admin
- planner
- couple

Flow:
1. Inviter is authenticated and has event-scoped management rights.
2. API validates inviter role for target event.
3. API validates target role is supported in Alpha role model.
4. API creates or updates event_membership row for invitee email/user identity placeholder.
5. API creates invite_token with one-time token hash and expiry timestamp.
6. API writes audit record.

### Delivery
Flow:
1. API enqueues email dispatch with invite link and backup code.
2. Delivery status updated to delivered with timestamp/provider id.
3. Failures are retriable; token state remains generated until first successful send.

### Acceptance
Flow:
1. Invitee opens link or enters email + invite code.
2. API resolves token hash and validates status, expiry, org/event binding.
3. API resolves or creates user account identity.
4. API marks token accepted and stores accepted_by_user_id and accepted_at.
5. API updates membership accepted_at and ensures role assignment is active.
6. API issues session with organizationId, eventId, role.
7. API writes audit record.

### Expiration
Flow:
1. Token expiry checked on read and at periodic cleanup.
2. Expired tokens cannot be accepted.
3. Resend creates a new token; old token remains expired.
4. Expiration event written to audit.

### Revocation
Who can revoke:
- admin
- planner
- couple (with guardrails below)

Guardrails:
- Users cannot revoke themselves if they are sole workspace owner path.
- Couple cannot revoke planner/admin if doing so would orphan operational ownership.

Flow:
1. API validates actor authority in event context.
2. API marks token revoked and membership inactive if invite not yet accepted.
3. If already accepted, policy decides between role downgrade or full access revoke via membership.active false.
4. API writes audit record.

### Audit trail
Minimum required events:
- invite_generated
- invite_delivered
- invite_delivery_failed
- invite_accepted
- invite_expired
- invite_revoked
- membership_role_changed

Concrete implementation use case:
- Security and support need immutable event timeline to answer: who invited whom, when it was accepted, and who changed access after acceptance.

## 2) Role assignment flow (Organization + Event + Role binding)

Invite maps to:
- organization_id (from event)
- event_id (explicit)
- target_role (Alpha app_role)
- invitee_email

Acceptance applies:
1. Resolve organization via event.organization_id.
2. Ensure organization_users has active link for accepted user.
3. Ensure event membership exists for event + user.
4. Set membership role to target_role.
5. Set membership accepted_at and active=true.

Canonical auth chain at runtime:
Organization -> Event -> EventMembership -> Role -> Route/module checks

## 3) Stakeholder onboarding governance

### Who can invite
- admin: full invite authority for all event roles
- planner: full invite authority for operational roles + guest + venue coordinator
- couple: invite authority for planner/vendor/guest/family/venue, but cannot create additional admin users

### Who can revoke
- admin: any event membership (except protected self-orphaning path)
- planner: non-admin roles
- couple: non-admin roles with ownership guardrails

### Who can change roles
- admin: any role transitions in app_role set
- planner: can change between operational roles, cannot assign admin
- couple: can request planner-level escalations; direct changes limited to non-admin roles

## 4) Alpha vs future SaaS behavior

Alpha behavior (now):
- Role-driven authorization only.
- Supported role set is current app_role enum.
- Decorator, DJ/MC, and Production onboard as vendor role with role_profile tag in invite metadata.

Future SaaS behavior (after evidence):
- Add explicit role entries for decorator, dj_mc, production when repeated operational needs justify enum/table expansion.
- Move from role-profile tags to first-class roles only when route and policy differences are real and recurring.

Concrete use case for delay:
- If decorator and DJ users have identical access in Alpha, introducing separate DB roles now adds migration and RLS overhead without behavior gain.

## 5) Permission hierarchy for Alpha (role-driven)

Access hierarchy (broad to narrow):
1. admin
2. planner
3. couple
4. venue_coordinator
5. delegate_coordinator
6. vendor (includes decorator, dj/mc, production role-profile tags in Alpha)
7. guest

Practical mapping for requested personas:
- Couple -> couple
- Planner -> planner
- Venue Coordinator -> venue_coordinator
- Decorator -> vendor + role_profile=decorator
- Vendor -> vendor
- DJ/MC -> vendor + role_profile=dj_mc
- Production -> vendor + role_profile=production

## 6) Akshay and Rani reference implementation (actual flow)

Event context:
- Organization: Revel Entertainment (Alpha org)
- Event: Akshay and Rani wedding event id b3c9e1f2-4a7d-4e8b-a1c2-d5e6f7a8b9c0

Step-by-step:
1. Akshay (couple) signs in to event workspace.
2. Akshay invites Rani as couple role.
3. Akshay invites AM to PM as planner role.
4. Planner invites Dreamcatchers as vendor role with role_profile=dj_mc.
5. Planner invites decorator partner as vendor role with role_profile=decorator.
6. Planner invites venue coordinator as venue_coordinator role.
7. Couple invites family coordinator as delegate_coordinator role.
8. Couple/planner invite selected guests as guest role.
9. Each stakeholder accepts unique token, which activates event membership and role.
10. Workspace routing lands each user in the same event, with role-filtered modules.

## 7) Minimum schema needed for production invite lifecycle

Required additions (concrete, non-speculative):
1. invite_tokens table
- token_id uuid pk
- organization_id uuid fk organizations
- event_id uuid fk events
- membership_id uuid fk memberships
- invitee_email text
- target_role app_role
- token_hash text
- status text (generated, delivered, accepted, expired, revoked)
- expires_at timestamptz
- delivered_at timestamptz
- accepted_at timestamptz
- accepted_by_user_id uuid
- revoked_at timestamptz
- revoked_by_user_id uuid
- created_by_user_id uuid
- created_at, updated_at

2. invite_audit_events table
- audit_id uuid pk
- token_id uuid fk invite_tokens
- event_id uuid fk events
- actor_user_id uuid
- event_type text
- payload jsonb
- created_at timestamptz

Concrete use case:
- Required for support, compliance, and incident response for lifecycle actions that status fields alone cannot reconstruct.

## 8) API surface (implementation-focused)

- POST /api/events/:eventId/invites
- POST /api/events/:eventId/invites/:tokenId/resend
- POST /api/events/:eventId/invites/:tokenId/revoke
- POST /api/invites/accept
- PATCH /api/events/:eventId/memberships/:membershipId/role

All endpoints enforce:
- org/event context integrity
- role-driven actor authorization
- immutable audit event write

## 9) Deferred intentionally (not in this implementation)

- Permission tables and overrides
- Dynamic policy engine
- Fully custom role designer
- Multi-channel notification orchestration beyond email for first release
- Automatic role expansion for decorator/dj/production until operational evidence requires distinct policies
