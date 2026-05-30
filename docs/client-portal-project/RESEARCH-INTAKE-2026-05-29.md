# Research Intake - 2026-05-29

## Files Reviewed

- `docs/deep-research-report.md`
- `docs/REVEL Platform Scaling Architecture Review.docx`

## Intake Result

### 1) `deep-research-report.md`

- Content is not about REVEL.
- It is a Long COVID medical research report.
- Action: exclude from REVEL architecture planning inputs.

### 2) `REVEL Platform Scaling Architecture Review.docx`

- Content is directly relevant to REVEL platform scaling.
- Recommends a lean, managed stack centered on:
  - Next.js + Vercel
  - Supabase Postgres + RLS
  - Supabase Auth
  - PowerSync for offline-first mobile sync
- Strongly reinforces:
  - Venue Atlas integration as core moat
  - context-aware upsell automation
  - event-scoped multi-tenant data model
  - mobile-first reliability in low-connectivity venues

## High-Value Recommendations To Adopt

1. Treat weddings as parent event groups with parallel ceremony timelines.
2. Enforce data isolation in database policies (RLS), not only app logic.
3. Add queue-backed async workflows for heavy recalculations and dispatch jobs.
4. Keep AI trust labels plain-language with human override and audit trails.
5. Use Venue Atlas constraints in planning validation and upsell triggers.
6. Use managed infra to preserve a 2-person engineering footprint.

## Caution Flags

- Cost and scale estimates in the report are directional, not validated against REVEL production traffic.
- The source list includes non-authoritative links (forums/blogs); decisions should be validated against vendor docs and internal benchmarks.
- PowerSync should be treated as a strategic option, not a locked decision, until a short proof-of-concept confirms fit for REVEL workflows.

## Immediate Validation Checklist

1. Build a 1-week offline sync proof-of-concept on one planner workflow.
2. Validate Supabase Auth + RLS policy model for couple/planner/vendor/guest roles.
3. Run load tests for API burst + DB connection pooling behavior.
4. Verify Venue Atlas schema mapping against existing `DATA-CONTRACT.md` entities.
5. Finalize go/no-go decision matrix for PowerSync vs lighter alternatives.

## Decision Recommendation

Use the DOCX report as the primary external input, with a validation-first approach:

- Adopt architecture direction now.
- Gate final platform commitments behind the 1-week technical proof points above.

## Strategic Expansion: DIY and Family Coordinator Lane

Decision: add a first-class planner-less workflow while preserving planner-grade operational depth.

Three product lanes to support in one shared platform:

1. DIY Couple
2. DIY + Family Coordinator
3. Planner / Premium Concierge

### Role Model Update (Required)

Add a dedicated `delegate_coordinator` role.

Allowed:

- mark timeline items complete
- update timing/status for day-of execution
- send scoped guest/vendor timeline notifications
- operate Live Mode execution checklist

Restricted:

- no contracts
- no billing changes
- no admin/security settings

### UX Requirement: Live Mode

For `delegate_coordinator`, mobile UX should be phase-based and action-sequenced, not dashboard-heavy.

Live Mode requirements:

- current phase only
- next critical action
- venue-aware checklist prompts
- urgent alerts and escalation path
- clear timing deltas (on-time, at-risk, delayed)

### Monetization Update

Add DIY Pro + Expert Review upsells:

- timeline review (one-time)
- venue logistics review (one-time)
- production recommendation review (one-time)

Rationale: capture budget-sensitive couples who will not buy full planning while preserving upgrade paths to premium services.

## UX/UI Constraints Locked From Latest Review

1. Keep cognitive load very low for new users and family coordinators.
2. Preserve premium concierge tone and avoid generic consumer-app feel.
3. Enforce Zero Blank Canvas: onboarding must generate a pre-filled starting plan.
4. Add Pass the Baton flow: couple can hand day-of execution to `delegate_coordinator` with one invite action.
5. Live Mode should open directly from baton invite, without exposing planner dashboard complexity.

### Onboarding Success Standard

Within first minute, user should have:

- selected role
- selected venue
- selected primary event sequence
- received a pre-built baseline timeline

This first-minute success moment is required for activation and upgrade conversion.

## Atlas Repo Validation (Direct Code Review)

Source reviewed: `C:/Users/17065/Projects/atlas-capacity-engine`

What is now confirmed from code (not inferred):

1. Runtime baseline is Next.js 16 + React 19 (`package.json`), which aligns with REVEL portal direction.
2. Atlas has an explicit typed venue model in `src/lib/venues/venue_presets.ts` with fields REVEL needs now:
  - dimensions/capacity (`l`, `w`, `h`, `marketingCap`, `comfortableRangeMin/Max`)
  - logistics/power (`loadingDock`, `pushDistanceFt`, `totalAmps`, `hasThreePhase`, `hasCamlocks`)
  - policy constraints (`hazeAllowed`, `coldSparksAllowed`, `openFlameAllowed`, `curfewTime`, `baraat`)
  - trust/provenance (`provenance`, `venueSources`, `diagramAssets`, `venueVerification`, `lastVerified`)
3. Atlas includes deterministic capacity math in `src/lib/logic/capacity-math.ts` with status outputs (`safe`, `tight`, `unsafe`) that can directly feed REVEL planner trust language.
4. Atlas UX is explicitly planner/vendor-first in `README.md`; this reinforces keeping client-facing REVEL surfaces as translated outputs, not raw operational UI.

### Integration Mapping To REVEL Data Contract

- Atlas `VenueTechPack` -> REVEL `VenueAtlasRecord`
- Atlas `provenance` + `venueSources` + `lastVerified` -> REVEL trust lineage fields
- Atlas capacity output (`safe`/`tight`/`unsafe`) -> REVEL recommendation confidence + next-best-action copy
- Atlas policy/logistics fields -> REVEL `VenueInsightLink` rows used by timeline checks and upsell triggers

### Implementation Note

Use a snapshot import first (read-only pull), then add incremental sync. Do not block Phase A production hardening on full bi-directional integration.
