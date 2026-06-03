# ATLAS-MONETIZATION-MODEL

## Purpose
Define commercial architecture and entitlement logic before schema lock.

## Guiding Rule
Monetize the wedding workspace first (one payer per wedding), not each stakeholder account.

## Modes
## Revel-Managed Mode
### Eligibility
Event is explicitly flagged as Revel-managed (service contract or internal operations ownership).

### Access
All relevant stakeholders for that event can be invited with role-scoped access.

### Credential Lifecycle
- Revel operations (or delegated planner admin) uploads stakeholder roster.
- Atlas generates a unique credential invitation per person (no shared event code).
- Invitation email is sent to each stakeholder with one-time invite link and backup invite code.
- Invite acceptance sets personal login credentials and activates role-scoped workspace access.
- Reminder/update emails are routed by role and assignment scope.

### Entitlements
- Core workspace features included.
- Core intelligence features included for event execution.
- No separate end-user fee within that event context.

### Billing
Atlas cost is bundled/subsidized within Revel service economics.

### Workspace Ownership
Workspace owner is Revel operations account (or delegated owner under Revel account governance).

## Independent Mode
### Eligibility
Event is not marked as Revel-managed and is created by an external couple/planner account.

### Access
Workspace owner invites stakeholders (planner, vendors, venue coordinators, guests) with role-scoped permissions.

### Credential Lifecycle
- Workspace owner invites each stakeholder by email.
- Atlas generates a unique invite per person and sends it directly via email.
- Invite acceptance creates that user's personal credentials and role-scoped access.
- Owner can resend, revoke, or rotate any pending invite without affecting other accounts.

### Entitlements
Tiered access by workspace plan, with intelligence depth increasing by tier.

### Billing Responsibility
Single workspace payer per wedding (typically couple or planner).

### Billing Gate
- Workspace must complete sign-up and payment (or approved trial activation) before stakeholder invites are sent.
- If billing becomes delinquent, new invites and advanced entitlements are blocked while preserving owner recovery access.

### Workspace Ownership
Owner controls workspace billing and invitations; ownership transfer policy to be defined.

## Pricing Philosophy (Not Locked Numbers)
- Price to value delivered: reduced execution risk and coordination labor.
- Keep entry friction low for independent adoption.
- Scale price with intelligence depth and operational support level.
- Avoid per-user seat complexity in wedding contexts.

## Independent Workspace Tier Strawman
### Essential
- Core role workspaces.
- Basic timeline and onboarding flow.
- Baseline venue intelligence visibility.

### Pro
- Expanded intelligence signals and recommendation depth.
- Better coordination tooling and operational summaries.
- More advanced role workflows and reporting/export support.

### Premium
- Highest intelligence depth.
- Concierge-grade operational support features.
- Advanced workflows for high-complexity wedding execution.

## Buyer Personas (Phase 1)
- Couple: wants confidence and fewer expensive surprises.
- Planner: wants execution leverage and risk reduction across stakeholders.

## Future Vendor Pro (Phase 2+)
Potential subscription features:
- cross-event venue intelligence access,
- historical operational notes by venue/context,
- advanced coordination dashboards,
- performance/efficiency analytics,
- preferred-vendor visibility tools.

## Future Venue Pro (Phase 2+)
Potential subscription features:
- venue profile and constraint management,
- capacity/logistics intelligence controls,
- event analytics,
- vendor ecosystem tooling,
- optional reputation/operations trust surfaces.

## Future Enterprise Paths
- planning firms with portfolio-level controls,
- venue groups with multi-location intelligence governance,
- selective white-label/embedded models where strategically aligned.

## Entitlement Decision Logic (Policy-Level)
At event/workspace creation:
1. Determine event mode: Revel-managed or independent.
2. Assign workspace owner entity.
3. Apply default entitlement template by mode.
4. Apply plan-level entitlements (independent mode only).
5. Apply role-scoped permissions from policy matrix.
6. Allow approved human override with audit trace.

## Auth and Invite Policy Decisions (Locked)
1. No shared event code authentication in production workflow.
2. Every participant receives a unique invite credential.
3. Invite tokens are single-use and time-bound.
4. Atlas emails credentials/invites directly to invited participants.
5. Notifications and reminders are role-scoped and event-scoped.

## Monetization Non-Goals (Phase 1)
- No mandatory per-stakeholder billing within one wedding.
- No requirement for vendors/venues to subscribe before workspace value appears.
- No marketplace-style listing fees as the primary revenue mechanism.

## Key Dependencies for Later Schema Work
- Canonical event mode field and ownership model.
- Entitlement templates by mode and plan.
- Policy mapping between billing state and role permissions.
- Audit model for overrides and entitlement transitions.

## Open Questions
1. Who can reclassify an event from independent to Revel-managed (or reverse), and under what controls?
2. What are owner-transfer rules when planner/couple relationship changes mid-lifecycle?
3. Which intelligence capabilities are baseline vs paywalled in independent Essential tier?
4. How should add-on upsells be represented relative to base workspace tiers?
5. What compliance and invoicing constraints apply for multi-state expansion?
