# Portal Production Operator Checklist

Last updated: 2026-05-22
Owner: REVEL operator

## Current Status

- Production portal is live at: https://portal-app-gray-sigma.vercel.app
- Membership demo login is working in production.
- `PORTAL_SESSION_SECRET` is set for Vercel Production and Development.
- Preview environment secret is not set because this Vercel project is not connected to a Git repository.

## Actions You Need To Do

1. Confirm the production URL to keep
- Option A: keep `portal-app-gray-sigma.vercel.app`.
- Option B: add a custom domain (recommended for client-facing use).

2. Connect Git repository to Vercel project (required for preview envs)
- In Vercel dashboard, open project `portal-app`.
- Go to Settings -> Git and connect the repository.
- This unlocks Preview deployments and branch-aware Preview env vars.

3. Add Preview secret after Git is connected
- In Vercel project Settings -> Environment Variables.
- Add `PORTAL_SESSION_SECRET` for `Preview` environment.
- Use the same value as Production, or rotate all environments together.

4. Rotate the session secret once after setup hardening
- Generate a new strong secret.
- Update `PORTAL_SESSION_SECRET` in Production/Preview/Development.
- Redeploy after rotation.

5. Decide identity provider for replacing mock login
- Choose one: Clerk, Auth0, Supabase Auth, or NextAuth with provider.
- Confirm choice so implementation can proceed against real membership data.

6. Provide database target for membership records
- Choose one: Supabase Postgres, Neon/Postgres, PlanetScale, or existing DB.
- Confirm connection method and hosting region.

## Fast Verification Steps

1. Open https://portal-app-gray-sigma.vercel.app/login
2. Use `maulin@revel-ent.com` + `REVEL-NOV-2026`
3. Confirm redirect to `/portal`
4. Confirm role nav links load: Couple, Planner, Vendor, Guest

## New: Outbound Notifications Activation (Email + WhatsApp)

1. Resend account setup
- Log in at https://resend.com/login
- Verify a sender identity/domain.
- Create an API key with send permissions.
- Record:
	- `RESEND_API_KEY`
	- `RESEND_FROM_EMAIL` (example: `ops@yourdomain.com`)

2. Twilio WhatsApp setup
- Log in at https://console.twilio.com/
- Activate WhatsApp sender (Sandbox or approved sender).
- Record:
	- `TWILIO_ACCOUNT_SID`
	- `TWILIO_AUTH_TOKEN`
	- `TWILIO_WHATSAPP_FROM` (example: `whatsapp:+14155238886`)

3. Add env vars in Vercel project `portal-app`
- Settings -> Environment Variables
- Add these for Production (and Preview/Development when ready):
	- `RESEND_API_KEY`
	- `RESEND_FROM_EMAIL`
	- `TWILIO_ACCOUNT_SID`
	- `TWILIO_AUTH_TOKEN`
	- `TWILIO_WHATSAPP_FROM`

4. Redeploy
- Trigger a production deploy after env var updates.

5. Verify in planner workspace
- Open `/portal/planner`
- Use "Operations Update Dispatch"
- Run "Preview Summary" first, then "Send Update"
- Confirm delivery status returns `sent` (not `simulated`)

## Recommended Next Technical Milestone

- Replace `mock-login` and `lib/mock-data.ts` with provider-backed auth + database memberships while keeping signed session claims and route guards.