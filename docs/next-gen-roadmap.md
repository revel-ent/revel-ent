# REVEL Next-Gen Roadmap

## Current State

- Public site is static HTML/CSS/JS and brand-forward.
- "Our Work" currently relies on Instagram embeds, which limits curation control and can look dated as posts age.
- AI tools already exist on Vercel (venue and budget-oriented workflows).

## Recommendation

Use a hybrid model:

1. Keep the current marketing site lightweight and premium.
2. Launch an app layer for portal features on a dedicated subdomain (for example app.revel-ent.com).
3. Integrate portal entry points from key pages (Home, Our Work, Contact, future Client Portal page).

## Core Principle: Efficiency First

- Every feature should clearly save time, reduce manual coordination, or prevent expensive mistakes.
- Prefer automation over additional dashboards when the task can be resolved in chat, text, or guided workflows.
- Require each roadmap item to include an efficiency hypothesis before development starts.

## Architecture Direction

- Marketing layer: static pages for speed and SEO.
- Application layer: authenticated portal with AI workflows.
- Shared API layer: venue data, budget engine, lead intake, recommendations.
- Data layer: venue database with trust metadata (source URL, verified date, confidence, owner).

### Implementation Stance (Phase 1)

- Use one unified Atlas app with role-based views for Planner, Decorator, and Admin.
- Do not split into separate products until usage data proves divergence.
- Keep shared services (budget, venue intelligence, timeline logic) centralized and reusable.

## Priority Feature Sequence

### Phase 1: Conversion and Discovery

- Replace old Instagram-heavy "Our Work" with curated case studies and media highlights.
- Add "Plan Your Wedding" call-to-action paths by user intent:
  - Estimate Budget
  - Check Venue Fit
  - Talk to REVEL AI Concierge

### Phase 2: Planning Intelligence

- Integrate budget calculator and venue fit tool into a unified planner flow.
- Save outputs to client profile and generate a summary PDF.
- Add recommendation cards: capacity risk, power risk, decor feasibility, and budget pressure points.

### Phase 3: Coordination and Execution

- Add client portal timeline and milestone tracker.
- Add vendor collaboration workspace with role-based access.
- Add day-of runbook mode (live cue sheet, timeline alerts, and issue logging).

### Phase 4: Vendor + Guest Network Effects

- Launch vendor-only workspace for assigned weddings with role-scoped access.
- Add venue nuance intelligence fields (policy constraints, logistics notes, confidence layer).
- Launch guest portal lite for itinerary, arrival guidance, and event FAQs.
- Use guest utility pages as soft, trust-based brand distribution.

## "Our Work" Refresh Blueprint

Replace feed-first layout with:

1. Hero with positioning statement and reel.
2. Signature case studies (3 to 6) with measurable outcomes.
3. Experience gallery by moment (Baraat, Ceremony, Cocktail, Reception, Afterparty).
4. Technology and production capabilities section.
5. Social proof strip (testimonials, partner logos, venue logos).
6. CTA stack into consultation + AI planning tools.

## Data and AI Guardrails

- Every recommendation must show assumptions and editable inputs.
- Mark confidence level and data freshness.
- Provide human override and escalation to REVEL team.
- Log interactions for continuous model improvement.

## Success Metrics

- Consultation conversion rate.
- Tool completion rate (budget + venue flows).
- Time to first qualified recommendation.
- Lead-to-booked ratio.
- Planning time and revision reductions.

## Efficiency KPIs

- Reduce average lead qualification time by at least 40%.
- Reduce average venue shortlist creation time by at least 60%.
- Reduce planning-related message back-and-forth per client by at least 30%.
- Reduce revision cycles for budget and production plans by at least 25%.
- Reduce internal coordination time per booked event by at least 20%.
