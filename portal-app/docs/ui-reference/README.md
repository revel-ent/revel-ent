# Atlas UI Reference (Source of Truth for Visual Design)

This folder holds the **approved visual direction** for the Atlas public/marketing
surface. When building or restyling any landing-page-facing UI, match THIS — not
the older dark-maroon Indian-motif styling that currently ships in `globals.css`.

> **Approved by the client (Jigar / Revel) — June 2026.** Two ChatGPT mockups were
> shared and explicitly liked. Drop the source images in `./images/` (see below).

## How to use this folder

1. Client drops the reference mockups (PNG/JPG) into `./images/`.
   Suggested names: `landing-mockup-a.png`, `landing-mockup-b.png`.
2. Before touching any marketing/landing UI, read this README.
3. Treat the **text spec below** as the canonical design tokens — it's cheaper and
   more precise for me to read than re-parsing the images each session.

---

## The aesthetic in one line

Premium, calm, editorial "intelligence layer" product — **light cream + deep navy
+ brass gold**, elegant mixed-case serif headlines, generous whitespace, photo-rich
venue cards with match-percentage badges. Think refined fintech/AI SaaS, NOT ornate
wedding maximalism.

**This REPLACES, for the landing page, the dark maroon (#2f0f14) + Oswald all-caps +
henna-pattern background that currently ships.**

## Color system

| Token | Hex (approx) | Use |
|---|---|---|
| Paper / cream bg | `#F6F3EC` | Default light section background |
| Paper soft | `#FBF9F4` | Cards / raised surfaces on cream |
| Navy (ink + dark bg) | `#0E1430` | Hero background, footer, primary buttons, headline text on light |
| Navy soft | `#1A2348` | Secondary navy surfaces, product-card panels |
| Brass gold (accent) | `#C6A35A` | Accent highlights, gold CTA fill, line icons, logo mark |
| Body text on light | `#5A6072` | Paragraph copy on cream |
| Text on navy | `#E8EAF0` | Copy on navy, with `rgba(255,255,255,.6–.7)` for muted |
| Success / "Good Fit" / match badge | `#2E7D5B` on `#E6F1EA` | Match %, good-fit chips |
| Risk amber | `#C0612F` | "At Risk" medium |
| Risk red | `#B0392F` | "At Risk" high |
| Hairline border (light) | `#E7E2D6` | Card borders, dividers on cream |
| Hairline border (navy) | `rgba(255,255,255,.08)` | Borders on navy surfaces |

Two CTA styles co-exist: **gold-filled** (mockup A) and **navy-filled** (mockup B).
Default to **navy-filled primary + outline secondary** for consistency, gold reserved
for accents and the logo mark.

## Typography

- **Headlines:** high-contrast editorial serif, **mixed case** (not all-caps).
  `Newsreader` (already loaded) is acceptable; `Fraunces` is closer to the mockup's
  refinement. Large, confident, tight leading. Gold used to highlight a key phrase
  (e.g. "$10,000+", "evaluates reality").
- **Body + UI:** clean humanist sans — `Inter` or system sans. Neutral, legible.
- **Retire `Oswald` condensed all-caps on the landing page.** Small uppercase labels
  (eyebrows, nav, chips) may use a tracked-out sans, NOT Oswald.

## Layout & components

- **Top nav:** wordmark + "Atlas" mark left; center links (How It Works, For Planners,
  For Couples, Venue Matchmaker, Pricing, Resources); right `Log in` + filled
  `Get Early Access`.
- **Hero:** headline + subcopy + two CTAs + small trust-badge row on the LEFT; a
  realistic **product-mockup card** on the RIGHT (plan-check score panel, or venue
  detail card with floor-plan diagram, capacity numbers, confidence score, risk rows).
- **Trust strip:** "Trusted by…" with restrained wordmark logos on cream.
- **Feature grid:** 5–6 cards, each with a **gold line icon**, short title + 1-line body.
  Section lead uses serif with a gold-highlighted phrase.
- **Venue Matchmaker:** filter pills (City, Wedding Type, Guest Range, Style) + filled
  "Find Matches" button. Results are **horizontally-scrolling cards WITH PHOTOS**, each
  showing a `NN% Match` badge (top-left over photo), name, location, capacity,
  indoor/outdoor, `$`-tier, and a category tag chip (e.g. "Best for Indian Weddings",
  "Outdoor Ceremony Friendly", "Luxury Experience").
- **Testimonial band:** navy background, portrait photo left, quote center,
  big-number metrics right ($2.7M+, 8,241+, 92% / 4,800+, 312, 18,000+, 55+).
- **Closing CTA:** "free feasibility check" inline form (Guest Count, Budget, Wedding
  Type, City) + filled button, OR email capture for early access.
- **Footer:** navy, wordmark + tagline + legal links.

## What to avoid (current site → don't carry over to landing)

- ❌ Maroon/red gradient backgrounds and the henna/paisley SVG overlay.
- ❌ Oswald all-caps headings on the landing page.
- ❌ Dark cards with maroon glow as the default card style.
- ✅ Instead: cream sections, navy hero/footer, white cards with hairline borders and
  soft shadows, brass-gold accents, serif headlines.

## Status

- [ ] Source mockup images committed to `./images/`
- [ ] Landing page (`app/page.tsx`) restyled to this system
- [ ] Venue Matchmaker restyled (photo cards + match badges + filter pills)
- [ ] Shared design tokens added to `globals.css` (cream/navy/gold) without breaking
      the existing authenticated portal styling
