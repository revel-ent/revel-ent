---
description: "Use when planning REVEL roadmap, AI feature integration, or portal architecture decisions."
applyTo: "**/*"
---

# REVEL Client Portal Roadmap Instructions

## Business Direction

- Optimize for client outcomes first: clarity, confidence, speed, and cost control.
- Treat efficiency as a core principle: each shipped feature should reduce time, rework, or cost for clients and internal teams.
- Support planners, vendors, and venues as connected collaborators, but keep couple-facing value explicit in messaging.
- Design every major feature to reduce planning friction and prevent day-of surprises.

## Product Principles

- Start with a composable architecture: marketing site and app features should evolve independently.
- Keep integrations API-first so chat, venue data, and budgeting tools can be reused across web, mobile, and CRM contexts.
- Build a trust layer for venue intelligence: source links, verified fields, confidence notes, and last-reviewed timestamps.
- Favor progressive enhancement: launch useful v1 workflows quickly, then add AI automation and orchestration in phases.
- Require an efficiency score for roadmap decisions: estimated minutes saved, number of manual touchpoints removed, and expected reduction in coordination back-and-forth.

## Feature Priorities

- AI concierge: intake, FAQ, routing, and lead qualification.
- Budget intelligence: allocation guidance by event type, guest count, and production goals.
- Venue fit engine: capacity, infrastructure, decor constraints, A/V feasibility, and risk flags.
- Coordination workspace: timeline, assignments, approvals, and real-time change tracking.

## UX Guidance

- Make recommendations explainable, not opaque. Show assumptions, constraints, and tradeoffs.
- Keep language warm, premium, and direct. Avoid technical jargon in client-facing interfaces.
- Surface "next best action" at each step so users always know what to do next.

## Technical Guidance

- Isolate integrations behind typed service layers; avoid vendor lock-in where possible.
- Add analytics events for every key planning action to train future AI recommendations.
- Prefer secure server-side handling for sensitive data and model/provider keys.
- Define clear boundaries between static brochure pages and authenticated portal experiences.
- Instrument workflow cycle times end-to-end so efficiency improvements can be measured per release.
