# PORTAL ROLE MATRIX

## Purpose

Define what each stakeholder needs from the portal before, during, and after a wedding so the product feels premium for couples and operationally powerful for professionals.

## Product Positioning

- Service brand: REVEL (client-facing luxury entertainment and production)
- Product layer: ATLAS Portal (software experience)
- Intelligence moat: Atlas venue and workflow data (mostly hidden from end users, surfaced as recommendations)

## Executive Summary (Top Decisions)

- Build one platform with role-specific experiences, not one generic dashboard.
- Keep event identity immutable with UUID, but provide human-readable aliases for operators.
- Give planners and delegate coordinators day-of control without exposing client financials.
- Treat vendors as active collaborators with acknowledgements, deliverables, and due-date reminders.
- Keep guest experience no-login or magic-link first for high adoption.
- Give venues limited compliance access where operationally useful, not full planning access.
- Make Atlas recommendations explainable (assumptions, confidence, source notes).
- Tie upsells to risk prevention and outcomes, not generic sales messaging.
- Ship with a clear "next best action" on every role homepage.
- Instrument cycle-time and coordination events from day one.

## Role-by-Role Experience

### Couple / Client

What they care about
- Budget certainty
- Payment schedule clarity
- Confidence in day-of execution
- Timeline visibility
- Curated upgrades that feel relevant

Core modules
- Personalized dashboard
- Payment milestones and invoice history
- Planning checklist with completion states
- Event timeline and key moments
- Contracts and signed documents
- Recommendation cards (upgrade, risk flag, or review)
- Communication hub (planner + REVEL)

Actions
- Approve milestones and selections
- Upload contracts/emails/transcripts
- Pay milestones and download receipts
- Invite family coordinator/delegate with scoped access

Private vs shareable
- Private: contracts, payment details, internal risk scoring
- Shareable: approved timeline, guest-facing itinerary, dress guidance, logistics notes

Delight opportunities
- "You are on track" confidence card with remaining critical actions
- One-tap "ask concierge" against any task
- Contextual reminders synced to event phase

Upsell opportunities
- Expert timeline review
- Lighting or audio package based on venue/time/guest count
- Hospitality and logistics support add-ons

### Parents / Family

What they care about
- Duties and reminders
- Arrival/hotel/transport details
- Ceremony role clarity

Core modules
- Family task board
- Family itinerary and arrival windows
- Logistics cards (room keys, transport, dining)

Actions
- Confirm responsibilities
- Mark readiness steps complete
- Request assistance from planner

Private vs shareable
- Hidden: finances, contracts, vendor pricing
- Visible: assigned tasks, logistics, approved timeline slices

### Family Coordinator / Delegate

What they care about
- What is happening now
- Who to contact quickly
- Escalation path when something slips

Core modules
- Live Mode (current 60-90 minutes)
- Incident and escalation controls
- Contact quick-actions
- Atlas venue prompt cards for real-time guidance

Actions
- Update execution status
- Trigger approved alerts
- Confirm handoff checkpoints

Private vs shareable
- Hidden: contracts, payments, private client notes
- Visible: live timeline, assigned tasks, route notes, vendor check-ins

### Planner

What they care about
- Fast coordination
- Fewer communication breakdowns
- Controlled change management

Core modules
- Operations command center
- Dependency-aware timeline editor
- Approval queue
- Vendor acknowledgment feed
- Change log and audit history

Actions
- Edit timeline and assignments
- Approve/reject change requests
- Trigger role-targeted notifications
- Assign fallback plans for common disruptions

Private vs shareable
- Hidden: certain internal REVEL-only commercial notes
- Visible: operations data required for execution

### DJ/MC/Production Vendor

What they care about
- Accurate cues and schedule
- Venue load-in constraints
- Rapid updates if plan changes

Core modules
- Role-filtered timeline (production cues)
- Venue specs and restrictions
- Task acknowledgments
- File upload and deliverables

Actions
- Acknowledge changes
- Upload required deliverables and confirmations
- Flag feasibility issues

Private vs shareable
- Hidden: couple finances, non-relevant vendor threads
- Visible: event slices, cue sheets, load-in details, contacts

### Decorator / Design Vendor

What they care about
- Setup windows
- Space constraints
- Approval states

Core modules
- Setup and strike windows
- Venue and layout constraints
- Deliverables upload

Actions
- Submit setup plan and approvals
- Confirm load-in timing
- Flag blocking dependencies

### Photographer / Videographer

What they care about
- Shot schedule and location readiness
- Quick content sharing workflow

Core modules
- Micro-timeline by capture moments
- Location and lighting notes
- Lightweight gallery/share links

Actions
- Confirm key-shot readiness
- Share links or upload selected media

Note
- Keep this role lightweight in MVP; avoid separate heavy sub-portal.

### Venue / Venue Coordinator

Should venues have access
- Yes, with constrained operational scope when venue collaboration is part of the contract.

What they care about
- Compliance, access windows, insurance/docs, noise/time rules

Core modules
- Venue compliance checklist
- COI and required document approvals
- Day-of incident channel

Actions
- Approve compliance documents
- Confirm access windows and restrictions
- Publish day-of venue advisories

Private vs shareable
- Hidden: client finances, private family notes, non-venue vendor pricing
- Visible: compliance and operationally relevant timeline segments

### Guests

What they care about
- Where to be, when to arrive, what to wear, how to request support

Core modules
- Personalized itinerary (invite-scoped)
- RSVP and reminder center
- Dress and etiquette guidance
- Local recommendations and logistics
- Song requests and dietary preferences
- Day-of updates

Actions
- RSVP and update plus-ones (as allowed)
- Submit dietary and music requests
- Access maps/parking/hotel info

Private vs shareable
- Hidden: operations chatter, finances, vendor contact details
- Visible: guest-relevant itinerary and support links

## Cross-Role Must-Haves

- Next best action on every home screen
- Audit log for timeline and approvals
- Message center with role-targeted notifications
- Structured document intake (contracts/transcripts/emails/media)
- Explainable Atlas recommendations with confidence metadata

## MVP Recommendation

- Couple, planner, delegate coordinator, and vendor views are required in MVP.
- Guest itinerary + RSVP should be included in MVP-lite (mobile-first, minimal friction).
- Venue access should launch as pilot-only with constrained permissions.
- Photographer workflow should remain lightweight until post-MVP.

## Biggest Mistakes to Avoid

- One-size-fits-all dashboard for every role
- Exposing financials broadly for convenience
- Requiring app installs for guests
- Shipping AI recommendations without confidence or rationale
- Overbuilding social/marketplace features before operational reliability
- Treating documents as static uploads instead of workflow triggers
- Ignoring day-of mobile usability and speed
- Designing around internal language instead of user outcomes
- Under-investing in notifications and escalation flow
- Launching without event-level analytics and adoption telemetry
