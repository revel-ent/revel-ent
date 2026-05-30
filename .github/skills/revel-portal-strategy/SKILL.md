---
name: revel-portal-strategy
description: "Use when defining REVEL next-gen product strategy, AI wedding planning workflows, venue intelligence features, budget tooling, or phased implementation roadmaps."
---

# REVEL Portal Strategy Skill

## Purpose

Use this skill to turn broad product vision into a practical implementation plan for REVEL's client portal and AI-enabled planning ecosystem.

## Inputs to Gather

- Target user segment for this iteration (couple, planner, decorator, DJ/MC, venue, internal ops).
- Primary workflow to improve (discovery, budget, venue selection, timeline, day-of execution).
- Current tooling and data sources (site pages, forms, spreadsheets, existing Vercel apps, CRM).
- Launch constraints (budget, timeline, staffing, legal/compliance, integrations).

## Workflow

1. Define outcome
- Write one measurable user outcome and one business outcome.

2. Map friction
- Identify top 3 planning pain points in the selected workflow.
- Quantify cost of each pain point where possible (time, money, uncertainty, rework).

3. Design feature slice
- Propose the smallest shippable feature that directly resolves the highest-value friction.
- Include user story, acceptance criteria, and success metrics.

4. Specify AI role
- Clarify where AI is useful: recommendation, automation, summarization, validation, or orchestration.
- Specify guardrails: confidence threshold, human override, and transparency notes.

5. Define data contract
- List required fields, source of truth, freshness expectations, and verification owner.
- Add trust metadata fields if decision quality depends on venue or budget accuracy.

6. Plan integration
- Decide placement: static marketing page embed, standalone app route, or authenticated portal module.
- Define API boundaries and auth expectations.

7. Sequence rollout
- Break into Phase 1 (core), Phase 2 (assistive AI), Phase 3 (predictive/automation).
- Include dependencies and risks.

## Output Format

Return:
- Executive summary (5 to 8 bullets).
- Prioritized roadmap table: feature, user value, build effort, risk, phase.
- Integration architecture notes.
- Metrics plan (activation, engagement, conversion, retention, cost/time saved).
- Open questions blocking implementation.

## REVEL-Specific Priorities

- Keep client-facing messaging premium and direct.
- Favor South Asian and fusion wedding constraints as first-class planning parameters.
- Treat vendor coordination as a system problem, not just a checklist.
- Optimize for fewer surprises, faster decisions, and cleaner execution.
