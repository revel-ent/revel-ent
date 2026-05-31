# Live Mode Demo Script (Client + Vendor + Guest)

Last updated: 2026-05-30
Owner: REVEL Product + Ops

## Demo Objective

Show that one event can support couple confidence, vendor clarity, and guest guidance from the same operational truth.

## Preconditions

- Portal app is running and login works.
- Use a test event code with seeded members.
- At least one account per role is available:
  - couple
  - vendor
  - guest
  - planner or delegate_coordinator

## 7-Minute Demo Flow

### 1) Couple Experience (2 minutes)

1. Log in as couple and open `/portal/couple`.
2. Show these blocks in order:
   - Fusion Flow planning tool
   - Event Timeline card
   - Live Mode card
3. Narrate value:
   - "You always know what is happening now, what is next, and who owns each moment."
4. Point to Expert Review upsell path in your verbal script:
   - "If any phase feels risky, we can route this to a human production review."

### 2) Vendor Experience (2 minutes)

1. Log in as vendor and open `/portal/vendor`.
2. Show:
   - Coordination feed updates
   - Timeline card filtered for active role visibility
   - Live Mode card with read-only alerts + contacts
3. Narrate value:
   - "Vendors do not chase text threads for timing changes; they see one source of truth."

### 3) Guest Experience (1.5 minutes)

1. Log in as guest and open `/portal/guest`.
2. Show:
   - Guest concierge Q&A
   - Timeline at-a-glance
   - Live cards for now/next and practical contacts
3. Narrate value:
   - "Guests get calm, practical guidance without exposing planner-grade controls."

### 4) Day-Of Control (1.5 minutes)

1. Log in as planner or delegate coordinator and open `/portal/live`.
2. Show NOW/NEXT/URGENT/CONTACT sections.
3. Submit a live update using "Mark Current Step Delayed".
4. Explain current behavior:
   - "The update endpoint is active with bounded permissions and returns a simulation payload in local mode."
   - "Next increment persists state to Supabase event timeline records."

## Talking Points for Sales/Partner Calls

- "This is built for real wedding operations, not generic project management."
- "Role boundaries are enforced, so family coordinators can help without access to billing/contracts."
- "Onboarding and Live Mode are designed for non-technical users in high-stress moments."
- "Every key action can be instrumented to measure time saved and escalation reduction."

## Known MVP Limits (Say Proactively)

- Live update endpoint currently runs in simulation mode unless persistence is wired.
- Pass the Baton invite token flow is not implemented yet.
- Supabase credentials + migrations are still required for production writes.

## Next Release Commitments

1. Persist live step updates to Supabase timelines.
2. Add Pass the Baton magic-link invite into scoped Live Mode.
3. Add event telemetry for "time-to-next-action" and escalation-rate tracking.
