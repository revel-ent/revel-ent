# Roadmap

## Phase 1: Conversion Wedge (Weeks 1-4)

### Deliverables

- Client portal positioning and workflow entry page
- Fusion Flow Experience Architect entrypoint
- Venue Production Analyzer entrypoint
- Tracking on all primary CTA/module clicks
- Onboarding v1 with Zero Blank Canvas baseline timeline generation

### Done Criteria

- Distinct deep links per workflow are live.
- Partner-facing brief and policy are published.
- Baseline engagement and conversion events are captured.
- New user can complete onboarding to first usable timeline in under 3 minutes on mobile.

## Phase 2: Access and Workflow Control (Weeks 5-8)

### Deliverables

- Event-scoped role access model
- `delegate_coordinator` role and day-of permission scope
- Vendor workspace MVP
- Guest concierge pilot scope
- Data trust metadata in operational outputs
- Pass the Baton transfer flow (couple -> family coordinator)

### Done Criteria

- Role-based permissions are enforced for event data.
- `delegate_coordinator` can update timeline execution state and dispatch alerts, but cannot access contracts/billing/admin settings.
- Vendor view supports active-event coordination only.
- Access expiration is implemented by default post-event.
- Baton invite opens recipient directly into Live Mode route with scoped event context.

## Phase 3: Day-of Intelligence (Weeks 9-12)

### Deliverables

- Timeline change handling and alert logic
- AI issue routing prompts for common disruptions
- Coordination telemetry and quality dashboards
- Live Mode mobile execution flow for non-professional coordinators
- Atlas-driven venue prompts embedded into phase checklists
- Expert Review upsell flow (timeline/venue/production review)
- Concierge copy pass across onboarding and Live Mode screens

### Done Criteria

- Day-of escalations are reduced in pilot events.
- Recovery actions are logged and measurable.
- Family Coordinator pilot can complete day-of run-of-show from mobile without accessing pro dashboard.
- Expert Review upsell is purchasable in-flow and routed to human review queue.
- UX tests show non-technical users can identify current phase, next action, and escalation path within 10 seconds.

## First Technical Step (This Week)

Implement RBAC foundation for `delegate_coordinator` end-to-end:

1. Add role constant/type in auth/session domain model.
2. Add policy matrix for allowed actions (`timeline:update`, `dispatch:send`) and blocked actions (`contracts:update`, `billing:update`, `admin:update`).
3. Enforce policy checks in middleware and write endpoints before UI work.

Reason: this unblocks Live Mode and Expert Review workflows without rework.
