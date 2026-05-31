# RBAC PERMISSIONS MATRIX

## Purpose

Define event-scoped permissions for each role so product behavior, API authorization, and Supabase RLS can share one source of truth.

## Role Set

- `admin`
- `planner`
- `delegate_coordinator`
- `couple`
- `vendor`
- `guest`
- `venue_coordinator` (pilot role)

## Permission Legend

- `V` = view
- `E` = edit/create
- `A` = approve/override
- `H` = hidden/no access

## Data + Action Matrix

| Capability | admin | planner | delegate_coordinator | couple | vendor | guest | venue_coordinator |
|---|---|---|---|---|---|---|---|
| Event dashboard | V | V | V | V | V | V | V |
| Payments (amounts, due dates) | V/E | V | H | V | H | H | H |
| Payment approvals/adjustments | A | A | H | H | H | H | H |
| Contracts and legal docs | V/E | V/E | H | V | V (own only) | H | V (compliance only) |
| Timeline (full) | V/E | V/E | V | V | V (filtered) | H | V (ops slice) |
| Timeline execution status | V/E | V/E | E | V | E (own tasks) | H | E (venue checkpoints) |
| Timeline structural edits | V/E | V/E | H | H | H | H | H |
| Guest list + RSVP admin | V/E | V/E | V (counts only) | V/E | H | H | H |
| Guest personal info | V | V | V (minimum needed) | V | H | H | H |
| Vendor contact directory | V/E | V/E | V | V (limited) | V (limited) | H | V (limited) |
| Venue notes / restrictions | V/E | V/E | V | V (summarized) | V | H | V/E |
| Alerts dispatch | V/E | V/E | E (scoped templates) | H | H | H | E (venue advisories) |
| File uploads (intake/media/docs) | V/E | V/E | E (scoped) | E | E (own domain) | E (guest uploads only) | E (compliance docs) |
| Messages and announcements | V/E | V/E | E | E (couple thread) | E (assigned channels) | V/E (guest support only) | E (venue channel) |
| AI recommendations | V/A | V/A | V | V | V (role scoped) | V (guest scoped) | V |
| AI action approvals | A | A | H | H | H | H | H |
| Upsell offer visibility | V | V | H | V | H | H | H |
| Settings / role assignment | A | H | H | H | H | H | H |

## Domain-Specific File Access Rules

Canonical storage path pattern
- `events/{event_id}/{domain}/{yyyy}/{mm}/{filename}`

Domain-to-role policy
- `contracts`: admin/planner/couple view; vendor and venue only if explicitly assigned by document scope
- `financial`: admin/planner/couple only
- `transcripts`: admin/planner/couple/delegate_coordinator (scoped), restricted for guests
- `vendor_documents`: admin/planner/assigned vendors
- `guest_assets`: admin/planner/couple + guest uploader for own submissions
- `timelines`: admin/planner/delegate_coordinator + read-only slices for vendor/couple
- `media`: role-scoped with event membership check
- `emails`: admin/planner/couple, optionally delegate_coordinator for approved logistics threads

## Supabase RLS Translation Guidance

Membership table assumptions
- `event_memberships(user_id, event_id, role, status)`
- `status = active` required for all non-admin access

Policy helpers (conceptual)
- `is_event_member(event_id)`
- `has_event_role(event_id, role)`
- `is_admin()`

Baseline rules
- Read: allow if `is_admin()` or active membership for that `event_id`
- Write: allow by role and capability map above
- Approve/override: planner/admin only
- Sensitive tables (`payments`, `financial_docs`): deny by default, allow explicit planner/admin/couple conditions

## Suggested API Authorization Checks

- `timeline:update` -> admin/planner/delegate_coordinator (scoped to execution fields only for delegate)
- `timeline:structure:update` -> admin/planner only
- `payments:view` -> admin/planner/couple
- `payments:update` -> admin/planner only
- `alerts:dispatch` -> admin/planner/delegate_coordinator(templated)/venue_coordinator(venue-only)
- `files:upload` -> role + domain check + event membership
- `guest:rsvp:update` -> guest token linked to invite scope OR planner/admin override

## Guardrails

- Never infer authorization from client-side role claims alone; always verify server-side membership.
- Log all approvals and high-risk actions with actor, role, event_id, and timestamp.
- Enforce time-boxed guest and vendor access expiration after event end unless renewed.
- Require human approval for high-impact AI actions (financial changes, timeline structure edits, broad message blasts).

## Venue Access Recommendation

- Include venue role in pilot scope only.
- Default venue role to compliance and operational slices.
- Exclude venue from financials, private family notes, and non-venue vendor threads.
- Add explicit legal terms for data sharing and retention before broad rollout.
