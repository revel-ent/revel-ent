# Atlas Canon Review
**Document type:** Synthesis audit  
**Status:** Authoritative baseline — June 28, 2026  
**Author:** Claude (taking over from ChatGPT handoff — full codebase read + all docs surveyed)  
**Next step:** 00_Atlas_Constitution.md derives from this document

---

## Purpose of This Document

Before writing any permanent documentation, this Canon Review establishes the ground truth:  
- What Atlas is and what is actually built  
- What is inconsistent, drifted, or contradictory across existing docs  
- What Atlas is, stripped of everything unnecessary  
- The canonical identity that all future documentation derives from  
- The order in which the permanent Atlas documentation should be written  

This document does not prescribe. It observes, synthesizes, and clarifies.

---

## Part 1 — Atlas As It Actually Exists Today

### What Has Been Built

Atlas is a **Next.js 16 / Supabase / Gemini AI platform** for premium multi-day weddings, operated by REVEL Entertainment. As of June 28, 2026:

**Live and functional:**
- **Fusion Flow Experience Architect** — AI-generated event arc, cultural moment sequencing, music transition notes, lighting state suggestions. Powered by Gemini. Accepts cultural blend, guest count, venue, and priorities.
- **Venue Production Analyzer** — Constraint extraction and risk detection for a given venue + room + event profile. Pulls from Atlas venue constraint database. Identifies 4 core risk triggers: outdoor power/curfew, capacity squeeze, tight room flip, rigging/ceiling constraints.
- **Role-based portal** — 10 roles (admin, couple_owner, planner_admin, vendor, guest, delegate_coordinator, venue_coordinator, dj_mc, decorator, production). Route access enforced in `proxy.ts` middleware.
- **Event-scoped multi-tenant database** — Every record scoped to `event_id`. Memberships table enforces who can see which event. 20+ migrations applied.
- **Timeline engine** — `canonical-timeline.ts` with conflict detection (overlaps, tight turnovers < 15 min, missing durations), role-scoped views, delegate update bounds.
- **Commercial state + entitlements** — Atlas workspace modes (revel_managed vs. independent). Three plan tiers (essential/pro/premium). Stripe checkout wired. Entitlement templates + immutable audit log.
- **AI Concierge** — Role-aware Gemini assistant answering workflow questions and routing to next action.
- **Operations dispatch** — Email (Resend) and WhatsApp (Twilio) for planner-to-vendor coordination.
- **Venue database** — 55 Georgia venues seeded with constraint profiles, trust metadata (source_type, confidence, verification status, provenance).

**Infrastructure in place:**
- Supabase RLS policies (app layer enforces above service role)
- JWT session management (`jose`, `revel_session` cookie, 24h TTL)
- Stripe webhooks + payment method configuration (card, Apple Pay, ACH, Zelle, Venmo, Cash App)
- Document intake pipeline (PDF → Gemini extraction → timeline obligations → review queue)
- Invite lifecycle (send, accept, revoke, resend — email-based)
- Vitest + Playwright test infrastructure

**Stubs (built but not production-grade):**
- Role-specific dashboards (couple, planner, vendor, guest, dj, production, venue) — scaffolded but thin content
- Live Mode execution flow — structure in place, limited content
- Guest concierge — wired but lightweight

**Not built:**
- Real authentication identity (currently uses mock UUID hashing; `PORTAL_ENABLE_DEMO_AUTH` is required; Supabase Auth / external IdP not yet integrated)
- Observability (no structured logging, tracing, or SLO alerts)
- Rate limiting
- Async queue infrastructure
- Storage RLS policies (server-only access for now)
- Marketing site migration to Next.js (14 static HTML pages at root still use old design system)
- Compliance/retention/deletion documentation

### What The Codebase Reveals About Identity

The codebase is telling about what Atlas prioritizes:

- 1,500+ lines in `canonical-timeline.ts` → **operational scheduling is a first-class problem**
- `atlas-operational-truth/` module with capacity math, timeline validation, field detection → **feasibility math is a first-class problem**
- Trust metadata required on every venue field (source_type, source_reference, verified_by, verified_on, confidence_score, review_by) → **data provenance is a first-class problem**
- 10 distinct roles with separate route matrices → **information access is a first-class problem**
- Commercial state isolated into its own module with entitlement templates → **this is built to scale as a product, not just internal tooling**

---

## Part 2 — Inconsistencies Found

### 1. Stale Phase Labels

**What docs say:** Phase 1 (Weeks 1–2) = venue + contract wedge. Phase 2 (Weeks 3–4) = vendor coordination. Phase 3 (Weeks 5–6) = guest experience.

**What's true:** It is Week ~6 since `strategic-focus.md` was written (2026-05-21). Fusion Flow and Venue Analyzer (Phase 1 items) are live. Most of Phase 1–3 infrastructure exists. The roadmap language still reads as future tense on things that are complete.

**Impact:** Confuses any new contributor about current build state. Creates false impression that Atlas is earlier-stage than it is.

**Fix:** ROADMAP.md needs a "Current State" section at the top, written in present tense, before the forward-looking roadmap.

---

### 2. "Global" Copy vs. Georgia-Only Venue Database

**What the landing page claims:** "Global AI intelligence layer," "55+ Cities Covered."

**What is true:** The venue database contains 55 Georgia venues. There are no cities outside Georgia. The product has not been tested in other markets.

**Impact:** This is a credibility problem — not just a copywriting inaccuracy. Planners who try Atlanta venues and get deep constraint data, then try New York venues and get nothing, will lose trust immediately.

**Fix:** Landing page copy must be honest about current coverage. "Georgia's most detailed venue intelligence database" is more compelling than "global" when your early users are Georgia-based planners. Honesty is the moat. See ChatGPT's own note: *"if the immediate focus is locking down Georgia venues... lean harder into regional exclusivity or depth of local data."* This is correct. Do it.

---

### 3. Three Visual Systems Coexisting

**System A (legacy, static HTML):** Dark maroon, Oswald all-caps, henna-pattern accents. Used in the 14 static `.html` pages at the root.

**System B (approved, Next.js landing):** Light cream, deep navy, brass gold, mixed-case serif headlines, photo-rich venue cards. Documented in `portal-app/docs/ui-reference/README.md`.

**System C (ChatGPT concept, not implemented):** Black background, gold accents, luxury editorial aesthetic — the images generated in the ChatGPT conversation. Dramatically different from System B.

**Impact:** If a contractor opens the repo, they see three styles and have no idea which is canonical. Users switching between the static pages and the Next.js app experience jarring visual discontinuity.

**Fix:** System B is the approved direction (confirmed in `portal-app/CLAUDE.md`). System C is a concept worth reviewing, but cannot replace System B without a deliberate decision and full rebuild. System A should be phased out as static pages migrate to Next.js. The decision needs to be written down explicitly in the Design Bible.

---

### 4. Scope Drift in Secondary Documents

Across the 40+ documents, the following features have appeared in planning or roadmap discussions despite being explicitly excluded from `strategic-focus.md`:

| Feature | Where it appeared | Strategic status |
|---|---|---|
| Budget calculator (full) | BRD.md, some roadmap notes | ❌ Excluded Phase 1–2 |
| Seating charts | Peripheral mentions | ❌ Excluded |
| Guest RSVP / wedding website | Some roadmap docs | ❌ Excluded Phase 1–2 |
| Contact database / email CRM | Some planning notes | ❌ Explicitly excluded |
| Vendor marketplace | One roadmap note | ❌ Explicitly excluded |
| Planner firm management | Phase 2+ speculation | ❌ Not in Phase 1–2 |

**Impact:** Feature requests from these stale mentions can re-surface and waste planning cycles. The Constitution must make exclusions immutable.

---

### 5. Authentication Is a Launch Blocker (Underdocumented)

**What the system uses:** Demo UUID hash auth (`PORTAL_ENABLE_DEMO_AUTH`). The `resolveSessionUserUuid` function in `lib/mock-data.ts` is explicitly for demos. Production auth (Supabase native, Clerk, or Auth0) is not yet integrated.

**Impact:** The system cannot be used by real clients in production. This is the single most critical gap in the entire build.

**Severity:** This is not noted prominently in the current roadmap. It appears in the SUPABASE-OPS-PLAYBOOK and some technical notes, but is not called out as the top-priority pre-launch item.

**Fix:** Auth integration must be the first engineering item to complete before any external user touches the system. It needs explicit documentation and a rollout plan.

---

### 6. "Atlas" Has Two Meanings

In some contexts, **Atlas** refers to the entire product/platform (what this document calls Atlas). In other contexts, **Atlas** refers specifically to the venue intelligence database layer within the product (the `atlas_record_id`, `atlas_slug` fields, the `atlas-operational-truth/` module, the `atlas_evaluations` table).

**Impact:** When someone says "Atlas data" vs "the Atlas platform," the intended meaning isn't always clear. New contributors and future documentation will inherit this ambiguity.

**Fix:** Establish a glossary entry in the Constitution: **Atlas** = the platform. **Atlas Venue Intelligence** = the venue constraint data layer. **Atlas Operations OS** = the coordination and execution layer.

---

### 7. No Canonical Landing Page Source of Truth for Developers

The ChatGPT conversation referenced two generated landing page images. These images exist in the ChatGPT Project but are not in the repository. The `portal-app/docs/ui-reference/images/` folder has mockups, but it's unclear which are approved and which are exploratory.

**Impact:** The landing page `/atlas` in the Next.js app was built from some reference, but there's no document saying "this is the approved design, build from this."

**Fix:** The Landing Page PRD (document 08 in the planned sequence) must reference the specific approved images and specify which elements are locked vs. flexible.

---

### 8. Contract Intelligence Is Described But Not Shipped as Promised

`strategic-focus.md` describes "Contract Intelligence" (extracting timeline, vendor obligations, overtime triggers, meal requirements from PDF contracts) as a core moat alongside Venue Intelligence. The code has an intake pipeline with Gemini extraction. However:
- No "review queue" UI is visible in the current portal routes
- The extraction output format is defined but the verification workflow (marking fields as verified/research-needed) is not visible in the planner workspace
- This is described as Phase 1 (complete) but reads as still in progress

**Fix:** Clarify in ROADMAP.md whether contract intelligence is Phase 1 complete, Phase 2 in progress, or Phase 3. Do not let it appear "done" in strategy docs while still in progress in the code.

---

## Part 3 — What Atlas Really Is

Strip away everything that has drifted, speculated, or been added out of enthusiasm. Here is what remains:

### The Sentence

> **Atlas is the operational feasibility platform for premium multi-day South Asian weddings — turning hidden venue constraints and production risks into visible, actionable intelligence before they become day-of disasters.**

### The Problem It Uniquely Solves

Wedding planners book venues based on marketing claims ("850 guests capacity"). They discover operational reality — the circuit breaker can handle 100 amps, the elevator fits a 9-foot panel, the curfew is 10 PM, the room flip takes 45 minutes — only after booking, after vendor contracts are signed, sometimes during setup.

**Atlas makes operational reality visible at the right time: before commitments are made.**

This is defensible because:
1. It requires real venue research, not crowdsourcing. Every data point has a source, confidence level, and verification status.
2. Planners trust it because it shows constraints, not just recommendations.
3. Venues cannot game it — a constraint is a physical or contractual fact, not a rating.
4. Competitors (Zola, The Knot, HoneyBook, Aisle Planner) show venue marketing materials. None show operational truth.

### Why Planners Will Adopt It

- The Venue Analyzer gives them something defensible to show clients. "This is why we can't fit 850 people: the comfortable capacity for your event configuration is 612."
- It reduces the "I should have known this" moment every experienced planner has had.
- The timeline engine catches conflicts before the day-of. That's a career-saving feature, not a convenience.

### Why Vendors Will Trust It

- Vendors see only what they need. Not the client's payment history. Not another vendor's contract. Their timeline slice, their requirements, their check-in window.
- Change propagation is instant. When the timeline shifts, vendors know before they've set up wrong.

### Why Existing Software Cannot Compete

- **The Knot / Zola** — Consumer-first. Venue listings are marketing profiles, not operational truth. No planner adoption.
- **HoneyBook / Aisle Planner** — CRM + project management. Not venue intelligence. Planners use them despite their limitations because there's nothing better for the operational layer.
- **Social Tables** — The only tool planners actually adopted in large numbers. Reduces floor plan risk. Atlas reduces timeline and production risk. These are complementary, not competitive — which is exactly why Social Tables is still thriving.

The gap Atlas fills is not another tool in the planning stack. It's the missing **operational truth layer** underneath all of them.

---

## Part 4 — The Proposed Canon

One source of truth per concern. Everything else derives from it.

### What Is Canon (Immutable)

These statements are not opinions. They are the decisions that define Atlas. Every future feature, every copy line, every design choice should be tested against them.

**Identity:**
- Atlas is an operational intelligence platform, not a planning app, CRM, marketplace, or consumer product.
- Atlas serves professional event planners and vendors. Couples and guests are secondary surfaces.
- Atlas's primary domain is premium multi-day South Asian/fusion weddings in Atlanta/Georgia (expanding when the data expands, not before).

**Data:**
- Every venue data point must carry: source_type, source_reference, verified_by, verified_on, confidence_score, and review_by. No naked data.
- Operational truth supersedes marketing claims. Always show realistic capacity alongside marketed capacity.
- Contract intelligence (timeline extraction, obligation detection) is the second moat alongside venue intelligence.

**Access:**
- All data is event-scoped. No cross-event data leakage.
- Role access is least-privilege by default. A vendor sees their tasks and timeline slice. Nothing else.
- Planner is the operational authority. Couple is the client. Guest is an audience member.

**Scope:**
- Budget calculators, seating charts, guest RSVPs, wedding websites, vendor marketplaces, review systems, email CRM, and deal pipelines are permanently out of scope for Phase 1–2.
- Guest portal features are additive and bounded: itinerary + logistics + FAQ. No social features.
- The moat is operational depth, not feature breadth.

**Honesty:**
- Atlas does not claim coverage it does not have.
- Atlas does not claim AI capabilities it has not built.
- Atlas does not display testimonials that are placeholders.
- Confidence levels on data are shown, not hidden.

### What Derives From Canon

Everything else — design choices, product decisions, copy, features — should be derivable from the above. If a decision cannot be grounded in Canon, it should not be made until Canon is extended with a deliberate decision.

---

## Part 5 — Documentation Roadmap

The permanent Atlas documentation should be written in this exact order. Each document derives from the previous.

| # | Document | What it establishes | Derives from |
|---|---|---|---|
| `Canon Review` | This document | Ground truth + inconsistencies | Codebase + all existing docs |
| `00_Atlas_Constitution.md` | Immutable identity + principles + non-negotiables | Canon Review |
| `01_Atlas_Product_Philosophy.md` | How Atlas thinks — beliefs that guide product decisions | Constitution |
| `02_Atlas_Brand_Design_Bible.md` | Visual identity, emotional goals, tone, typography, color, motion | Product Philosophy |
| `03_Atlas_Design_System.md` | Tokens, grid, type scale, color system, spacing, elevation | Brand Bible |
| `04_Atlas_Component_Library.md` | Every component: anatomy, states, variants, do/don't | Design System |
| `05_Atlas_Engineering_Bible.md` | Coding standards, folder structure, patterns, testing, performance | Design System + existing codebase |
| `06_Atlas_Landing_Page_PRD.md` | Landing page specification, copy, layout, conversion goals | All of the above |
| `07_Atlas_Product_Architecture.md` | Module map, role experiences, data flows | Constitution + existing codebase |

**What to update (not replace) in existing docs:**
- `ROADMAP.md` — Add "Current State" section at top. Update phase labels to reflect what's live.
- `PRD.md` — Add auth gap as a pre-launch blocker. Remove any CRM/budget/marketplace scope.
- `FEATURE-SPECS.md` — Split into "Live" vs. "Planned" sections.
- `strategic-focus.md` — Add coverage honesty guardrail (Georgia-first, not "global").

**Do not write yet:**
- Engineering Bible (write after: understand what the codebase has proven vs. assumed)
- Component Library (write after: design system is locked)
- Landing Page PRD (write after: brand direction is chosen and canonical)

---

## Appendix — Files Audited

**Codebase:**
- 184 TypeScript/TSX files in `portal-app/`
- 100+ API route handlers
- 20+ Supabase migrations
- Core modules: `atlas-types.ts`, `atlas-venues.ts`, `atlas-operational-truth/`, `atlas-evaluations.ts`, `atlas-commercial.ts`, `canonical-timeline.ts`, `auth.ts`, `proxy.ts`, `gemini.ts`

**Documentation:**
- `docs/strategic-focus.md` (2026-05-21)
- `docs/client-portal-project/PRD.md`, `BRD.md`, `ROADMAP.md`, `FEATURE-SPECS.md`, `DATA-CONTRACT.md`, `DECISION-LOG.md`, `RBAC-PERMISSIONS-MATRIX.md`, `PROJECT-CHARTER.md`
- `docs/atlas-vendor-guest-portal-strategy.md`
- `docs/execution-log.md`, `docs/next-gen-roadmap.md`, `docs/redesign-summary.md`
- `portal-app/CLAUDE.md`, `portal-app/docs/ui-reference/README.md`
- ChatGPT conversation (June 28, 2026)

**Design:**
- `portal-app/docs/ui-reference/images/` (mockups)
- Two landing page concepts generated by ChatGPT (external — not in repo)
- 14 static HTML pages (legacy design system)

---

*This document is the baseline. All permanent Atlas documentation derives from it. When reality changes — when phases complete, when scope evolves, when the data expands beyond Georgia — update this document first, then update what derives from it.*
