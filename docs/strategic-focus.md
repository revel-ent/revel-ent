# REVEL Atlas Strategic Focus (Refined 2026-05-21)

## The North Star

**Atlas is the operational intelligence layer for live events.**

NOT:
- Another wedding app
- Another planner CRM
- Another guest platform
- Another marketplace

## The Moat

Atlas wins by staying focused on what's rare:

- Realistic venue capacities and constraints
- Production feasibility validation
- Vendor coordination intelligence
- Operational conflict detection
- Trust-layer data (sourced, verified, reviewed)

## The Three-Product Risk

Three separate products are trying to emerge simultaneously:

1. **Atlas Venue Intelligence** — KEEP SHARP
2. **Vendor Workspace / Operations OS** — YES, but lightweight
3. **Guest Portal / Client Experience** — DANGEROUS if expanded too early

If all three launch together, Atlas loses its wedge and competes on weak margin against overcrowded, low-moat competitors (Zola, The Knot, Joy, HoneyBook, Aisle Planner).

**Solution:** Strict sequencing. Build the wedge first; add coordination second; add lightweight guest experience third. No exception.

## The Winning Insight: Event Feasibility Intelligence

The real defensible asset is combining two datasets:

### A. Venue Operational Intelligence
- Load-in constraints and power realities
- Sound rules and curfews
- Realistic capacities and limitations
- Elevator constraints and access paths
- Setup windows and load-out timing

### B. Contract Intelligence
- Timeline and vendor obligations
- Overtime triggers and cost escalations
- Meal requirements and service rules
- Insurance clauses and liability limits
- Setup requirements and site restrictions

**Combined:** Event Feasibility Intelligence

This becomes much bigger than "planning software." It can eventually enable:
- Underwriting intelligence
- Venue certification and risk scoring
- Production risk scoring
- Vendor coordination automation
- Insurance integration
- AI-assisted production management

## What Planners Actually Value (Mirangi Signal)

From planner interviews, the strongest signals:

1. **Planners use laptops, not phones** → Desktop-first workflows, dense operational UI, professional tooling (not consumer UX)

2. **Social Tables is one of the few adopted tools** → Planners only adopt tools that directly reduce operational friction, solve real production tasks, and integrate into actual workflows. Not inspiration tools. Not AI magic. Not pretty dashboards.

3. **Budget tool value = education + filtering** → The real value was educating clients and filtering unrealistic leads, not just calculation. This suggests Atlas should focus on reducing operational waste, not merely adding features.

## Atlas Feature Roadmap: No Expansion Beyond Scope

### ✅ KEEP in Atlas

- Venue intelligence and constraint tracking
- Contract ingestion and timeline extraction
- Conflict detection and feasibility validation
- Role-based operational views (planner, decorator, vendor, admin)
- Event-scoped vendor access and coordination
- Lightweight guest itinerary and logistics
- Change logs and audit trails for operational truth

### ❌ DO NOT build in Atlas (at least Phase 1–2)

- Full CRM (email, deal pipelines, contact databases)
- Generic project management (Asana/Monday.com features)
- Full guest experience (RSVPs, seating, wedding websites, registries, invitations, guest messaging)
- Planner marketplace or vendor marketplace
- Vendor marketplace or review system
- Budget calculator (keep that on public site; use shared engine only)

## Planner Trust Layer

Atlas builds trust by being:
- **Desktop-first:** Dense, professional, keyboard-friendly
- **Operationally honest:** Shows constraints, feasibility gaps, real costs (not optimistic)
- **Data-sourced:** Every venue field includes source_type, source_link, verified_by, verified_on, confidence_score, review_date
- **Audit-logged:** Change logs show who changed what, when, and why
- **Vendor-coordinated:** Vendors see only what they need; changes propagate in real time

## 90-Day Roadmap

### Phase 1 (Weeks 1–2): Nail the Venue + Contract Wedge

**Objective:** Establish Atlas as the source of operational truth.

**Build:**
- Venue intelligence schema: capacity, constraints, feasibility data, trust fields
- Contract ingestion MVP: PDF parser → timeline extraction → conflict detection
- Verification workflow: mark fields as verified, reviewed, or research-needed
- Trust-layer architecture: source tracking, confidence scoring, review dates

**Success Criteria:**
- Venue data model supports source_type, verified_by, verified_on, confidence_score
- Contract PDF produces timeline and vendor obligations
- Conflict detection identifies venue-vs-vendor rule violations
- Planner can see what is verified vs. in-progress

### Phase 2 (Weeks 3–4): Vendor Coordination (Lightweight)

**Objective:** Reduce vendor communication overhead.

**Build:**
- Role-based vendor views (operational only, not CRM)
- Operational runbooks: what each vendor needs to know (load-in, rules, timeline, restrictions)
- Change logs: vendors see when requirements change (in real time)
- Task assignment and status (event-scoped, not project-management)

**Success Criteria:**
- Vendor can access event-scoped tasks and timeline
- Vendor sees venue restrictions and operational requirements
- Changes to timeline or requirements push to vendor view in real time
- Planner sees vendor status updates without email

**NOT included:**
- Email, messaging, file sharing, full CRM, deal pipelines

### Phase 3 (Weeks 5–6): Lightweight Guest Experience

**Objective:** Distribute operational clarity to guests; reduce planner communication burden.

**Build:**
- Itinerary distribution: timeline, logistics, roles
- Logistics clarity: parking, attire expectations, timing, arrival recommendations
- Cultural notes and attire guidance
- FAQs tailored to role (guest, vendor, planner)

**Success Criteria:**
- Guest can see itinerary and logistics without asking planner
- FAQ reduces planner response time
- No guest seating, RSVPs, messaging, or wedding website features

**NOT included:**
- RSVPs, seating, wedding websites, registries, guest messaging, social features

### Phase 4 (Weeks 7–12): AI Orchestration

**Objective:** Predict and prevent operational failures.

**Build:**
- Conflict prediction: AI flags missing constraints or vendor-venue misalignments
- Feasibility scoring: event gets an operational risk score
- Operational recommendations: "Add 30 min setup time due to X constraint"
- Timeline optimization: AI suggests optimal sequences based on venue + vendor constraints
- Production risk scoring: underwriting signal for ops insurance

**Success Criteria:**
- AI-flagged conflicts catch 80%+ of actual planner concerns
- Feasibility score correlates with actual execution success
- Recommendations save planner 30+ min per event
- Pilot cohort shows measurable reduction in day-of escalations

## Efficiency KPIs (Track Monthly)

### Phase 1–2
- Lead qualification time reduction
- Venue shortlist creation time (hours → minutes)
- Coordination message volume reduction
- Timeline clarification call reduction

### Phase 2–3
- Vendor communication overhead (emails/calls per vendor)
- Guest inquiry volume reduction
- Change propagation latency (hours → minutes)

### Phase 3–4
- Day-of escalation count reduction
- Production issue detection latency
- Planner time saved per event (hours)
- Feasibility prediction accuracy (% of flags that became real issues)

## Decision Guardrails

**IF it doesn't directly reduce operational friction or improve feasibility decisions: DO NOT build it in Atlas.**

**IF it competes with existing tools that planners already trust: DO NOT build it in Atlas.**

**IF it expands Atlas into a consumer product: DO NOT build it in Atlas.**

**IF it increases scope and delays the core wedge: DO NOT build it in Atlas.**

## The Strategic Bet

The next generation of wedding software will not ask users to input data; it will extract data from the documents they already possess and coordinate based on operational truth, not wishful planning.

Atlas wins by being the coordination layer that planners and vendors trust because it shows reality: constraints, conflicts, feasibility, and risk.

That is defensible. That is rare. That is where the enterprise value lives.
