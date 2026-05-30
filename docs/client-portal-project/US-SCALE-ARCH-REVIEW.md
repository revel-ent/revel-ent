# REVEL Portal US-Scale Architecture Review (v1)

Date: 2026-05-29
Owner: REVEL Product + Copilot

## Objective

Pressure-test the current portal architecture for reliable scale across US markets while preserving premium client experience and operational clarity.

## Current State Snapshot

- Marketing site and portal app are separated, which is correct for modular growth.
- Portal uses role-based guarded routes and event-scoped session claims.
- Core workflow APIs are functional (fusion flow, venue analyzer, concierge, coordination, dispatch).
- Production currently relies on mock membership and mock operational data.
- Existing strategic asset: Venue Atlas (`https://atlas-capacity-engine.vercel.app/`) with ~55 Georgia venues and planner/decorator-informed intelligence.

## High-Priority Architecture Risks

1. Identity and access model is mock-based.
- Risk: cannot scale secure access across many events/users.
- Required: move to managed auth + persistent membership storage.

2. Data persistence is limited.
- Risk: workflow state and trust metadata are not durable/system-of-record grade.
- Required: production database with event-scoped tenancy model.

3. No formal API protection layer for scale.
- Risk: abuse, latency spikes, and uneven reliability under growth.
- Required: rate limits, request validation hardening, queueing where needed.

4. Observability is incomplete.
- Risk: difficult to detect and resolve regional performance or workflow failures.
- Required: tracing, structured logs, SLO dashboards, alerting.

5. Workflow trust model is not fully productized for user clarity.
- Risk: internal labels leak into UI and reduce confidence.
- Required: user-facing trust language standards and explainability templates.

## Recommended Target Architecture (Phase-Oriented)

## Venue Atlas Integration Principle

- Do not rebuild venue intelligence from scratch.
- Integrate Venue Atlas as a first-class source for venue constraints, logistics, and recommendation context.
- Keep integration low-maintenance (API-first, managed infra, minimal operational overhead).

## Phase A: Production Foundation

- Auth: managed identity provider with email magic link or passwordless + MFA for staff roles.
- Data: Postgres with event_id and role-based row-level access.
- Sessions: signed cookies remain fine, but claims should be server-issued from DB membership.
- Storage: object storage for media/doc uploads with signed URLs.
- Add `delegate_coordinator` role with day-of write permissions and finance/contract restrictions.

## Phase B: Reliability and Scale

- API gateway controls: WAF, rate limiting, bot protection, strict input schemas.
- Async processing: queue for heavy analysis and outbound dispatch jobs.
- Caching: edge cache for read-heavy guest flows and static planning references.
- Regional readiness: CDN + compute region strategy based on user concentration.

## Phase C: Intelligence and Trust

- Structured trust metadata model with user-friendly labels.
- Confidence calibration and fallback rules for low-confidence recommendations.
- Recommendation audit trail per event decision.
- Explainability blocks standardized across all AI modules.

## UX Guardrails for Public-Facing Pages

- Replace technical terms with plain-language equivalents.
- Every recommendation must answer: what it means, why it matters, what to do next.
- Remove internal model/version labels from default user view.
- Keep one clear CTA per section to avoid choice overload.

## Onboarding UX Strategy (Premium + Low Cognitive Load)

Design target: easy enough for a non-technical family member to use immediately, while preserving premium brand feel.

### Core Principles

1. Grandma Test
- Within 10 seconds, user must know where they are, what needs attention now, what action to take, and what happens next.

2. Zero Blank Canvas Rule
- Do not start users on empty planners.
- Pre-populate baseline timeline and venue-aware defaults using Atlas constraints and event type templates.

3. Concierge Tone and Aesthetic
- Use calm, direct, high-end language.
- Avoid noisy SaaS cheerleading, jargon, or gamified tone.
- Keep visual hierarchy clean: high contrast, generous spacing, large touch targets.

4. One Action Per Step
- Progressive disclosure: ask only what is needed for the next recommendation.
- Defer advanced fields until relevant.

5. Frictionless Pass the Baton
- Couple can transfer day-of execution to a Family Coordinator in one action.
- Invite should open directly into Live Mode mobile execution flow.

### Onboarding Inputs That Power Upsells

- Venue
- Guest count range
- Event types and sequence (mehndi, haldi, sangeet, baraat, ceremony, reception)

Use these inputs to detect risk/opportunity and trigger calm, contextual recommendations:

- capacity overage contingencies
- logistics mitigation options
- Expert Review offers (timeline, venue logistics, production)

## Family Coordinator Workflow (Core Requirement)

Many events run without full-service planners. REVEL should support a family-led coordinator path.

Role model addition:

- `delegate_coordinator`: designated family member/friend with execution authority only.

Permission boundaries:

- Allowed: timeline status updates, delay flags, execution notes, guest/vendor dispatch updates.
- Blocked: contract edits, billing changes, admin settings, role assignment changes.

Live Mode UX requirement (mobile-first):

- turn-by-turn execution view by current phase
- checklist and next-step prompts only
- Atlas-aware venue prompts (logistics/power/policy reminders)
- one-tap escalation to planner or REVEL expert review

This mode should hide pro dashboard complexity by default.

## Monetization Layer: DIY Pro + Expert Review

Support three commercial paths in one platform:

1. DIY Couple
2. DIY + Family Coordinator
3. Planner / Premium Concierge

Add low-friction expert review upsells:

- timeline review
- venue logistics review
- production recommendation review

This expands market reach without requiring full planner spend and preserves premium service upgrades.

## Deep AI Research Brief (Use As Prompt)

Use this prompt in your research tool:

"Review REVEL portal architecture for US-scale readiness. Context: Next.js app-router portal with role-based access (couple/planner/vendor/guest), event-scoped workflows, AI recommendation endpoints, and a separate static marketing site. Produce: (1) target reference architecture for 10k+ monthly active event participants, (2) security model and tenancy design, (3) auth/provider options with tradeoffs, (4) database schema strategy for event workflows and trust metadata, (5) observability/SRE stack and SLOs, (6) cost model ranges, (7) migration plan from mock flows to production in 3 phases, (8) top 10 implementation risks and mitigations, (9) compliance/privacy checklist for wedding data and communications, (10) recommended stack decisions with rationale." 

Augment prompt with this required context:

"Additional strategic context: REVEL already has Venue Atlas (`https://atlas-capacity-engine.vercel.app/`) with ~55 Georgia wedding venues and planner/decorator-informed venue intelligence. Treat Venue Atlas as a core moat. Recommend the fastest integration path (standalone + internal API, embedded experience, shared backend, or unified platform), shared data model connections to timeline/workflows/AI/upsells, and SEO leverage from venue-specific content. Prefer integration over rebuild." 

Agent handoff snippet:

"Important additional context: I already built Venue Atlas and want architecture recommendations to integrate and leverage it rather than duplicate it. Please evaluate integration path, shared schema opportunities, venue-specific recommendation workflows, SEO leverage, and long-term platform moat under a 2-person engineering footprint." 

## Decision Outputs Required

- Chosen auth provider and rollout sequence.
- Chosen database and tenancy strategy.
- API protection pattern and rate-limit policy.
- Observability stack and alert ownership.
- Production go-live checklist with measurable acceptance criteria.
- Final RBAC permission matrix including `delegate_coordinator` day-of scope.
- Live Mode definition of done for mobile execution reliability.

## External Research Intake (2026-05-29)

- Primary intake summary is documented in `docs/client-portal-project/RESEARCH-INTAKE-2026-05-29.md`.
- Note: `docs/deep-research-report.md` is unrelated to REVEL (Long COVID report) and should be excluded from architecture decisions.
- `docs/REVEL Platform Scaling Architecture Review.docx` is relevant; use as directional input with validation gates before hard stack lock-in.

## Atlas Repository Validation (2026-05-29)

Validated directly from `C:/Users/17065/Projects/atlas-capacity-engine`:

- Atlas is running on Next.js 16 + React 19, compatible with current REVEL portal stack direction.
- Venue schema in `src/lib/venues/venue_presets.ts` already captures operational fields needed for production checks:
	- dimensions, realistic ranges, logistics/power, policy constraints, and provenance metadata.
- Capacity engine in `src/lib/logic/capacity-math.ts` emits deterministic status bands (`safe`, `tight`, `unsafe`) suitable for planner trust outputs and AI recommendation guardrails.

Integration implication:

- Prefer import-and-link over rewrite:
	1. import Atlas venue records into REVEL `VenueAtlasRecord`
	2. generate `VenueInsightLink` entries from Atlas constraint categories
	3. map capacity status to user-facing recommendation confidence language
	4. keep Atlas operationally vendor/planner-first while REVEL renders client-safe summaries
