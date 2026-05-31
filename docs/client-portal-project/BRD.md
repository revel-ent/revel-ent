# BRD: ATLAS Portal by REVEL

## Document Control

- Version: 1.0
- Date: 2026-05-30
- Status: Draft for execution
- Owners: Founder, Product, Ops, Engineering
- Related docs:
  - `PORTAL-ROLE-MATRIX.md`
  - `MVP-FEATURE-ROADMAP.md`
  - `RBAC-PERMISSIONS-MATRIX.md`

## 1) Business Problem

Premium South Asian and fusion weddings are high-stakes, multi-day operations where planning and execution data is fragmented across calls, emails, chats, documents, and memory. This fragmentation creates expensive rework, coordination failures, and revenue leakage from missed contextual upsell opportunities.

## 2) Business Objective

Build the highest-trust, highest-efficiency wedding operations platform for REVEL events, while preserving optional future SaaS licensing for other planners/production teams.

## 3) Strategic Outcomes

### User outcome

- Every active role can identify "what matters now" and complete the next action in under 10 seconds on mobile.

### Business outcome

- Reduce coordination back-and-forth by at least 30 percent per event.
- Improve premium package attach/upsell conversion by at least 15 percent in pilot cohorts.

## 4) Scope

### In scope (Phase 1)

- Role-based portal experiences for `couple`, `planner`, `delegate_coordinator`, `vendor`, and guest concierge lite
- Payments/checklist/timeline baseline for couples
- Vendor assignment acknowledgment and deliverables
- Delegate Live Mode for day-of execution
- Event-scoped file intake and extraction review queue

### Out of scope (Phase 1)

- Full CRM replacement
- Full photographer-specific standalone portal
- Broad marketplace and social/community features
- White-label self-serve tenant onboarding

## 5) Target Segments

- Couple/client and designated family members
- REVEL planners and internal ops
- Event vendors (DJ/MC, decorator, photo/video, other partners)
- Guests using invite-scoped mobile experience
- Venue coordinators (pilot-only constrained access)

## 6) Value Proposition by Stakeholder

- Couples: confidence, clarity, and fewer surprises
- Planners: fewer breakdowns and faster day-of recovery
- Vendors: cleaner instructions and less back-and-forth
- Guests: premium, simple mobile itinerary + RSVP + guidance
- REVEL business: better margins via contextual upsells and stronger referral loops

## 7) Product and Brand Architecture

- Service brand: REVEL
- Product layer: ATLAS Portal by REVEL
- Intelligence layer: Atlas venue and logistics engine

Decision rule
- Keep REVEL trust and conversion strength in client-facing journeys.
- Keep architecture and naming neutral enough to support future licensing.

## 8) Core Business Requirements

1. Role-specific UX, not one generic interface.
2. Event-scoped security with least privilege and strict membership checks.
3. Mobile-first day-of reliability with resilient behavior in weak connectivity.
4. Explainable recommendations (assumptions + confidence + escalation path).
5. Contextual revenue surfaces tied to operational needs, not generic promotions.
6. Complete action auditability for high-risk workflows.
7. Human override for financial and structural timeline changes.
8. Analytics instrumentation from day one for activation, efficiency, and conversion.

## 9) Commercial Requirements

### Revenue

- Grow production add-on adoption (lighting/audio/coordination/consultation)
- Increase conversion on high-context upsell moments

### Retention

- Planner and vendor repeat usage on future events
- Couple satisfaction and referral propensity

### Referral loop

- Planner-facing workflow quality drives repeat booking referrals
- Vendor experience quality drives partner advocacy

## 10) Trust, Compliance, and Risk Requirements

- Role-based data minimization for PII and financial data
- Explicit guest communication and data consent policies
- Access expiration defaults post-event for guests/vendors
- Immutable logs for approvals, alerts, and financial edits
- Defined retention and deletion policy by domain

## 11) Success Metrics (Track Weekly)

1. Time to first useful action by role
2. Next-action completion within first session
3. Day-of escalation count per event
4. Time-to-recovery after timeline disruption
5. Vendor acknowledgment SLA for assigned changes
6. Guest RSVP completion rate through portal
7. Upsell conversion by context trigger
8. Planner repeat usage and referral-sourced pipeline

## 12) Dependencies

- Role model and authorization enforcement
- Event and timeline canonical schema
- Notification providers (SMS/email/in-app)
- Atlas data quality and update freshness
- Intake extraction pipeline with review workflow

## 13) Key Risks and Mitigations

- Risk: role confusion and UX overload
  - Mitigation: role-first nav + next best action + constrained views
- Risk: over-automation errors
  - Mitigation: confidence labeling + human approval for high-risk actions
- Risk: venue/legal ambiguity for shared data
  - Mitigation: venue pilot scope with explicit terms and restricted permissions
- Risk: building too broad too early
  - Mitigation: strict phase gates and feature cuts

## 14) Phased Business Rollout

- Phase 1: operational wedge (clarity, coordination, baseline execution)
- Phase 2: intelligence and conversion (Atlas constraints, notifications, upsells)
- Phase 3: scale optionality (multi-event CRM depth, white-label capability)

## 15) Approval Gates

Gate 1: Strategy lock
- Role model, pilot personas, and Phase 1 feature list approved

Gate 2: Risk lock
- Security and compliance baseline approved (RBAC, audit, access expiry)

Gate 3: Revenue lock
- Upsell trigger catalog approved with non-intrusive UX guidelines

Gate 4: Pilot lock
- KPIs and pilot event cohort approved for launch-readiness testing
