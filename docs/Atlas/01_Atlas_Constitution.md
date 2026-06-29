# Atlas Constitution
**Version:** 1.1  
**Status:** Authoritative — do not modify without a documented decision  
**Date:** June 28, 2026 (amended June 28, 2026)  
**Derives from:** `00_Canon_Review.md`, `03_Atlas_Five_Year_Vision.md`

---

> Every future product decision, design choice, feature, copy line, and engineering pattern  
> should be tested against this document. If the decision cannot be grounded here, it belongs  
> in a deliberate extension of this document — not in a one-off call.

---

## Article I — Identity

### I.1 What Atlas Is

Atlas is the **intelligence infrastructure for the wedding industry**.

Atlas's foundational advantage is the **Atlas Venue Intelligence Engine** — the world's most comprehensive database of sourced, verified, confidence-rated operational constraints for event venues. This powers AI-assisted venue matchmaking, feasibility assessment, timeline generation, risk detection, and vendor coordination.

Atlas exists to help every participant in a wedding make better decisions, faster — so every wedding dollar goes toward unforgettable moments instead of avoidable mistakes.

### I.2 What Atlas Is Not

Atlas is not:
- A planner CRM (email pipelines, deal tracking, contact databases)
- A marketplace (venue discovery through marketing listings, vendor reviews, open booking)
- A social product (guest-to-guest communication, photo sharing, public profiles)
- A generic project management tool (Asana/Notion/Monday features grafted onto event planning)

**Amendment I.2.A — Clarification on "consumer product":**  
Earlier versions of this Constitution stated Atlas is "not a consumer product." This is amended. Atlas serves couples who choose to plan their own weddings — a significant, underserved audience. The consumer surface (Atlas Discover, couple-operated Atlas Plan) is in scope. What is not in scope is consumer social features, marketplace dynamics, or any feature that does not reduce operational uncertainty.

### I.3 Who Atlas Serves

**Primary users (co-equal):**
- **Couples** — who want to find venues, plan events, and understand what their wedding requires, with or without a professional planner
- **Professional planners** — who need an operational command center for managing multiple complex events

**Operational users:**
- **Delegate coordinators and venue coordinators** — bounded operational authority, event-scoped
- **Vendors (DJ/MC, decorators, caterers, photographers, production)** — task and timeline access within their assigned scope

**Secondary users:**
- **Guests** — itinerary and logistics clarity for the segments they attend
- **Venues** — data management and verification for their operational profiles

**The experience principle:** A couple who opens Atlas feels like they have a knowledgeable strategist. A planner who opens Atlas feels like they have an operationally complete command center. A vendor who opens Atlas sees exactly what they need and nothing else. Each audience has a genuinely different interface, not one interface with features hidden.

### I.4 The Domain

Atlas's current domain: **premium South Asian/fusion weddings, primarily in Atlanta and Georgia**.

This is not a limitation. It is the moat. Deep, verified, operationally accurate data about 55+ Georgia venues is more valuable than shallow marketing-content aggregation across thousands of venues globally.

Atlas expands its geographic coverage when its data quality can be maintained at the same standard — not before. Do not claim "global" or "55+ cities" coverage until it is true.

---

## Article II — The Core Problem

### II.1 The Problem Atlas Solves

Wedding planners book venues based on marketing claims.

They discover operational reality — realistic capacity, power limitations, curfews, rigging restrictions, room flip windows, elevator constraints — only after booking, after vendor contracts are signed, sometimes during day-of setup.

**This is the problem Atlas solves: the gap between what venues claim and what is operationally true.**

### II.2 Why This Problem Is Defensible

Every other planning tool shows venue marketing materials. None show operational truth. Atlas's moat is earned through real venue research — each data point sourced, confidence-rated, and verified. Venues cannot game it; a constraint is a physical fact, not a rating.

The data layer compounds over time. Each verified constraint, each sourced fact, each flagged risk makes Atlas more accurate and harder to replicate. This is where the enterprise value lives.

### II.3 The Two Moats

**Moat A — Venue Operational Intelligence:**
Realistic capacities, power specifications, sound rules, curfews, elevator constraints, load-in windows, setup and teardown requirements, rigging permissions, ceiling heights. Sourced, verified, confidence-rated.

**Moat B — Contract Intelligence:**
Timeline extraction from PDF contracts, vendor obligation detection, overtime trigger identification, meal requirement parsing, insurance clause surfacing, site restriction summarization. Extracted, reviewed, flagged for planner confirmation.

Together: **Event Feasibility Intelligence** — the ability to tell a planner, before booking, whether their vision is operationally achievable in a given venue.

---

## Article III — Core Principles

### III.1 Operational Truth Over Optimism

Atlas shows what is actually true, not what would be convenient to believe.

If a venue cannot realistically accommodate 850 guests in the proposed configuration, Atlas shows 612 — with the reasoning. The marketing capacity is shown alongside the realistic capacity, with source attribution.

Planners trust Atlas because it is honest. If Atlas ever softens a constraint to avoid uncomfortable information, it has broken the thing that makes it valuable.

### III.2 Source Everything

No data point exists in Atlas without provenance. Every venue constraint carries:
- `source_type` — how the data was obtained (measurement, venue document, sales claim, estimation)
- `source_reference` — the specific source
- `verified_by` — who verified it
- `verified_on` — when it was verified
- `confidence_score` — how confident the system is in the value
- `review_by` — when the value should be re-examined

**Unknown is better than incorrect.** If Atlas does not have data, it says so. It does not interpolate, assume, or fill gaps with plausible values without labeling them as estimates.

### III.3 Event-Scoped Access, Always

Every piece of data in Atlas is scoped to an event. Every user's access is scoped to the events they are a member of and the role they hold within those events.

A vendor sees their assigned tasks and their timeline slice. Nothing else.
A guest sees the itinerary and logistics for their segment. Nothing else.
A planner sees the full operational picture of their assigned events. Nothing else — not other planners' events.

There are no exceptions. There is no "administrator can see all events by default" in production (admin access is for development only and must be removed before any real client data is present).

### III.4 Planner Is the Operational Authority; Couple Is the Principal

**Amendment III.4.A** — the original framing ("Atlas tools are built for the planner's workflow first") is amended to reflect the expanded vision.

When a planner is present on an event, the planner is the operational authority. Their feasibility assessments and decisions govern execution.

When no planner is present (couple-operated event), the couple is the operational principal — and Atlas bears more of the intelligence load. The AI layer must be more proactive, more explanatory, and more anticipatory because the couple does not have professional experience to fill the gaps Atlas leaves.

**Both use cases are in scope. The interfaces are different by design.**

The planner interface is dense, keyboard-friendly, and professional. The couple interface is guided, visual, and generous with explanation. They share the same data model. They do not share the same UX paradigm.

### III.5 Reduce Decisions, Do Not Multiply Them

Atlas's job is to reduce the number of things its users have to think about, not add new things to think about.

Every feature, every alert, every data point should answer: "Does this help the user make one fewer decision, or make one better decision?" If it adds cognitive load without reducing operational risk, it should not be built.

For planners: dense dashboards that show the right information. For couples: progressive disclosure that surfaces exactly what they need at the moment they need it, not earlier.

### III.6 Two Interfaces, One Platform

Atlas serves professional and consumer audiences from the same data model and intelligence engine. The interfaces are distinct by design.

**Planner interface (Atlas Execute, Atlas Plan in planner mode):** Desktop-first, information-dense, keyboard-friendly. Looks like professional tooling — Social Tables meets Bloomberg. Built for someone who does this every day and needs efficiency above all.

**Couple interface (Atlas Discover, Atlas Plan in couple mode):** Mobile-capable, visually forward, progressive. Looks like premium editorial software — Airbnb meets Four Seasons digital. Built for someone who is doing this once, values beauty, and needs the platform to earn their trust through quality of guidance.

**Guest interface:** Lightweight, mobile-only, read-mostly. Itinerary + logistics + FAQ. Does not need to feel like Atlas — it just needs to be clear.

### III.7 Explainability Is Non-Negotiable

Atlas does not produce recommendations, risk flags, or capacity calculations without showing its work.

Every AI-generated recommendation includes:
- The constraint that triggered it
- The confidence level
- The source of the underlying data
- What to do about it

Planners need to defend their decisions to clients. Atlas gives them the reasoning to do so.

### III.8 Immutable Audit Trail

Every change to operational data — timeline updates, constraint overrides, vendor assignments, entitlement changes — is logged with:
- Who made it
- When
- What it changed from and to
- The role they held when they made it

This audit log is append-only. Nothing is deleted. This is the foundation of client and vendor trust.

### III.9 The Economic Thesis

Atlas does not make weddings cheaper. It reallocates spending from waste to value.

A couple who books the wrong venue discovers $8,000 in surprises — overtime charges, emergency rentals, restrictions nobody disclosed, a shuttle they did not anticipate. That money is gone. It cannot go to the live band, the extended photo coverage, the welcome party.

Atlas prevents that. When Atlas catches a curfew conflict before booking, when it flags a power limitation before the AV contract is signed, when it surfaces a room flip window that does not work before the timeline is locked — those savings belong to the couple. They get to spend intentionally instead of recovering reactively.

**This is Atlas's economic mission: reduce waste so every wedding dollar goes further.**

This thesis applies at scale. Planners who manage 25 weddings a year instead of 18 — because Atlas reduces the coordination overhead per event — have more economic output. Vendors who spend less time chasing information do more events. The industry becomes more efficient, not just one event at a time.

This is why Atlas matters. Not because it is AI. Not because it is beautiful software. Because when it works, people get better weddings for the same money.

---

## Article IV — Scope

### IV.1 What Atlas Builds Across Phases

**Phase 1 (Current — Operational Foundation):**
- Venue constraint database with trust metadata
- Venue Production Analyzer (constraint surfacing + risk detection)
- Fusion Flow Experience Architect (AI event arc + cultural moment sequencing)
- Role-based portal with 10 roles
- Event-scoped timeline with conflict detection
- Operational dispatch (planner → vendor, email/WhatsApp)
- Document intake (PDF → timeline extraction)

**Phase 2 (Next — Self-Service + Coordination Completeness):**
- **Production auth** — Real identity (Supabase Auth). Couples must be able to self-register. This is launch blocker #1.
- **Couple-initiated event creation** — couple creates → invites planner (optional) → planner joins or event runs self-service
- **AI venue matchmaker (public)** — couples discover venues via operational fit, not marketing content; three questions → five qualified matches
- Contract intelligence (full review queue, planner verification workflow — current intake is incomplete)
- Vendor coordination workspace (tasks, timeline slice, change propagation — current stubs → full workflow)
- Lightweight guest portal (itinerary + logistics + FAQ)
- Production observability and rate limiting

**Phase 3 (After Adoption Proven):**
- Venue Portal — venues manage and verify their own constraint data
- AI orchestration — proactive conflict prediction, feasibility scoring, operational recommendations
- Multi-planner firm support
- Expanded geographic coverage (when data quality can be maintained)
- Possible integrations: underwriting, insurance, permitting

### IV.2 What Atlas Does Not Build

These features are excluded and require a deliberate, documented decision to revisit:

| Category | Examples | Why |
|---|---|---|
| CRM | Email pipelines, contact databases, deal tracking | Competes with HoneyBook/Aisle Planner in their strong suits; not Atlas's moat |
| Generic project management | Kanban boards, reminders outside event scope | Asana/Notion handle this; not defensible |
| Guest social / website | RSVPs with social features, seating charts, wedding websites, registries, guest messaging | Low-moat, mass-competitor space |
| Open marketplace | Public venue listings with reviews, vendor discovery/reviews, open booking | Destroys trust model; moat is curated operational truth, not open marketplace |
| Standalone budget calculator | Full budgeting, invoice lifecycle, payment plans | Budget context within event planning is OK; a general budget tool is not Atlas |
| Consumer social features | Photo sharing, public event feeds, guest social networks | Not Atlas |

### IV.3 The Guest Portal Boundary

The guest portal is a communication surface, not a product surface. Its scope is:

**In scope:**
- Event itinerary (role-scoped timeline segments)
- Arrival logistics (parking, attire, timing, access instructions)
- Cultural context (ceremony primer, tradition explanations)
- FAQ (pre-answered questions by planner)
- Dietary/song/special request submission (one-way, planner-reviewed)

**Out of scope permanently:**
- RSVPs and guest list management
- Seating charts or table assignments
- Guest-to-guest communication
- Social features, photo sharing, social feeds
- Wedding website functionality

---

## Article V — Data

### V.1 The Venue Data Standard

Every field in the Atlas venue constraint profile must meet this standard:

```
source_type:        measured | venue_doc | sales_claim | estimated
source_reference:   specific URL, document, or interview reference
verified_by:        name/role of person who verified
verified_on:        date of verification
confidence_score:   0.0 – 1.0
review_by:          date when this data should be re-examined
```

No venue constraint may be shown to a planner without `source_type` and `confidence_score`. If these fields are missing, the field is flagged as "unverified — research needed," not hidden or silently shown.

### V.2 Confidence Display Rules

Atlas always shows confidence state alongside the data:

| Confidence | Display | Icon |
|---|---|---|
| 0.9–1.0 | Verified | Green checkmark |
| 0.7–0.89 | Likely accurate | Amber dot |
| 0.5–0.69 | Estimated | Amber triangle |
| < 0.5 | Unverified | Red flag |
| Missing | Research needed | Gray question mark |

These are non-negotiable. They cannot be hidden or soft-pedaled for visual cleanliness.

### V.3 AI Output Labeling

All AI-generated content (Fusion Flow event arc, Venue Analyzer recommendations, Concierge answers) is labeled as AI-generated. Atlas does not present AI outputs as if they were sourced from the venue data model — they are distinct, and users must know which is which.

AI recommendations that contradict sourced venue data defer to the sourced data.

---

## Article VI — Commercial Model

### VI.1 Two Modes

**REVEL-managed:** Events planned by REVEL Entertainment. Atlas access is included. No subscription. Plan = NULL. All features available.

**Independent:** Events by external planners who subscribe to Atlas directly. Three tiers:
- **Essential** — Venue constraint access, basic risk detection, up to N events/year
- **Pro** — Full venue intelligence, contract intake, vendor coordination, up to N events/year
- **Premium** — All features, unlimited events, priority data updates, white-label options

Specific tier limits (N) are set by commercial decision and tracked in `atlas_entitlement_templates`. They are not hardcoded into this Constitution.

### VI.2 Upsell Philosophy

Atlas surfaces operational gaps. Those gaps are upsell moments.

A planner sees that a venue has rigging restrictions and a client who wants a large chandelier. Atlas surfaces this as a risk. The resolution may involve REVEL's production team. That is a natural, honest upsell — not a dark pattern.

Atlas does not manufacture urgency. Atlas does not hide data to force an upsell. If the information is in the database, the planner sees it regardless of tier — tier limits apply to volume and features, not to critical safety information.

---

## Article VII — Decision Framework

When a new feature, copy change, or architectural decision is proposed, apply this framework in order:

**Test 1 — Identity Test**
> Does this make Atlas more like an operational feasibility platform, or more like something else (CRM, marketplace, consumer app, guest platform)?

If the answer is "something else," the feature requires a documented, deliberate exception before proceeding.

**Test 2 — Planner Test**
> Does this reduce the number of things a professional planner has to think about, or add to them?

If the answer is "add to them," the feature requires justification of why the burden is worth it.

**Test 3 — Trust Test**
> Does this make Atlas more honest and operationally accurate, or less?

If the answer is "less," the feature is rejected regardless of business case.

**Test 4 — Scope Test**
> Is this feature excluded from the current phase by Article IV?

If yes, it requires a documented phase extension decision.

**Test 5 — Honesty Test**
> Does claiming this feature or data in copy, UI, or sales material accurately represent what is built?

If no, the claim cannot be made until the feature is built.

---

## Article VIII — What Success Looks Like

### VIII.1 The Right Metric

Atlas succeeds when planners use it for a real event and avoid a problem they would not have caught otherwise.

The metric is: **"How many times did a planner avoid a day-of disaster because Atlas flagged it in advance?"**

Secondary metrics:
- Coordination message volume reduction (target: -30%)
- Timeline clarification calls reduction (target: -40%)
- Day-of escalations reduction (target: -25%)
- Planner time saved per event (target: +30 min)

### VIII.2 The Wrong Metric

Atlas does not optimize for:
- Number of features built
- Time spent in app (engagement hacking)
- User acquisition velocity (before product quality is proven)
- Testimonials that have not been earned
- Claims that outrun the build

### VIII.3 The Quality Bar

Even the first version of Atlas handed to a real planner must give them **one thing they could not have gotten anywhere else** — a specific constraint, a real risk, a flagged conflict — that saves them real time or prevents a real problem.

Generic is not acceptable. Honest and specific is the bar.

---

## Article IX — Non-Negotiables

These cannot be overridden by business pressure, timeline pressure, or any other pressure:

1. **No invented data.** If Atlas does not have a data point, it says "research needed." It does not interpolate.

2. **No coverage claims that outrun the data.** If the venue database covers Georgia, Atlas does not claim 55 cities or global coverage.

3. **No AI outputs without attribution.** Every AI-generated recommendation is labeled as such.

4. **No production access for demo users.** `PORTAL_ENABLE_DEMO_AUTH` must never be true on any environment where real client data exists.

5. **No data leakage across events.** Every query is event-scoped. A planner on Event A cannot see Event B data under any role.

6. **No testimonials that are not real.** The "Sushil Patel" placeholder is a placeholder. It cannot appear in production.

7. **No dark patterns.** Atlas does not hide constraints, manufacture urgency, or incentivize planners to ignore risks.

---

## Appendix A — Glossary

| Term | Definition |
|---|---|
| **Atlas** | The full platform (venue intelligence + coordination OS + role-based portal) |
| **Atlas Venue Intelligence** | The venue constraint data layer — sourced, verified, confidence-rated venue data |
| **Atlas Operations OS** | The coordination and execution layer — timelines, vendor tasks, change propagation |
| **Atlas Evaluations** | AI-detected risk assessments against the 4 core feasibility triggers |
| **Atlas Overrides** | Planner-applied manual status changes to evaluations (dismiss, accept, snooze) |
| **REVEL-managed event** | An event planned by REVEL Entertainment — Atlas access included |
| **Independent event** | An event by a subscriber planner — Atlas access by subscription |
| **Operational truth** | The actual physical and contractual constraints of a venue, as distinct from marketing claims |
| **Feasibility intelligence** | The combination of venue intelligence + contract intelligence that answers "will this event work?" |
| **Event scope** | The constraint that every data access is bounded to a specific event_id |
| **Trust metadata** | The provenance fields attached to every venue data point: source_type, source_reference, verified_by, verified_on, confidence_score, review_by |
| **Day-of window** | The time-bounded access period for delegate_coordinator and venue_coordinator roles |

---

## Appendix B — Decision Log

| Date | Decision | Rationale | Made by |
|---|---|---|---|
| 2026-05-21 | Atlas = operational intelligence layer, not CRM/marketplace | Focus on defensible moat | REVEL/ChatGPT |
| 2026-05-22 | Fusion Flow + Venue Analyzer as Phase 1 launch priorities | Highest-leverage lead wedge | REVEL |
| 2026-05-22 | Role/event access strict by default | Security + trust model | REVEL |
| 2026-05-22 | Non-core expansion deferred (guest networking, marketplace) | Phase discipline | REVEL |
| 2026-06-28 | "Global" / "55+ cities" copy removed pending data coverage | Honesty principle (Art. III.1) | Claude/Canon Review |
| 2026-06-28 | Auth integration is pre-launch blocker #1 | No real client can use demo auth | Claude/Canon Review |
| 2026-06-28 | **Atlas expanded from planner-primary to intelligence infrastructure for the full wedding ecosystem** | Couples planning their own weddings are an underserved, significant audience; venue intelligence is the moat, not the ceiling | REVEL/ChatGPT Five-Year Vision |
| 2026-06-28 | Couples are co-primary users alongside planners (Amendment I.2.A, I.3) | Self-planning couples are a validated user segment; Atlas must work for them without requiring a planner | REVEL/ChatGPT |
| 2026-06-28 | **Brand direction: black/champagne gold editorial (warm black + warm ivory alternating)** | Replaces navy/gold direction. Reference: Apple / Aman / Four Seasons / Linear / Bloomberg aesthetic. Navy/gold preserved as historical reference only. | REVEL/ChatGPT |
| 2026-06-28 | AI matchmaker (Atlas Discover) is the consumer front door in Phase 2 | Couples need a public entry point that is operationally qualified, not marketing-forward | Claude/Five-Year Vision |
| 2026-06-28 | Venue Portal (venues managing their own data) deferred to Phase 3 | Requires submission → review → publish workflow; cannot depend on venue participation for Phase 2 data quality | Claude/Five-Year Vision |
| 2026-06-28 | Five-year vision document establishes first-principles architecture — today's build evaluated against it, not the other way | Per REVEL instruction: preserve decisions only if they are still the best decisions | REVEL |

---

*This document is version-controlled. Changes require a new entry in Appendix B. Minor clarifications do not require an entry; additions to scope or reversals of prior decisions do.*
