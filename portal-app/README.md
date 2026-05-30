# REVEL Portal App (Scaffold)

This folder contains the authenticated app scaffold for event-scoped, role-based workflows.

## Product Direction (US Scale)

REVEL is not generic SaaS. This portal is a premium wedding operations + revenue engine.

- Primary value: fewer planning surprises, faster decisions, cleaner day-of execution.
- Revenue value: in-workflow upsell recommendations (lighting, production, sound, timeline upgrades).
- Growth value: elite planner/vendor experience that drives referrals and repeat use.
- Operating constraint: founder-led, lean engineering footprint, low-infra overhead.

Platform decisions should favor managed services, serverless execution, and production reliability over custom infra complexity.

## Existing Strategic Asset: Venue Atlas

REVEL already has a live venue intelligence product:

- URL: https://atlas-capacity-engine.vercel.app/
- Coverage: ~55 popular Georgia wedding venues
- Input quality: planner-informed and decorator-informed constraints

Treat Venue Atlas as a core moat and integration target, not a side project to be rebuilt.

Any architecture recommendation should explicitly evaluate:

- standalone integration vs shared backend,
- API exposure strategy,
- shared schema for event workflows,
- SEO leverage from venue-specific content,
- and venue-driven upsell opportunities.

## Why this exists

- Keep the current marketing site (`revel-ent`) stable.
- Build protected portal features in parallel without breaking live pages.
- Prepare production architecture for Couple / Planner / Vendor / Guest access.

## Included

- Next.js App Router + TypeScript setup
- Membership-based login endpoint for local role testing
- Signed session token model (`revel_session`) using `jose`
- Role and route guard model via middleware
- Event-scoped claim gate via signed session payload
- Functional AI endpoints:
  - `POST /api/ai/fusion-flow`
  - `POST /api/ai/venue-analyzer`
- Functional ops endpoint:
  - `POST /api/ops/dispatch-updates` (preview, export, email/WhatsApp dispatch)
- Protected routes:
  - `/portal`
  - `/portal/couple`
  - `/portal/planner`
  - `/portal/vendor`
  - `/portal/guest`

## Domain Reality To Design For

- Multi-day South Asian and fusion events (haldi, mehndi, sangeet, baraat, ceremony, reception).
- High guest counts and parallel timeline coordination.
- Mobile-first usage at venues with inconsistent Wi-Fi.
- Premium expectations for both clarity and responsiveness.

Any feature proposal should explicitly state:

- minutes saved,
- manual touchpoints removed,
- and premium upsell opportunity impact.

## Local run

1. `cd portal-app`
2. Copy `.env.example` to `.env.local` and set `PORTAL_SESSION_SECRET`
3. `npm install`
4. `npm run dev`
5. Open `http://localhost:3000`

## Demo Accounts

- Admin: `jigar@revel-ent.com` + `REVEL-NOV-2026`
- Planner: `maulin@revel-ent.com` + `REVEL-NOV-2026`
- Couple: `jayati@example.com` + `REVEL-NOV-2026`
- Vendor: `heckno@revel-ent.com` + `REVEL-NOV-2026`
- Guest: `guestfamily@example.com` + `REVEL-NOV-2026`
- Delegate Coordinator: `priya@example.com` + `REVEL-NOV-2026`

## Concierge Onboarding (V1)

- Screen 1: `/portal/onboarding`
  - Venue selection
  - Guest count
  - Atlas-backed capacity check
- Screen 2: `/portal/onboarding/timeline`
  - Zero Blank Canvas itinerary generation
  - "Approve & Enter Portal" action
  - Saves event + timeline rows when Supabase is configured

If Supabase env vars are missing, approval runs in simulation mode and returns a non-persistent success response.

## Role Module Status

- Couple: Fusion Flow tool wired to live API
- Planner: Venue Analyzer tool wired to live API
- Planner: Operations Dispatch tool (summary preview/export + outbound channel dispatch)
- Vendor: Coordination feed panel wired to live API
- Guest: Concierge Q&A tool wired to live API

## Replace before production

- Membership lookup with real identity provider.
- Server-issued role/event claims from persistent database membership.
- Add database-backed event membership checks.
- Add audit logging and consent/privacy controls.

## Supabase Setup (Foundational)

1. Create a Supabase project.
2. Run SQL migration file: `portal-app/supabase/001_revel_foundation.sql`.
3. Add env vars in `.env.local`:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
4. Restart app and run onboarding flow.

Expected behavior:

- With env configured: onboarding approval inserts into `events` and `timelines`.
- Without env configured: onboarding approval remains functional in simulation mode.

## Scale Readiness Priorities (Next)

- Managed auth + event-scoped RBAC/ABAC policy.
- Persistent multi-tenant data model for events, members, vendors, guests, timeline, and trust metadata.
- API protection (schema validation, rate limits, abuse controls).
- Queue-backed async workflows for heavy analysis and outbound dispatch.
- Observability baseline (structured logs, tracing, SLO alerts).

See architecture review brief: `docs/client-portal-project/US-SCALE-ARCH-REVIEW.md`.

## Outbound Notifications

The planner workspace includes an Operations Update Dispatch tool.

- Generates an event summary from the coordination feed.
- Supports preview mode (`dryRun`) before dispatch.
- Supports export to `.txt` for external channels.
- Sends through configured providers:
  - Email via Resend (`RESEND_API_KEY`, `RESEND_FROM_EMAIL`)
  - WhatsApp via Twilio (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM`)
- If provider keys are missing, the API returns simulated results so workflows are still testable.
