# PRD: ATLAS Portal by REVEL

## Document Control

- Version: 1.0
- Date: 2026-05-30
- Status: Draft for implementation
- Owners: Product + Engineering
- Related docs:
  - `BRD.md`
  - `PORTAL-ROLE-MATRIX.md`
  - `MVP-FEATURE-ROADMAP.md`
  - `RBAC-PERMISSIONS-MATRIX.md`

## 1) Product Goal

Deliver a role-based portal that gives each stakeholder immediate clarity on current status, next action, and escalation path before, during, and after multi-day South Asian/fusion weddings.

## 2) Product Principles

- Premium but simple
- 5th-grade clarity for core actions
- Mobile-first interaction model
- Low cognitive load, high operational confidence
- Trust by default: least privilege + explainable recommendations + human override

## 3) MVP Roles and Primary Surfaces

### 3.1 Couple / Client

Dashboard first view
- Planning health card (on track/at risk)
- Next 3 required actions
- Payment status summary
- Upcoming milestone timeline

Primary navigation
- Home
- Payments
- Checklist
- Timeline
- Messages
- Documents

Top actions
- Complete checklist item
- Approve/reject recommendation
- Upload contract/transcript/email
- Pay milestone
- Invite delegate coordinator

Before wedding
- Baseline timeline setup
- Payment and contract confidence
- Venue and production advisories

Day-of
- View-only event status and milestone progression
- Escalation contact and key updates

After wedding
- Final statements and deliverables
- Optional media access and referral prompt

Atlas-powered moments
- "Venue load-in window is tight. Confirm vendor arrival by 2:30 PM."
- "Outdoor segment starts after sunset. Consider lighting package."

Notifications
- Milestone reminders
- Approval required
- Day-of status exceptions

### 3.2 Guest

Dashboard first view
- Personalized itinerary and RSVP status
- What to wear / where to park / where to check in

Primary navigation
- Itinerary
- RSVP
- Travel and venue info
- Requests (song/dietary)
- Updates

Top actions
- RSVP/update attendance
- Submit dietary preference
- Submit song request
- Open map/parking details
- View invite-scoped updates

Before wedding
- RSVP and logistics prep

Day-of
- Live reminders and directions

After wedding
- Thank-you/update message and optional media link access

Atlas-powered moments
- Venue-specific parking and walking guidance

Notifications
- RSVP reminders
- Event-day reminders
- Schedule changes relevant to guest scope

### 3.3 Planner

Dashboard first view
- Operations command board
- At-risk timeline blocks
- Pending approvals
- Vendor acknowledgment status

Primary navigation
- Command Center
- Timeline
- Approvals
- Vendors
- Guests
- Messages
- Reports

Top actions
- Edit timeline structure
- Assign and reassign responsibilities
- Approve/reject requests
- Trigger role-targeted alerts
- Resolve disruptions with fallback plan

Before wedding
- Build operational timeline and dependencies
- Validate venue constraints and vendor readiness

Day-of
- Change management and escalation handling

After wedding
- Postmortem and reusable template capture

Atlas-powered moments
- Hard constraint warnings prior to schedule save
- Capacity/routing feasibility prompts

Notifications
- Critical exceptions
- Missed acknowledgments
- SLA breaches on key tasks

### 3.4 Family / Delegate Coordinator

Dashboard first view (Live Mode)
- Now / Next / After queue
- Immediate checklist
- Contact quick actions

Primary navigation
- Live Mode
- Checklist
- Alerts
- Contacts

Top actions
- Mark execution step complete
- Trigger approved alert templates
- Confirm handoffs
- Report incident
- Escalate to planner

Before wedding
- Understand responsibilities and handoff rules

Day-of
- Follow turn-by-turn execution path

After wedding
- Submit final execution notes

Atlas-powered moments
- "Baraat route check: driveway power point available on east side."

Notifications
- Immediate next-step nudges
- Delay/escalation alerts

### 3.5 Vendor

Dashboard first view
- Assigned tasks due soon
- Event-specific timeline slice
- Venue constraints card

Primary navigation
- Tasks
- Timeline Slice
- Venue Notes
- Deliverables
- Messages

Top actions
- Acknowledge assignment change
- Upload deliverable
- Confirm load-in status
- Flag dependency/blocker
- Confirm completion

Before wedding
- Align on timeline and required deliverables

Day-of
- Execute assigned timeline tasks with minimal noise

After wedding
- Closeout and post-event deliverables

Atlas-powered moments
- Load-in windows and setup constraints by venue zone

Notifications
- Assignment updates
- Deadline reminders
- Day-of change alerts

### 3.6 Venue Coordinator (Pilot)

Dashboard first view
- Compliance checklist
- Access windows and restriction confirmations

Primary navigation
- Compliance
- Ops Timeline Slice
- Advisories
- Documents

Top actions
- Approve compliance documents
- Confirm access window restrictions
- Post venue advisory
- Acknowledge incident updates
- Confirm space readiness checkpoints

Before wedding
- Compliance and constraints confirmation

Day-of
- Active advisories and logistics confirmations

After wedding
- Incident and compliance closeout

Atlas-powered moments
- Constraint surfacing for timing/noise/capacity windows

Notifications
- Compliance due reminders
- Day-of advisories and confirmations

## 4) Functional Requirements

### 4.1 Identity and Access

- Event-scoped role membership required for non-admin access
- Route and API authorization must enforce RBAC matrix server-side
- Role claims from client cannot be trusted without membership verification

### 4.2 Timeline and Coordination

- Timeline must support multi-day segmented events and concurrent tracks
- Distinguish structural edits from execution status updates
- Maintain immutable change log with actor and timestamp

### 4.3 Payments and Contracts

- Couple and planner/admin have visibility per RBAC policy
- Financial actions require explicit permission and auditable events

### 4.4 File Intake and Documents

- Canonical storage path: `events/{event_id}/{domain}/{yyyy}/{mm}/{filename}`
- Domain-level authorization required on upload and read
- Extraction outputs must enter review state before critical writes

### 4.5 Notifications

- Multi-channel dispatch support (in-app, SMS, email)
- Critical alert delivery tracking and retry policy
- Role-targeted templates with escalation routes

### 4.6 AI Recommendations

- Every recommendation includes rationale + confidence label
- High-impact actions require human approval
- Feedback action (`flag_inaccurate`) required for quality loop

## 5) Non-Functional Requirements

- Mobile-first performance for role home screens
- Reliable operation in intermittent connectivity
- Strict data isolation and auditability
- p95 portal interaction latency target suitable for day-of workflows
- Observability for auth, sync, alerts, and extraction paths

## 6) UX and Copy Requirements

- Plain-language action labels and status states
- At most one primary CTA per card in high-stress flows
- Delegate Live Mode must avoid dashboard clutter
- Copy tone: warm, premium, direct, no technical jargon

Example microcopy
- Couple: "You are on track. Two approvals remain for this week."
- Delegate: "Next: Baraat starts in 15 minutes. Confirm DJ power now."
- Vendor: "Load-in window opens at 2:30 PM. Confirm arrival when on-site."

## 7) Analytics Requirements

Track minimum event set from week 1
- `role_home_viewed`
- `next_action_clicked`
- `timeline_step_completed`
- `alert_dispatched`
- `vendor_acknowledged_assignment`
- `guest_rsvp_submitted`
- `recommendation_viewed`
- `upsell_offer_presented`
- `upsell_offer_accepted`
- `recommendation_flagged_inaccurate`

## 8) Missing Schema/API Needs (from screen mapping)

### Entities to add or formalize

- `event_memberships` (role + status + expiry)
- `timeline_dependencies`
- `alerts`
- `notification_deliveries`
- `recommendation_feedback`
- `guest_invites` (token scope and expiration)
- `venue_advisories`

### Fields to add

- `timeline_steps.execution_state`
- `timeline_steps.owner_role`
- `timeline_steps.risk_level`
- `documents.visibility_scope`
- `documents.review_status`
- `recommendations.confidence_label`
- `recommendations.approval_required`

### API surfaces to add

- `POST /api/timeline/:eventId/alerts`
- `POST /api/timeline/:eventId/acknowledgments`
- `POST /api/recommendations/:id/approve`
- `POST /api/recommendations/:id/flag-inaccurate`
- `POST /api/guests/:eventId/rsvp`
- `POST /api/notifications/dispatch`

## 9) Acceptance Criteria by MVP Slice

### Couple baseline
- Couple can complete checklist, view timeline, and complete payment milestone from mobile

### Planner command center
- Planner can edit timeline structure and dispatch role-targeted alerts

### Delegate Live Mode
- Delegate can complete assigned run-of-show steps and escalate blockers

### Vendor workspace
- Vendor can view assigned timeline slice and acknowledge updates

### Guest concierge lite
- Guest can RSVP and access itinerary without full account setup

## 10) Risks and Open Questions

- Legal model for venue data-sharing and retention
- Consent model for guest messaging and preference data
- Offline behavior expectations for web-first surface vs native app evolution
- Boundary between auto-action and human review for recommendations

## 11) Recommended Next Build

Single screen to build next
- Planner Command Center home with at-risk blocks, pending approvals, and alert dispatch

Fastest end-to-end test flow
- Planner adjusts timeline -> vendor receives assignment alert -> vendor acknowledges -> delegate sees Live Mode update -> couple sees status confidence card

Why
- This validates the most critical cross-role value loop (coordination speed + trust) and exercises auth, timeline, alerts, and role-scoped UX in one pilot path.
