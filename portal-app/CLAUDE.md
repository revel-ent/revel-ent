# Atlas (portal-app) — working notes for Claude

## Visual design — READ BEFORE TOUCHING ANY LANDING / MARKETING UI

The **approved visual direction** for the public/marketing surface lives in
[`docs/ui-reference/README.md`](docs/ui-reference/README.md), with source mockups in
`docs/ui-reference/images/`.

- Landing-page look = **light cream + deep navy + brass gold**, elegant mixed-case
  **serif** headlines, photo-rich venue cards with match-% badges.
- This **replaces** the older dark-maroon / Oswald all-caps / henna-pattern styling for
  landing-facing pages. Do NOT default to maroon on new marketing UI.
- The authenticated portal (`/portal/*`) styling is separate; don't break it.

When in doubt about colors, type, or component shapes for the landing page, the
`ui-reference` README is the source of truth — not `globals.css` as it currently ships.

## Stack quick facts

- Next.js 16, build with `next build --webpack` (Turbopack breaks the Vercel build).
- Sessions: JWT in `revel_session` cookie (`jose`), signed with `PORTAL_SESSION_SECRET`.
- Data: Supabase via `getSupabaseAdminClient()` (service role, bypasses RLS, app-layer
  gated). Mock fallbacks in `lib/mock-data.ts`.
- AI: Gemini via `lib/gemini.ts`. `GEMINI_API_KEY` is **server-only** — never prefix it
  with `NEXT_PUBLIC_`, never paste the key into chat.
- Demo/staff auth gated by `isDemoAuthEnabled()` (needs `PORTAL_ENABLE_DEMO_AUTH=true`
  in production).
