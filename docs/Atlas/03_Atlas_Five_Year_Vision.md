# Atlas — Five-Year Vision
**Version:** 1.0  
**Status:** Strategic foundation — all product, design, and engineering decisions derive from this  
**Date:** June 28, 2026  
**Methodology:** Vision first, then first principles, then work backwards to today's build  
**Instruction:** Do not preserve today's decisions because they exist. Preserve them only if they are still the best decisions.

---

> The question this document answers is not "what should we build next?"  
> The question is: **"What company are we actually building?"**  
> Everything else — the Brand Bible, the Design System, the Landing Page, the Architecture — derives from the answer.

---

## Part 1 — Atlas in Five Years

Describe Atlas not as a roadmap. Describe it as a product that exists, in present tense.

---

### The Platform

It is 2031. Atlas is the intelligence infrastructure for the premium event industry.

A couple in Atlanta decides they want to plan their own 600-person South Asian wedding. They open Atlas. Without a planner, without a call, without a consultation, Atlas asks them three questions: What city? How many guests? What matters most? Within thirty seconds, Atlas shows them five venues that are operationally ready for their event — not five venues with impressive photo galleries, but five venues where the power specifications can handle their AV requirements, where the room flip between ceremony and reception is physically achievable, where the curfew does not cut their reception short, where the caterer kitchen specifications match their catering contractor's needs. Each venue comes with a confidence score, a source trail, and a plain-English explanation of what to watch for.

The couple books one. Atlas generates a preliminary timeline. It flags three potential conflicts before the first vendor call. The couple hires a planner — or they don't. Atlas works either way.

The planner who does join the event opens a dashboard that looks nothing like HoneyBook or Aisle Planner. It looks like a Bloomberg terminal designed by Aman. Every constraint sourced. Every vendor status visible. Every timeline conflict flagged. Every AI recommendation linked to the specific data point that triggered it. The planner has thirty weddings under management. Atlas is the only reason that is possible.

The DJ opens Atlas on his phone. He sees his load-in window, the parking situation, the power specs, the curfew, and a note from the planner. He does not send a single email. He has everything he needs.

The venue coordinator logs in. She sees the event timeline, the production requirements, the vendor roster, and two flags Atlas raised about the room's load-in elevator capacity against the production team's equipment. She adds a note. The planner sees it in real time.

The couple's families get a guest portal. The itinerary, the attire guidance, the ceremony primer, the parking map. Nobody asks the planner what time to arrive for the baraat.

At the end of the event, Atlas generates a post-event summary: what worked, what flagged correctly, what flagged incorrectly. The venue constraint profile updates. The AI gets better. The next event at this venue starts from a more accurate baseline.

---

### What Makes This Atlas and Not Something Else

The platform above could be described as "an event planning app." It is not. The difference is the intelligence layer underneath.

Every competitor shows venue marketing materials. Atlas shows operational truth.

Every competitor builds on assumptions (the couple enters their guest count and the tool assumes the venue can handle it). Atlas validates assumptions against sourced data (the couple enters their guest count and Atlas tells them which venues can actually handle it — and why).

Every competitor gives the planner a project management tool. Atlas gives the planner an operational intelligence layer — one that reduces the things they have to think about, not one that adds more places to click.

The defensible asset is the **Atlas Venue Intelligence Engine** — the database of sourced, verified, confidence-rated operational constraints for every venue in the network. This takes years to build and cannot be replicated by a competitor starting from scratch. It compounds. Every event adds data. Every correction improves accuracy. Every planner who uses it adds to the network effect.

---

### Who Atlas Serves in 2031

**Couples:**  
Atlas is their AI wedding strategist. It finds venues that match their operational requirements before they realize those requirements exist. It generates timelines. It catches conflicts. It answers questions at 11 PM when no planner is available. It makes the self-planning couple feel like they have a professional team — because the intelligence that used to live in a planner's head is now accessible to anyone.

**Professional planners:**  
Atlas is their operational command center. Not a CRM. Not a task manager. The operational truth layer that makes managing 30 weddings a year possible without sacrificing quality. The tool that lets them give clients a defensible answer backed by sourced data, not intuition. The tool that catches the conflict they would have missed at 3 AM.

**Vendors:**  
Atlas is their single source of truth for every event they work. What they need to bring. Where they set up. What the restrictions are. When they arrive. What changed since last week. Zero emails to the planner asking questions that should already be answered.

**Venues:**  
Atlas is their operational intelligence dashboard and their marketing engine simultaneously. They manage and verify their own constraint data — and in doing so, they appear in Atlas matchmaking with higher confidence scores and more bookings. The venues that keep their Atlas profiles accurate get more leads from couples who find Atlas first.

**The broader ecosystem:**  
Eventually — not in five years, but visible from five years — Atlas becomes the data layer that underwriters, insurers, event production companies, and municipal permitting systems can query. The operational truth that Atlas accumulates about events and venues has value far beyond the planning workflow.

---

### The Economic Thesis

Atlas does not make weddings cheaper. It reallocates spending from waste to value.

Without Atlas:
- A couple books the wrong venue and discovers $8,000 in surprises (overtime, emergency rentals, restrictions they weren't told about, a shuttle they didn't anticipate).
- A planner spends 3 hours on calls clarifying vendor requirements that should already be documented.
- A DJ arrives to find the circuit breaker cannot power his setup.
- A family spends the cocktail hour confused about where to go.

With Atlas, those dollars and hours flow to the experiences the couple actually wanted: better photography, a live band instead of a DJ, extended reception coverage, a welcome party, a farewell brunch.

Atlas improves allocative efficiency in the wedding ecosystem. Money that would have been lost to poor information now flows to vendors who create genuine value. Every planner who manages more weddings has more economic output. Every couple who avoids a planning mistake spends more intentionally.

The mission is: **help every participant in a wedding make better decisions, faster, so they can spend less on avoidable mistakes and more on unforgettable moments.**

---

## Part 2 — The Core Primitives

Work backwards from the five-year picture. What are the irreducible atoms that everything else is built from?

These are not database tables. They are the concepts that must be true regardless of how the technology evolves.

---

### Primitive 1 — The Venue Record

**What it is:** The operational truth about a physical space. Not a listing. Not a marketing profile. A verified, sourced, confidence-rated collection of constraints, specifications, and capabilities.

**Why it is foundational:** Every other Atlas feature — matchmaking, timeline generation, conflict detection, risk assessment, vendor coordination — depends on accurate venue data. Without the Venue Record, Atlas is a task manager. With it, Atlas is an intelligence platform.

**What it must contain:**  
- Physical specifications (dimensions, ceiling height, load capacity)  
- Power specifications (total amperage, circuit distribution, dedicated circuits)  
- Sound envelope (permitted decibel levels, curfews, exterior noise restrictions)  
- Access constraints (elevator capacity, loading dock dimensions, parking, truck access)  
- Capacity reality (marketed capacity, realistic capacity by configuration and event type)  
- Timeline constraints (setup window, room flip minimum, load-out window, exterior access times)  
- Policy constraints (approved vendor lists, catering exclusivity, rigging permissions, decor restrictions)  
- Outdoor conditions (power access, weather contingency options, permit requirements)  
- Trust metadata on every field (source, confidence, verified by, verified on, review date)

**What it must never contain:** Marketing claims presented as verified data. Venue-self-reported numbers without a confidence flag. Aesthetic descriptions (the venue's website already has those).

**Who owns it:** Atlas owns the operational data, with venues able to flag corrections and updates through the Venue Portal. Atlas verifies before publishing updated values. Venues do not self-publish to live — they submit, Atlas reviews.

---

### Primitive 2 — The Event Profile

**What it is:** The specific requirements of a specific event — date, location, guest count, cultural elements, timeline requirements, vendor roster, budget parameters, and any constraints brought by the couple.

**Why it is foundational:** The Venue Record tells you what a space can do. The Event Profile tells you what a specific event needs. Feasibility is the intersection of these two.

**What it must contain:**  
- Event type and cultural context (Indian wedding, fusion, ceremony-only, multi-day)  
- Date and duration  
- Guest count (total, by segment if multi-day)  
- Timeline requirements (ceremony duration, reception duration, room flip needed, outdoor segments)  
- Vendor requirements (AV load, kitchen requirements, rigging needs, production complexity)  
- Couple/planner preferences and non-negotiables  

**Critical design note:** The Event Profile should be built progressively — Atlas should be able to do useful things with minimal input and add intelligence as the profile deepens. The first useful output (venue matches) should require no more than 3 answers.

---

### Primitive 3 — Feasibility Assessment

**What it is:** The intersection of a Venue Record and an Event Profile. The answer to: "Will this event work in this space?"

**Why it is foundational:** This is the core value proposition. Not matchmaking (many apps do that). Not venue listings (every app does that). The Feasibility Assessment — backed by sourced data — is what Atlas uniquely offers.

**What it must produce:**  
- A feasibility determination per trigger (capacity, power, sound, timeline, rigging, access)  
- A confidence level per determination  
- The specific data points that drove the determination  
- What to investigate further if confidence is low  
- What is operationally non-negotiable vs. negotiable  

**What it must never do:** Produce a feasibility determination without showing its work. "This venue is a good match" is useless. "This venue is a strong match for your event, but note: the circuit specification is estimated (not measured) and your production team should verify before finalizing the AV contract" — that is Atlas.

---

### Primitive 4 — The Role

**What it is:** A person's relationship to an event — what they need to know, what they are authorized to do, and what they should not see.

**Why it is foundational:** Atlas serves seven distinct audiences (couple, planner, coordinator, vendor, venue, DJ, guest). Each has different information needs, different operational authorities, and different cognitive loads. One interface for all roles would serve none of them well.

**The roles and their operational authorities:**  
| Role | Authority | Information Access |
|---|---|---|
| Couple | Client — approves and directs | Full event picture, curated for clarity |
| Planner | Operational authority — owns execution | Everything |
| Delegate Coordinator | Execution within planner-delegated scope | Bounded timeline scope, no financials |
| Vendor | Task executor within their scope | Their tasks, their timeline slice, venue requirements for their work |
| Venue Coordinator | Venue compliance guardian | Venue-relevant timeline, operational requirements, restrictions |
| DJ/MC | Entertainment director | Music profile, timeline, sound rules, changeover |
| Guest | Audience member | Itinerary for their segments, logistics, FAQ |

**Design implication:** The couple's experience and the planner's experience must be built as separate design systems that share data — not one system where some features are hidden. A couple who opens Atlas should feel like they are using a different product than a planner — because they have fundamentally different operational relationships to the event.

---

### Primitive 5 — The Timeline

**What it is:** The chronological execution plan for an event, with conflict detection, owner assignment, change propagation, and audit trail.

**Why it is foundational:** A wedding is a time-constrained sequence of interdependent events. One conflict in the timeline — a room flip window that is 15 minutes short, a vendor load-in that overlaps with a ceremony, a cocktail hour that is cut by a venue curfew — can cascade into a series of day-of problems.

**What it must do:**  
- Detect conflicts automatically (overlaps, insufficient buffers, curfew violations, setup window violations)  
- Propagate changes in real time to all role-specific views  
- Maintain an immutable audit trail (who changed what, when, from what to what)  
- Support delegation (planner can grant a coordinator permission to update specific items)  
- Support multi-day events with segmented phases  

**What it must never do:** Hide conflicts for visual cleanliness. A timeline view that looks clean because conflicts are suppressed is more dangerous than a timeline view that looks messy because all conflicts are visible.

---

### Primitive 6 — The Document

**What it is:** Any external artifact — contract, permit, vendor invoice, floor plan, insurance certificate, venue packet — that contains operational obligations relevant to the event.

**Why it is foundational:** Most of what Atlas needs to know is already written down. It is in venue contracts, vendor contracts, catering agreements, and permit applications. The intelligence is locked in PDFs that nobody has time to read carefully. Contract Intelligence — extracting obligations from documents and surfacing them in the right context — is the second moat.

**What it must produce from a contract:**  
- Timeline obligations (setup windows, load-in times, teardown deadlines)  
- Cost escalation triggers (overtime clauses, minimum spend requirements)  
- Vendor restrictions (approved vendor lists, exclusivity clauses)  
- Policy constraints (what is and is not permitted)  
- Missing information flags (what the contract mentions but does not specify)  

**What it must never do:** Present extracted information as verified operational truth. Contract intelligence is extracted information — it has its own confidence tier (source_type: "contract_extract"), and planners confirm before it enters the Venue Record.

---

### Primitive 7 — The Intelligence Layer

**What it is:** The AI synthesis system that takes Venue Records, Event Profiles, Timelines, and Documents and produces recommendations, matchmaking results, risk flags, and operational guidance.

**Why it is foundational:** The data primitives above are only valuable if someone can act on them. The Intelligence Layer is what turns data into decisions.

**What it must do:**  
- Match venues to event profiles with operational confidence scores  
- Generate preliminary timelines from event parameters  
- Surface risk flags before planners ask for them  
- Answer role-specific questions using event context  
- Explain every output — not just "this venue is a match" but why  

**What it must never do:**  
- Invent data to fill gaps  
- Produce recommendations without confidence levels  
- Substitute AI synthesis for sourced venue data on operational-critical questions  
- Present AI output as if it were equivalent to verified data in the Venue Record  

The Intelligence Layer is the layer where the "unknown is better than incorrect" principle is most critical. AI that confidently hallucinates a venue's curfew is worse than AI that says "I don't have verified curfew data for this venue."

---

## Part 3 — The Permanent Data Model

The data model that supports the five-year vision must accommodate:
1. Venue Records with deep provenance metadata
2. Event Profiles for both couple-operated and planner-operated events
3. Role-scoped access with event-isolation
4. Document intelligence with its own confidence tier
5. AI output storage with source tracing
6. The Venue Portal (venues submitting corrections)
7. The commercial model (REVEL-managed vs. independent subscribers)

### What Today's Data Model Gets Right

- **Event-scoped multi-tenancy** — every record includes `event_id`. This is correct and must be preserved.
- **Role-based access with memberships table** — the membership model (user, event, role) is the right primitive. Keep it.
- **Trust metadata on venue constraints** — the `source_type`, `confidence_score`, `verified_by`, `verified_on` fields on `venue_constraints` are exactly right. Extend this pattern, never remove it.
- **Immutable audit trail** — `atlas_entitlement_audit` and override logging are the right foundation for operational trust. Extend this pattern everywhere.
- **Commercial state as a first-class model** — `atlas_event_mode`, `atlas_workspace_plan`, entitlement snapshots. This is correctly separated from the operational model.

### What Today's Data Model Must Evolve

**1. Venue Record as a first-class domain object**  
Today, venues are stored across three tables (`venues`, `venue_constraints`, `atlas_evaluations`). The Venue Record primitive implies a more unified representation — a single queryable object that returns the full operational profile with trust metadata, evaluations, and verification history. This is an API design evolution, not necessarily a schema overhaul.

**2. Couple-operated Event Profile**  
Today, every event is created by an admin or planner and couples are added as members. The five-year vision requires couples to be the primary initiator for self-service events. The data model must support: couple creates event → invites planner (optional) → planner accepts → roles adjust. This inversion of the current flow has schema implications for `created_by` and `atlas_workspace_owner_role`.

**3. Document as a first-class entity**  
Today, intake documents are file attachments with extracted fields stored in JSON. The five-year vision treats Documents as first-class operational objects with their own lifecycle: ingested → extracted → reviewed → confirmed. This requires a `documents` table with extraction status, review state, and linking to the specific constraints and timeline items they informed.

**4. Venue Portal submissions**  
Today, venue data is Atlas-managed only. The five-year vision requires a submission queue: venues submit corrections → Atlas reviews → corrections published or rejected with note. This requires a `venue_submissions` table with status, reviewer, and audit trail.

**5. AI output provenance**  
Today, Gemini outputs are used directly without persistent storage of the model version, prompt version, and confidence. Every AI output that enters the operational record (a risk flag, a timeline item, a constraint) needs to carry: `generated_by: "atlas-ai-v{n}"`, `prompt_version`, `model`, `confidence`. This enables retroactive audit if a model produces bad outputs.

---

## Part 4 — The Product Architecture

Not today's implementation. The right architecture for the five-year vision.

### The Five Surfaces

**1. Atlas Discover**  
The public entry point. AI-powered venue matchmaking. Search by event requirements, not by venue name. Show operational fit, not just marketing inventory. The front door for couples who do not yet have a planner and for planners scouting new venues.

*Key experience:* Three questions → five operationally-qualified venue matches → each with confidence score, key constraints, and what to verify.

**2. Atlas Plan**  
The event workspace. Couple-operated or planner-operated. Timeline generation, vendor roster, cultural moment sequencing, document intake, budget parameter tracking. Progressive disclosure — useful with minimal input, smarter as the profile deepens.

*Key experience:* Start with a venue and a guest count. Get a preliminary timeline with flagged risks. Add vendors. See risks reduce. Add contracts. See conflicts surface and resolve.

**3. Atlas Execute**  
The operational command center. Planner-primary. Vendor coordination, live mode, change propagation, day-of escalation. The phase where operational discipline matters most and information access must be role-scoped and real-time.

*Key experience:* Planner sees the full picture. Vendor sees their slice. Guest sees their segment. Changes propagate in seconds, not hours.

**4. Atlas Venue**  
The venue management portal. Venues manage, verify, and keep current their operational profiles. Not a marketing tool — a data management interface. Venues that keep their Atlas profiles accurate appear with higher confidence scores and more prominent matchmaking placement.

*Key experience:* Venue coordinator logs in, sees their operational profile as Atlas presents it to planners, flags anything incorrect, submits corrections. Atlas reviews. Confidence scores reflect verification history.

**5. Atlas Intelligence**  
Not a user-facing surface. The engine that powers the other four surfaces. Venue constraint processing, event feasibility scoring, AI synthesis, document extraction, risk detection. The Atlas Intelligence layer is the competitive moat made operational.

### The Architecture Principle

**Each surface has one primary audience with a distinct information relationship to events.**

- Discover: prospective planners and couples before event creation
- Plan: event creators (couple or planner) during planning
- Execute: operational team during execution
- Venue: venue management during their venue's events
- Intelligence: internal — feeds all other surfaces

No surface tries to serve all audiences. No surface conflates planning with execution. No surface conflates venue management with event management.

---

## Part 5 — Design Philosophy (Derived from the Vision)

Not yet a Design Bible. The principles that the Design Bible must encode.

### Two Visual Registers

**The intelligence register (warm black):**  
Used for data-dense, operational-critical surfaces. The planner dashboard. Risk detection. Timeline conflict view. Venue constraint profiles. The analogy is Bloomberg meets Aman — authoritative, precise, premium. Dark background makes data legible; gold accents signal importance; neutral type maintains hierarchy.

**The editorial register (warm ivory):**  
Used for discovery-oriented, beauty-driven surfaces. Venue matchmaking results. Cultural moment planning. The couple's event workspace. The guest portal. The analogy is Four Seasons meets a premium editorial magazine — photography-forward, generous whitespace, serif headlines that communicate considered craftsmanship.

**The alternating rhythm:**  
The marketing site and the couple-facing flows alternate between these two registers. Warm black sections surface the intelligence platform (risk detection, constraint analysis, operational confidence). Warm ivory sections surface the beauty and craft of what Atlas enables (venue photography, cultural ceremony moments, the event as an experience, not just a logistics problem).

The previous navy/gold direction was aesthetically considered but belongs to a different positioning: a SaaS dashboard for a professional tool. The five-year Atlas is both a professional tool and a consumer discovery platform. Its visual language must work for both.

### The Dual Interface Reality

The planner interface and the couple interface are genuinely different design systems that share data. Not one system with features hidden.

- **Planner interface:** Desktop-first, information-dense, keyboard-friendly, professional tooling. The user is trying to manage an event, not admire the UI.
- **Couple interface:** Mobile-first, progressive disclosure, visual-forward, emotionally intelligent. The user is imagining the most important day of their life.

Building these as the same interface with permission gates is the wrong approach. Building them as two experiences backed by the same data model is the right approach.

### The AI Experience Principle

AI in Atlas is always visible, always attributed, and always deferential to sourced data.

- AI recommendation: labeled "Atlas Intelligence"
- Source-verified constraint: labeled with source and confidence
- When they conflict: the source-verified constraint prevails and the AI recommendation is qualified

AI that is confident and wrong is more dangerous than AI that is honest about uncertainty. Atlas's credibility with professional planners depends on never having this moment: "Atlas told me the curfew was 11 PM but it was 10 PM and we lost the last hour of reception."

---

## Part 6 — What Today's Build Gets Right (Preserve)

- Event-scoped multi-tenancy — never remove this
- Role-based access with memberships — the right primitive, extend it
- Trust metadata on venue constraints — the competitive moat, double down
- Timeline conflict detection — extend, never deprecate
- Gemini AI integration with attribution — right approach, extend to all AI outputs
- Commercial model isolation — the right separation, keep
- Immutable audit trail on entitlement changes — extend to all operational changes
- Fusion Flow and Venue Analyzer — both are live, both are valuable, both should be the "signature Atlas moment" in the onboarding experience

---

## Part 7 — What Today's Build Must Evolve (Challenge)

1. **Auth system** — Demo auth must become production identity. Target: Supabase Auth with email/password and Google OAuth. Couples must be able to self-register. This is launch blocker #1 and the single most critical pre-production item.

2. **Couple as primary event creator** — Today, events are planner-or-admin-initiated. The five-year vision requires couples to be primary initiators. The event creation flow must be redesigned for couples who may or may not invite a planner.

3. **Venue discovery as the front door** — Today, the landing page is primarily a marketing site with conversion tools. In the five-year vision, the front door is Atlas Discover — the AI matchmaker. The marketing site and the product entry point should converge.

4. **Contract Intelligence as a complete workflow** — Document intake exists but the planner review → confirmation → venue record update loop is incomplete. This is the second moat and must ship as a complete workflow, not a partial feature.

5. **Venue Portal** — Venues must be able to manage and verify their own data. Currently, Atlas is the sole data curator. That does not scale. The submission → review → publish workflow must be built.

6. **Vendor invite flow for self-service** — Today, vendor access requires admin setup. The five-year vision requires planners to invite vendors directly from within the platform, with vendors self-onboarding into their scoped workspace.

7. **Static HTML pages** — 14 static pages still carry the old design system. These must migrate to Next.js as Atlas Discover becomes the front door.

---

## Part 8 — The Updated Mission

**Old (correct but incomplete):**  
> Atlas is the operational intelligence layer for live events.

**New (expanded and correct):**  
> Atlas is the intelligence infrastructure for the wedding industry — helping couples, planners, vendors, and venues make better decisions, faster, so every wedding dollar goes toward unforgettable moments instead of avoidable mistakes.

**The one-sentence version:**  
> Atlas turns operational uncertainty into confidence.

**The tagline candidate:**  
> Every wedding, better informed.

---

## Appendix — Five-Year Benchmarks

Atlas has succeeded in five years if:

- A self-planning couple can find, qualify, and shortlist three venues without a planner's help, in under 10 minutes, and the recommendations are operationally correct (not just aesthetically relevant).
- A planner managing 25+ weddings per year cites Atlas as the reason that is possible.
- A venue coordinator has corrected an Atlas constraint profile and seen the correction reflected in planner recommendations within 48 hours.
- An event has run without day-of escalations caused by a constraint that Atlas had in its database and did not surface.
- The Atlas venue constraint database has been cited as a source of truth by a journalist, underwriter, or industry association.

---

*This document sets the direction. The Constitution will be updated to reflect the expanded mission. The Brand Bible, Design System, and all implementation work derives from this vision — not from today's MVP.*
