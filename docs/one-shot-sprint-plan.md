# REVEL 90-Day Implementation Roadmap (Refined)

Last updated: 2026-05-21 (evening, post-ChatGPT strategic feedback)

## Objective

Ship Atlas as the operational intelligence layer for live events, starting with the venue + contract intelligence wedge, then vendor coordination, then lightweight guest experience.

NOT all-in-one; NOT generic planner CRM; NOT full guest portal.

## Strategic Focus

See [docs/strategic-focus.md](strategic-focus.md) for full context.

**TL;DR:** Atlas wins by staying focused on operational truth: venue intelligence, contract extraction, conflict detection, and trust-layer data. Everything else comes later or not at all.

## 90-Day Sequence

### Phase 1 (Weeks 1–2): Nail the Venue + Contract Wedge

**Objective:** Establish Atlas as the source of operational truth. This is the core defensible asset.

**Build:**
1. Venue intelligence data model
   - Capacity, constraints, feasibility data, production rules
   - Trust fields: source_type, source_link, verified_by, verified_on, confidence_score, review_date
   - Desktop-first UI for planner research and verification
   
2. Contract ingestion MVP
   - PDF parser + timeline extraction
   - Vendor obligations and timeline generation
   - Conflict detection: venue rules vs. vendor needs
   
3. Verification workflow
   - Mark fields as verified, in-progress, or research-needed
   - Audit trail for all changes
   - Planner review interface

**Done Criteria:**
- Venue schema supports source tracking and confidence scoring
- Contract PDF produces timeline without manual re-entry
- Conflict detection catches 80%+ of venue-vs-vendor rule violations
- Planner can see what is verified vs. provisional
- Desktop UI feels professional, not consumer

### Phase 2 (Weeks 3–4): Vendor Coordination (Lightweight, Operational)

**Objective:** Reduce vendor communication overhead. NOT a full CRM.

**Build:**
1. Role-based vendor views
   - Operational only (load-in, timeline, venue restrictions, requirements)
   - Event-scoped, not full vendor management
   
2. Operational runbooks
   - What each vendor needs to know (timeline, restrictions, logistics, site requirements)
   - Automatically populated from venue + contract data
   
3. Change logs
   - Vendors see when requirements change
   - Real-time push (not email, not polling)
   
4. Task status and assignments
   - Event-scoped tasks, not generic project management
   - Vendor confirms completion or flags blockers

**Done Criteria:**
- Vendor can operate from one event-scoped workspace
- Vendor sees timeline changes in real time
- Planner sees vendor status updates without email
- Venue restrictions are visible to all relevant vendors
- No email, messaging, file sharing, or CRM features

### Phase 3 (Weeks 5–6): Lightweight Guest Experience

**Objective:** Distribute operational clarity to guests; reduce planner communication burden.

**Build:**
1. Guest itinerary
   - Timeline, logistics, role clarity
   - Auto-generated from Atlas operational data
   
2. Logistics clarity
   - Parking, attire, timing, arrival recommendations
   - Cultural notes and expectations
   
3. Guest FAQs
   - Role-specific (guest, vendor, guest family, etc.)
   - Reduce planner response time

**Done Criteria:**
- Guest receives itinerary without asking planner
- Guest finds answers to common questions in FAQ
- Planner sees guest logistics view (no seating, RSVPs, messaging, weddings sites)
- Guest experience feels professional and clear, not engagement-heavy

**Explicitly NOT included:**
- RSVPs, seating, wedding websites, registries, guest messaging, social features

### Phase 4 (Weeks 7–12): AI Orchestration

**Objective:** Predict and prevent operational failures. Make Atlas indispensable.

**Build:**
1. Conflict prediction
   - AI flags missing constraints, vendor-venue misalignments
   - Explainable reasoning (why the flag)
   
2. Feasibility scoring
   - Event gets a production risk score
   - Correlates with actual execution success
   
3. Operational recommendations
   - "Add 30 min setup time due to X constraint"
   - "Timeline conflict: vendor load-in overlaps with X"
   - Timeline optimization suggestions
   
4. Production risk scoring
   - Underwriting signal for ops insurance
   - Vendor coordination complexity scoring

**Done Criteria:**
- AI flags catch 80%+ of actual planner concerns
- Feasibility score predicts 70%+ of execution issues
- Recommendations save planner 30+ minutes per event
- Pilot cohort shows measurable reduction in day-of escalations
- Risk scoring enables vendor or insurance integrations

## Efficiency KPIs (Track Monthly)

| Phase | KPI | Baseline | Target |
|-------|-----|----------|--------|
| 1–2 | Lead qualification time | TBD | Reduce 40% |
| 1–2 | Venue shortlist creation time | 2–3 hours | 15–30 min |
| 2 | Coordination message volume | TBD | Reduce 50% |
| 2–3 | Timeline clarification calls | TBD | Reduce 60% |
| 3 | Guest inquiry volume | TBD | Reduce 40% |
| 4 | Day-of escalation count | TBD | Reduce 50%+ |
| 4 | Planner time saved per event | Baseline | 1–2 hours |
| 4 | Feasibility prediction accuracy | Baseline | 70%+ |

## Critical Guardrails

**DO NOT expand into:**
- Full CRM, email, deal pipelines, contact databases
- Generic project management (Asana/Monday.com features)
- Full guest experience (RSVPs, seating, websites, registries, messaging)
- Vendor marketplace or venue marketplace
- Budget calculator (keep on public site; use shared engine only internally)

**DO stay focused on:**
- Operational intelligence: venue constraints, contract obligations, feasibility
- Conflict detection and resolution
- Trust-layer data (sourced, verified, reviewed)
- Vendor coordination for production truth
- Planner productivity and confidence

## Success Definition

Atlas succeeds when:
- Planners say: "I would not run an event without Atlas"
- Vendors say: "This reduces my back-and-forth by half"
- Day-of production says: "Fewer surprises, cleaner execution"
- REVEL can license Atlas to other planners and coordinators

That is the strategic bet.
