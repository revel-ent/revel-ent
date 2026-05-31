# MVP FEATURE ROADMAP

## Outcome Targets

User outcome
- Every role can identify current status and next action in under 10 seconds on mobile.

Business outcome
- Reduce coordination back-and-forth by at least 30 percent per event and increase premium package attach rate.

## Prioritization Rubric

- Impact: minutes saved, reduction in manual touchpoints, reduction in day-of surprises
- Effort: engineering + operations complexity
- Risk: data sensitivity, workflow regressions, dependency complexity

## Phase 1 (Core, Weeks 1-6)

| Feature | User Value | Effort | Risk | Dependencies | Success Metric |
|---|---|---|---|---|---|
| Role-aware home dashboards | Immediate clarity by role | M | M | Auth/session role context | 80% of users click next action within first session |
| Client payments + checklist + timeline | Confidence and accountability | M | M | Event model, milestone model | 70% checklist interaction rate |
| Vendor workspace MVP | Fewer missed handoffs | M | M | Role permissions, uploads | 90% vendor acknowledgment of assigned changes |
| Delegate Live Mode | Day-of operational control | M | M | Timeline events, alert dispatch | 80% of pilot delegates complete run-of-show tasks |
| Guest concierge lite (RSVP + itinerary + guidance) | Better guest experience with low friction | M | L | Invite links, event scoping | 60% guest RSVP completion via portal |
| Intake document upload and extraction review queue | Faster setup from real docs | M | H | File storage, extraction service | 50% of extracted fields approved without edits |

Phase 1 acceptance criteria
- Event-scoped access is enforced for all core routes.
- Couples can complete planning baseline (payments, tasks, timeline) without planner intervention.
- Vendors and delegates can run day-of actions from mobile.
- Guest RSVP and itinerary work without account creation burden.

## Phase 2 (High ROI, Weeks 7-12)

| Feature | User Value | Effort | Risk | Dependencies | Success Metric |
|---|---|---|---|---|---|
| Atlas-powered feasibility alerts | Prevent avoidable day-of issues | M | M | Venue data quality, rules engine | 25% reduction in late timeline disruptions |
| Planner dependency engine | Faster re-planning during changes | H | H | Timeline graph model | 30% faster time-to-recovery after delay |
| Contextual upsell engine | Revenue growth with relevance | M | M | Event signals, offer mapping | 15% increase in upsell conversion |
| Venue collaboration pilot | Better compliance and access coordination | M | H | Venue role, scoped permissions | 80% compliance document completion before deadline |
| Notification orchestration (SMS/email/in-app) | Better response reliability | M | M | Messaging provider | 90% critical alert delivery success |

Phase 2 acceptance criteria
- Atlas constraints are surfaced as explainable recommendations.
- Planner change management includes dependency-aware suggestions.
- Upsells are triggered by context, not generic sales prompts.

## Phase 3 (Expansion, Weeks 13-24)

| Feature | User Value | Effort | Risk | Dependencies | Success Metric |
|---|---|---|---|---|---|
| Multi-event CRM and lifecycle scoring | Stronger retention and follow-on business | H | H | CRM schema, analytics | 20% improvement in repeat/referral pipeline |
| White-label/partner tenancy path | SaaS optionality beyond REVEL | H | H | Tenant isolation, billing, branding | First external pilot tenant live |
| Vendor growth surfaces | Referral flywheel and partner stickiness | M | M | Partner profile and attribution | 25% increase in partner-originated leads |
| Photo/video post-event monetization tools | New post-event value | M | M | Media workflows, payment rails | Revenue per event uplift from post-event offers |

Phase 3 acceptance criteria
- Platform can support REVEL-branded and partner-branded experiences.
- Referral and lifecycle metrics are visible at account and event levels.

## MVP Feature Cuts (What Not To Build Yet)

- Full standalone photographer portal
- Full social feed or community app
- Generic marketplace features
- Heavy customization frameworks before stable workflows

## Integration Architecture Notes

- Keep a typed service layer between portal and data providers (Atlas, AI extraction, messaging, billing).
- Maintain immutable event IDs for canonical linking; use readable aliases in UX.
- Route all high-risk AI suggestions through human review/approval in early phases.
- Track all key actions with analytics events for optimization and model feedback loops.

## Metrics Plan

Activation
- Role onboarding completion rate
- Time to first useful action

Engagement
- Weekly active planners/vendors/delegates
- Task and milestone completion rates

Conversion
- Upsell acceptance rate by trigger type
- Consult-to-booking conversion

Retention and referral
- Planner repeat usage
- Vendor repeat participation
- Referral-sourced event pipeline

Efficiency
- Cycle time from intake to baseline plan
- Day-of escalation count per event
- Average time-to-recovery for timeline disruptions

## Open Questions Blocking Full Build-Out

- Venue legal/compliance boundaries for shared access and data retention
- Exact policy for guest contact/privacy and communications consent
- Which upsells are mandatory-safe to automate versus always human-approved
- Data ownership and portability model for future SaaS licensing
