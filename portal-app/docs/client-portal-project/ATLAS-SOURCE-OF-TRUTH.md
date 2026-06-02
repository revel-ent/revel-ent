# ATLAS-SOURCE-OF-TRUTH

## Purpose
This document is the canonical reference for product, engineering, design, and business decisions for Atlas.

## Current Synthesis Inputs
- Portal app strategy direction from repository README.
- Existing role/permission model and route access matrix.
- Existing onboarding, timeline, live mode, and role workspaces.
- Existing Venue Atlas and trigger-evaluation implementation patterns.

## Canonical Stakeholder Model
### Couple
- Responsibilities: approve core wedding decisions, budget-sensitive tradeoffs, final directional choices.
- Value received: confidence, clear next action, fewer planning surprises.
- Permissions (current baseline): dashboard, onboarding, couple workspace.
- Long-term role: persistent customer and referral source.

### Planner
- Responsibilities: orchestration, timeline ownership, stakeholder alignment, risk reduction.
- Value received: execution clarity, faster triage, venue/logistics intelligence.
- Permissions (current baseline): dashboard, onboarding, intake, live, planner workspace.
- Long-term role: high-leverage operator and major customer/expansion channel.

### Vendor
- Responsibilities: deliver scoped production/service tasks with timing and dependency awareness.
- Value received: fewer handoff misses, clearer assignments, venue-aware constraints.
- Permissions (current baseline): dashboard + vendor workspace.
- Long-term role: strategic stakeholder in Phase 1; future subscription customer.

### Venue (Venue Coordinator)
- Responsibilities: venue operations alignment, constraints communication, day-of safety/feasibility.
- Value received: fewer preventable conflicts, clearer execution handoffs.
- Permissions (current baseline): dashboard, live, venue workspace.
- Long-term role: strategic stakeholder in Phase 1; future subscription customer.

### Guest
- Responsibilities: follow logistics and attendance guidance.
- Value received: reduced confusion and better day-of experience.
- Permissions (current baseline): dashboard + guest workspace.
- Long-term role: beneficiary and NPS/reputation amplifier, not primary monetization target.

### Revel Operations
- Responsibilities: premium service delivery and stakeholder coordination quality.
- Value received: differentiation, operational efficiency, upsell intelligence.
- Permissions (current baseline): admin/full control by policy.
- Long-term role: strategic owner of service-mode customer value.

### Atlas Admin
- Responsibilities: platform governance, role controls, policy, reliability, support.
- Value received: controlled scaling and predictable operations.
- Permissions: full platform access and policy override where authorized.
- Long-term role: platform governance backbone.

## Stakeholder Matrix
| Stakeholder | Phase 1 Revenue Driver | Phase 1 Daily User | Long-Term Customer |
|---|---|---|---|
| Couple | Yes | Yes | Yes |
| Planner | Yes | Yes | Yes |
| Vendor | No | Yes | Yes |
| Venue | No | Sometimes | Yes |
| Guest | No | Yes | Unlikely |
| Revel Operations | Indirect (service revenue) | Yes | Internal |
| Atlas Admin | No | Yes | Internal |

## Product Principles
- Mobile-first execution: prioritize small-screen task completion.
- Concierge-grade UX: clear next steps, low ambiguity, premium tone.
- Zero Blank Canvas onboarding: always provide guided starting structures.
- Role-based navigation: show the right lane for each actor.
- Explainable intelligence: recommendation evidence must be visible.
- Human override: operators can suppress/adjust with traceability.
- Low cognitive load: decision-focused surfaces over generic dashboards.

## Why Atlas Wins
### Workspace Capabilities
Role-aware execution workflows across onboarding, timeline, and day-of operation.

### Intelligence Capabilities
Venue constraints, evidence-backed evaluations, trigger recommendations, and compounding confidence.

### Network Effects
Every executed wedding contributes operational learning that improves future planning/execution quality.

## Explicit Non-Goals (Phase 1)
Atlas is not:
- a wedding discovery marketplace,
- a social network,
- a broad lead-generation platform,
- or a replacement for every wedding tool.

Atlas is an execution and intelligence platform first.

## Strategic Boundaries for Phase 1
- Solve for couple/planner outcomes first while enabling vendor/venue participation.
- Do not require all stakeholders to adopt deeply before value appears.
- Keep monetization friction low at workspace entry.

## Open Questions
1. Should delegate coordinator and venue coordinator remain distinct externally or become policy variants of broader roles?
2. What minimum vendor/venue depth is required in Phase 1 to support network compounding without over-scope?
3. What acceptance threshold determines when a recommendation should auto-surface as "active" vs "needs_review"?
4. What data rights language is needed for independent events to reinforce trust and ownership?
5. What are the exact founder-approved guardrails for adding marketplace/discovery features later?
