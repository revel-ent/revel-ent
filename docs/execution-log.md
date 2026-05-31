# REVEL Execution Log (Living)

Last updated: 2026-05-22 (night)
Owner: REVEL Product + Copilot

## Working Principle

- Efficiency is the core decision filter.
- No feature ships unless it saves time, reduces rework, or lowers coordination cost.

## Current Decision Snapshot

### 1) Do we need separate Planner/Decorator portals right now?

Decision: Not required as separate products in Phase 1.

Recommendation:
- Build one unified Atlas app with role-based modes/views.
- Keep one codebase and one navigation shell.
- Render role-specific modules based on role + task context.

Why:
- Faster to ship and maintain.
- Lower product fragmentation risk.
- Still gets role clarity and permission control.

When to split into separate portals:
- If role journeys diverge enough that shared navigation becomes confusing.
- If one role needs independent release cadence or branding.
- If usage data shows role friction from mixed surfaces.

### 2) Distinct pages for Planner/Decorator/Admin (clarified)

Interpretation for Phase 1:
- Distinct role pages/views inside one portal, not separate apps.

Minimum route model:
- /atlas/planner
- /atlas/decorator
- /atlas/admin

All routes can share backend services and data models.

### 3) Atlas Strategic Focus: Operational Intelligence, Not All-in-One (CRITICAL)

Decision: Keep Atlas focused on the operational intelligence wedge; do NOT expand into generic CRM, full planner OS, or full guest portal.

Why this matters:
- Three separate products are trying to emerge simultaneously:
  1. Atlas Venue Intelligence (KEEP SHARP)
  2. Vendor Workspace / Operations OS (YES, but lightweight)
  3. Guest Portal / Client Experience (DANGEROUS if expanded too early)
- If all three launch together, Atlas loses its wedge and competes on weak margin.
- The moat lives in: venue intelligence, operational feasibility, vendor coordination, conflict prevention, trust-layer data.
- That is far rarer and more defensible than generic wedding software.

Atlas positioning (not):
- ❌ Generic CRM or planner workspace
- ❌ All-in-one wedding platform
- ❌ Wedding marketplace or consumer portal
- ✅ Operational intelligence layer for live events

What planners actually value (Mirangi signal):
- Desktop-first workflows, not mobile magic.
- Tools that directly reduce operational friction (like Social Tables).
- Education + filtering, not just features.
- Reduction of operational waste, not just addition of features.

### 4) Budget calculator strategy

Decision: Keep calculator as top-of-funnel entry and promote logic to shared service.

Recommendation:
- Public calculator remains fast and client-facing.
- Move budget formulas to central Budget Intelligence engine.
- Reuse same engine in planner/decorator/admin views and AI/chat channels.
- AI chatbot should call the same budget engine for higher accuracy and consistency across channels.

## Strategic Guardrails (Guard Against These)

DO NOT expand into:
- Full CRM features (native email, deal pipelines, contact databases)
- Generic project management (Asana/Monday.com equivalents)
- Full guest experience (RSVPs, seating, wedding websites, registries, invitations)
- Planner marketplace or vendor marketplace

DO stay focused on:
- Realistic venue capacities, production constraints, vendor logistics
- Contract extraction and timeline conflict detection
- Operational validation and feasibility scoring
- Vendor coordination for production truth
- Trust-layer data (sourced, verified, reviewed)

## Immediate Action Plan (Refined for 90-Day Wedge)

See docs/strategic-focus.md for detailed 90-day roadmap.

Short version:

**Phase 1 (Weeks 1-2): Nail the Venue + Contract Wedge**
- Venue intelligence: capacity, constraints, feasibility data
- Contract ingestion: PDF to timeline extraction
- Conflict detection: vendor obligations vs. venue rules
- Verification workflow and trust-layer architecture

**Phase 2 (Weeks 3-4): Vendor Coordination**
- Role-based vendor views (lightweight, operational)
- Operational runbooks and change logs
- Logistics visibility and task assignment
- NOT full CRM or HoneyBook competitor

**Phase 3 (Weeks 5-6): Lightweight Guest Experience**
- Itinerary distribution
- FAQs and logistics (parking, attire, timing, cultural notes)
- Operational clarity, not engagement layer
- NOT weddings sites, RSVPs, seating, registries
Contract ingestion MVP: PDF parser + timeline extractor or manual upload initially?
- Venue data sourcing strategy: internal research, partner API, or crowdsourced trust?
- Minimum compliance/security requirement before vendor rollout?

## Change Log

- 2026-05-21: Created living execution log.
- 2026-05-21: Decided not to force separate Planner/Decorator products in Phase 1; use role-based views in one app.
- 2026-05-21: Locked recommendation to centralize budget logic into shared engine.
- 2026-05-22 (portal): Upgraded client portal to include intent-based start paths, workflow-specific deep links, trust/readiness block, and outbound CTA instrumentation.
- 2026-05-22 (launch): Added two high-leverage launch modules to client portal: Fusion Flow Experience Architect and Venue Production Analyzer.
- 2026-05-22 (ops): Created `docs/client-portal-project/` hub with charter, roadmap, feature specs, policy, data contract, metrics, checklist, decision log, operating rhythm, and production handoff docs.
- 2026-05-22 (build): Created `portal-app/` authenticated Next.js scaffold with role-based route guards, event-scoped access pattern (mock session), protected role routes, and successful install/build validation.
- 2026-05-22 (security): Replaced plain role/event cookies in `portal-app/` with signed `revel_session` token claims using `jose`; updated middleware/session verification and revalidated production build.
- 2026-05-22 (build sprint): Upgraded scaffold to membership-based login (email + event code), added mock event/member registry, and implemented functional Fusion Flow + Venue Analyzer API endpoints with Couple/Planner UI tool forms; build remains green.
- 2026-05-22 (build sprint 2): Added vendor coordination feed endpoint/UI and guest concierge endpoint/UI, expanded signed claims with identity fields, and revalidated full `portal-app` production build.
- 2026-05-22 (deploy): Deployed `portal-app/` to Vercel production alias `portal-app-gray-sigma.vercel.app` and validated live login/page routing.
- 2026-05-22 (hotfix): Added `PORTAL_SESSION_SECRET` in Vercel Production and Development environments after live login returned HTTP 500; confirmed authenticated planner login reaches `/portal` successfully.
- 2026-05-22 (hardening): Updated login auth route to fail gracefully on session configuration issues (`configuration_error`) instead of raw HTTP 500 and redeployed to production alias.
- 2026-05-22 (ops communications): Added Planner Operations Dispatch workflow in `portal-app/` with coordination-summary generation, preview/export, and outbound adapters for Resend email + Twilio WhatsApp (with simulation fallback when provider credentials are unset).
- 2026-05-22 (pricing model): Added dual access-model positioning to `client-portal.html` (included access for REVEL-managed weddings plus paid self-serve portal for non-REVEL weddings) with tracked CTAs for consult and self-serve pricing demand.
- 2026-05-22 (deploy): Deployed updated marketing site to `revel-ent.vercel.app` and verified the Client Portal page renders the new "Choose Your Access Model" section in production.
- 2026-05-22 (live dispatch verify): Redeployed `portal-app` with outbound provider credentials and validated planner dispatch in production: Twilio WhatsApp send succeeded, while Resend email sends are blocked until sender domain verification is completed in Resend.
- 2026-05-22 (messaging): Completed Resend DNS/domain verification for `updates.revel-ent.com`, updated sender configuration, and validated live dispatch success across email and WhatsApp in production.
- 2026-05-22 (defaults): Updated planner dispatch default recipients to real owner contacts (`info@revel-ent.com`, `+17065774914`) and redeployed to production alias.
- 2026-05-22 (launch ops): Added `docs/pmf-validation-scorecard.md` and `docs/squarespace-cutover-gate.md` to enforce 2-4 week PMF evidence before full Squarespace decommission.
- 2026-05-22 (seo p0): Added `robots.txt`, `sitemap.xml`, `llms.txt`, canonical normalization across core pages, structured metadata/schema enhancements, and new high-intent landing page `indian-wedding-dj-atlanta.html` with homepage internal linking.
- 2026-05-22 (seo p1): Added four Atlanta intent pages (`south-asian-wedding-dj-atlanta.html`, `baraat-dj-atlanta.html`, `sangeet-dj-atlanta.html`, `indian-wedding-mc-atlanta.html`), expanded internal-link mesh across core marketing pages, and updated `sitemap.xml` + `llms.txt` to include all new URLs.
- 2026-05-22 (seo p2): Added featured real wedding page `jayati-uppal-patel-wedding-atlanta.html`, kept redirect coverage from the prior Jayati URL, added FAQ schema and visible FAQ blocks for homepage plus key service pages, Google Business Profile checklist, SEO measurement checklist, and additional internal links into the wedding highlight.
- 2026-05-27 (seo p2 continuity): Replaced wedding-page media placeholders with wired image/video modules and updated social/schema hero image targets on `jayati-uppal-patel-wedding-atlanta.html`; deployed to production alias `revel-ent.com` and revalidated old Jayati URL redirect behavior. Note: source media files are still absent from `images/weddings/jayati-uppal/` and `videos/weddings/jayati-uppal/`, so those references need the actual uploaded assets to render live.
- 2026-05-29 (portal reliability): Rewired `client-portal.html` CTA/module links away from stale `atlas-revel.vercel.app` URLs to authenticated `portal-app-gray-sigma.vercel.app/login?next=...` deep links, added safe `next` redirect handling in `portal-app/app/api/auth/mock-login/route.ts`, and passed `next` through `portal-app/app/login/page.tsx` via hidden form input. Added local `.env.local` session secret for immediate dev usability and validated end-to-end local flow: login deep-link to `/portal/planner` and successful Venue Analyzer API execution.
- 2026-05-30 (onboarding build sprint): Implemented concierge onboarding foundation in `portal-app/` with `delegate_coordinator` role expansion, Screen 1 venue capacity validation (`/portal/onboarding`), Screen 2 Zero Blank Canvas timeline generation (`/portal/onboarding/timeline`), Supabase-ready approve/save APIs, and migration SQL files (`001_revel_foundation.sql`, `002_revel_rls_baseline.sql`). Added Supabase ops playbook and onboarding marketing messaging docs for execution + go-to-market continuity.
- 2026-05-30 (live mode mvp): Shipped shared event timeline + live snapshot APIs (`/api/events/timeline`, `/api/events/live`, `/api/events/live/update`) and integrated reusable `EventTimelineCard` + `LiveModeCard` into Couple, Vendor, Guest, Planner, and Live Mode surfaces so each role sees now/next/urgent/contact context with bounded day-of update actions for planner/admin/delegate coordinator.
- 2026-05-30 (live mode persistence + test automation): Added Supabase-backed timeline/live read path (with mock fallback), enabled persisted timeline status updates in `/api/events/live/update` when event/step UUID context is present, and introduced automated quality gates (`lint`, `build`, `vitest` API route tests, `playwright` planner flow test) for repeatable release validation.
- 2026-05-30 (org migration): Created GitHub organization `revel-ent`, created repositories `revel-ent/revel-ent` and `revel-ent/atlas-capacity-engine`, pushed REVEL workspace initial history + cleanup commit, mirrored Atlas history/tags into org repo, and repointed local Atlas remote to org URL.
- 2026-05-21 (website): Replaced blocked Instagram embeds on the Our Work page with a native image portfolio grid linking directly to Instagram posts, removed embed.js dependency, and added outbound tile click instrumentation in js/main.js to measure engagement.
- 2026-05-21 (evening): Incorporated ChatGPT strategic feedback; refined Atlas focus to operational intelligence wedge (venue + contract intelligence first), then vendor coordination, then lightweight guest layer. Deprioritized full CRM, planner OS, and expanded guest portal to avoid diffusion
## Data Contract Notes

Each critical venue field should include:
- value
- source_type
- source_reference
- verified_by
- verified_on
- confidence_score
- expires_on_or_review_by

## Efficiency KPIs (Track Monthly)

- Lead qualification time reduction
- Venue shortlist creation time reduction
- Coordination message volume reduction
- Timeline clarification calls reduction
- Day-of escalation count reduction

## One-Shot Build Plan (Next)

1. Budget AI engine extraction
- Done criteria: Budget logic is moved to a shared service module with no UI-only dependencies.
- Done criteria: Planner, decorator, and admin views all consume the same budget service outputs.

2. Chatbot budget endpoint
- Done criteria: A server endpoint returns budget recommendations from the shared budget engine.
- Done criteria: Chat responses include assumptions and key inputs used for each recommendation.

3. Unified role routes
- Done criteria: /atlas/planner, /atlas/decorator, and /atlas/admin each render role-specific dashboards.
- Done criteria: Access control and route guards enforce role permissions for each route.

4. Vendor workspace MVP
- Done criteria: Vendors can access event-scoped tasks, timeline items, and assigned requirements.
- Done criteria: Workspace includes venue restrictions and a visible change log for updates.

5. Instrumentation and pilot
- Done criteria: Core events are tracked for budget usage, route engagement, and vendor task completion.
- Done criteria: A pilot cohort is launched with baseline and post-launch efficiency metrics captured.

## Open Questions

- Preferred auth model for vendor invitations (magic link vs account login)?
- Guest portal scope for Phase 1 (itinerary only or itinerary + messaging)?
- Minimum compliance/security requirement before vendor rollout?

## Change Log

- 2026-05-21: Created living execution log.
- 2026-05-21: Decided not to force separate Planner/Decorator products in Phase 1; use role-based views in one app.
- 2026-05-21: Locked recommendation to centralize budget logic into shared engine.
