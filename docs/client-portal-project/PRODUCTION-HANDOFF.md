# Production Handoff

Date: 2026-05-22
Owner: REVEL Product + Copilot

## What Is Live

- Client portal page with workflow-based entry and trust/readiness messaging.
- Distinct deep links for major modules and new high-leverage tools.
- CTA/module analytics tracking attributes and shared event helper in front-end JS.
- Partner brief and project governance docs in repo.

## What Is Implemented (Not Yet Deployed as Main Site)

- Authenticated Next.js portal scaffold at `portal-app/`.
- Middleware-based role route guards for `/portal/*`.
- Event-scoped access pattern via signed session token (`revel_session`) with role + event claims.
- Protected role routes: couple, planner, vendor, guest.
- Membership-based login flow using email + event access code (mock data registry).
- Functional AI route handlers for Fusion Flow and Venue Analyzer.
- Couple and Planner portal pages wired to live API-backed tool forms.
- Vendor coordination feed endpoint + UI panel wired for event-scoped updates.
- Guest concierge endpoint + UI panel wired for role-scoped Q&A.

## Live URL

- https://revel-ent.vercel.app/client-portal.html

## Source Files

- client-portal.html
- css/style.css
- js/main.js
- docs/partner-brief-client-portal-v1.md
- docs/client-portal-project/*

## Remaining Work for Full Platform Production

1. Replace mock auth with real identity provider and server-issued claims from persistent user/event membership.
2. Implement backend event membership checks and data partitioning.
3. Connect vendor coordination feed to persistent timeline/change log storage.
4. Add guest concierge privacy/consent controls and escalation workflows.
5. Wire KPI dashboard and reporting automation.

## Recommended Next Build Ticket

Implement event-scoped auth skeleton with role claims (couple, planner, vendor, guest) and hard route guards for workflow modules.
