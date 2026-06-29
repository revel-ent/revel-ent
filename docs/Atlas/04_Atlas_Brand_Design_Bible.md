# Atlas Brand & Design Bible
**Version:** 1.0  
**Status:** Authoritative  
**Date:** June 28, 2026  
**Derives from:** `01_Atlas_Constitution.md`, `02_Atlas_Product_Philosophy.md`, `03_Atlas_Five_Year_Vision.md`  
**Reference images:** `portal-app/docs/ui-reference/images/Atlas Landing 1.png`, `Atlas landing 2.png`

---

> This document defines how Atlas looks, feels, and speaks.  
> Every designer, developer, and writer working on Atlas derives from this document.  
> When a design decision has no clear right answer, the answer lives here.

---

## Chapter 1 — Brand Identity

### 1.1 What Atlas Communicates

Atlas is an intelligence platform. Not a wedding app. Not a planner CRM. An intelligence platform for the wedding industry.

This distinction is load-bearing for every design decision Atlas makes. Intelligence platforms communicate through precision, confidence, and restraint. Wedding apps communicate through warmth, imagery, and celebration. Atlas must do both — and do them separately, in different contexts, at different times — without letting either register contaminate the other.

**The intelligence register** (planner dashboard, risk detection, data views) communicates:
- I am authoritative. Every number here is sourced.
- I am precise. I show you the right information, not more information.
- I am fast. Professional tooling that respects your time.

**The editorial register** (couple discovery, venue photography, marketing pages) communicates:
- I understand what you are trying to create.
- I see the beauty in what you are planning.
- I will help you get there.

These two registers share a color palette, a typeface family, and a set of spatial principles. They do not share a layout paradigm or a density level.

### 1.2 Emotional Goals

**What a planner should feel when opening Atlas:**  
Competent. In control. Like they have a co-pilot who has done the research. Never: overwhelmed, confused, or like they are using consumer software.

**What a couple should feel when opening Atlas:**  
Confident. Guided. Like they have access to expertise they could not otherwise afford. Never: intimidated, confused by jargon, or like they are doing data entry.

**What a vendor should feel when opening Atlas:**  
Prepared. Clear on expectations. Like they have exactly what they need and nothing they don't. Never: surprised by information they should have had, or flooded with irrelevant context.

**What a new user should feel seeing the Atlas landing page for the first time:**  
That this is not like anything they have seen in the wedding industry. That this is serious software built by people who understand professional events, not a consumer startup that added "AI" to their tagline.

### 1.3 Brand Personality

If Atlas were a person, they would be:
- The most experienced wedding planner you have ever worked with — who also happens to have the analytical precision of a Bloomberg terminal and the taste of an Aman hotel designer.
- Someone who gives you the honest answer, not the comfortable one.
- Someone who anticipated your question before you asked it.
- Precise without being cold. Confident without being arrogant. Elegant without being decorative.

**Atlas is not:**
- Excitable or celebratory (leave that to Pinterest)
- Aggressive or sales-forward (leave that to The Knot)
- Generic or corporate (leave that to HoneyBook)
- Overly dark or intimidating (it is software, not a luxury watch brand)

---

## Chapter 2 — Color System

### 2.1 The Core Palette

The existing mockups (Atlas Landing 1 and 2) establish a navy + amber gold foundation. The canonical Atlas brand evolves this in two ways: navy becomes a warmer near-black (more premium, less corporate), and amber becomes champagne gold (more refined, less saturated).

**Both reference mockups use alternating light/dark sections. This rhythm is correct and should be preserved as the canonical page structure.**

---

#### Atlas Warm Black — `#13110E`
The primary dark surface. Warm charcoal — not pure black, not navy. Closer to how dark objects look in candlelight than in fluorescent light.

**Use:** Hero sections, intelligence-register backgrounds, navigation bar (dark variant), data-dense planner views, footer.

**Do not use:** As body text on white backgrounds (too harsh — use Atlas Stone instead). As the only dark color (use alongside Midnight Navy for layered dark surfaces).

---

#### Atlas Midnight Navy — `#1C2A42`  
The secondary dark surface. Drawn directly from the reference mockups where navy is used for deep sections, overlays, and data cards. Cooler than Warm Black — creates visual layering in dark sections.

**Use:** Secondary dark sections, data overlays, card backgrounds in the intelligence register, map/diagram backdrops.

**Relationship to Warm Black:** Think of these as two woods in a luxury interior — complementary but distinct. Use Warm Black for exterior walls; Midnight Navy for cabinetry inside those walls.

---

#### Champagne Gold — `#C8A46A`
The signature accent. Refined from the amber/brass gold in the reference mockups — less orange, more champagne. The warmth of actual gold leaf, not the brightness of gilded plastic.

**Use:** Primary CTA buttons, wordmark accent, link hover states in dark sections, badge borders, match score highlights, premium tier indicators, active navigation items.

**Do not use:** As body text (insufficient contrast). On light backgrounds at small sizes (insufficient contrast at the weight required). As a background fill for large areas (too strong — it should punctuate, not dominate).

---

#### Champagne Gold Light — `#E8D4A8`
A lighter, warmer version of Champagne Gold for contexts where the full gold is too strong.

**Use:** Subheading accents in hero sections, icon fill in dark contexts, subtle highlights on venue cards, the "confidence high" state on data indicators.

---

#### Atlas Warm Ivory — `#F6F1EB`
The primary light surface. Warm cream — not pure white. This is the editorial register's ground color. The warmth signals care and intentionality — the same reason premium hospitality brands never use stark white walls.

**Use:** Editorial section backgrounds, couple-facing page backgrounds, venue photography sections, testimonial sections, the light variant of the navigation bar.

**Do not use:** As a text color. As a background for data-dense information (insufficient contrast for dense text at small sizes — use white `#FFFFFF` there instead).

---

#### Atlas Soft White — `#FFFFFF`
Pure white. Used only where maximum contrast is needed.

**Use:** Text on dark backgrounds, card surfaces within ivory-background sections, input fields, data tables.

**Do not use:** As a large-area background on marketing pages (use Atlas Warm Ivory instead). As a substitute for Atlas Warm Ivory in editorial contexts.

---

#### Atlas Stone — `#7A6E5F`
A warm mid-tone. The primary text color for body copy in light sections. More readable than black on warm ivory; more editorial than a standard dark gray.

**Use:** Body copy on light backgrounds, secondary navigation items, metadata text, caption text, subtle labels.

---

#### Atlas Parchment — `#D9D0C3`
A light warm neutral for dividers, borders, and subtle backgrounds.

**Use:** Horizontal rules, card borders in light sections, input borders at rest state, table row alternates.

---

### 2.2 Semantic Colors

These colors carry specific meaning and must be used consistently.

| Semantic role | Color | Hex | When to use |
|---|---|---|---|
| Verified / High confidence | Warm Emerald | `#2D7D58` | Confidence score ≥ 0.9, field verified |
| Likely accurate | Warm Amber | `#B87A1F` | Confidence score 0.7–0.89 |
| Estimated | Warm Amber Light | `#D4992A` | Confidence score 0.5–0.69 |
| Critical risk | Warm Crimson | `#B83232` | Critical risk flag, venue constraint violation |
| Warning | Warm Sienna | `#C25830` | Warning risk, timeline conflict |
| Unverified / Unknown | Stone Gray | `#9B8E7E` | Data not verified, research needed |
| AI-generated | Champagne Gold | `#C8A46A` | AI recommendation, Atlas Intelligence output |

**Rule:** Semantic colors are never used decoratively. Warm Crimson is not a brand accent; it is a risk signal. Using it outside that semantic role degrades the entire trust communication system.

---

### 2.3 Color Usage by Register

| Register | Background | Text | Accent | Secondary surfaces |
|---|---|---|---|---|
| Intelligence (dark) | Atlas Warm Black | Atlas Soft White | Champagne Gold | Atlas Midnight Navy |
| Editorial (light) | Atlas Warm Ivory | Atlas Stone | Champagne Gold | Atlas Soft White |
| Data / Tables | Atlas Soft White | `#2C2420` | Champagne Gold | Atlas Parchment |
| Alert / Risk | Atlas Warm Black + Warm Crimson border | Atlas Soft White | Warm Crimson | Atlas Midnight Navy |

---

### 2.4 The Alternating Rhythm

The Atlas marketing site and couple-facing flows alternate between the two registers in a deliberate sequence:

```
[WARM BLACK]   — Hero section: intelligence platform, the problem we solve, the data behind the product
[WARM IVORY]   — Discovery section: venue photography, role benefits, the human experience
[WARM BLACK]   — Proof section: data confidence stats, risk detection, the numbers
[WARM IVORY]   — Social proof: testimonials, use cases, partner venues
[WARM BLACK]   — CTA / footer: primary action, navigation
```

This is not an arbitrary pattern. Dark sections establish credibility and seriousness. Light sections establish warmth and aspiration. The alternation earns both.

**Do not:** Use two consecutive same-register sections without a deliberate reason (a strong exception might be a very deep landing page where a second dark section is needed for a second intelligence-forward feature).

---

## Chapter 3 — Typography

### 3.1 Type Philosophy

Atlas uses two typefaces, each chosen for a specific job. They are not interchangeable.

The serif carries weight, editorial authority, and emotional resonance. It is the Atlas voice in its most expressive form. The sans-serif carries precision, legibility, and operational clarity. It is Atlas thinking at speed.

**One principle above all:** Mixed-case always. Never all-caps for headlines or navigation. All-caps in a luxury context reads as shouting; mixed-case in a refined serif reads as considered.

---

### 3.2 Display Typeface — Cormorant Garamond

**Family:** Cormorant Garamond  
**Source:** Google Fonts (free, production-ready)  
**Weights used:** Light (300) for hero headlines, Regular (400) for section headlines, Italic (400i) for emphasis  
**Why:** Cormorant Garamond has the editorial authority of a classic magazine masthead combined with extreme legibility at large sizes. It feels old-world and premium without being stiff. It pairs naturally with warm gold accents. It reads as "crafted" rather than "designed."

**Sizing scale (display):**

| Use | Size | Weight | Line height | Tracking |
|---|---|---|---|---|
| Hero headline (dark sections) | 72–96px | Light 300 | 1.0 | -0.02em |
| Hero headline (light sections) | 56–72px | Light 300 | 1.05 | -0.015em |
| Section headline (dark) | 44–52px | Regular 400 | 1.1 | -0.01em |
| Section headline (light) | 36–44px | Regular 400 | 1.15 | -0.01em |
| Subsection / card headline | 24–32px | Regular 400 | 1.2 | 0 |
| Feature callout (italic) | 20–24px | Italic 400 | 1.3 | 0 |

**Responsive behavior:** Hero headlines scale down gracefully — 72px desktop → 44px tablet → 32px mobile. Do not use Cormorant Garamond below 18px; switch to the sans-serif at small sizes.

---

### 3.3 Interface Typeface — DM Sans

**Family:** DM Sans  
**Source:** Google Fonts (free, production-ready)  
**Weights used:** Regular (400), Medium (500), SemiBold (600)  
**Why:** DM Sans is a humanist sans-serif with warmth — it avoids the sterile precision of Inter while maintaining excellent legibility at small sizes. It has genuine personality without being quirky. It works equally well in the intelligence register (dense data labels) and the editorial register (body copy on ivory).

**Sizing scale (interface):**

| Use | Size | Weight | Line height | Tracking |
|---|---|---|---|---|
| Navigation | 14px | Medium 500 | — | 0.02em |
| Body copy (long-form) | 18px | Regular 400 | 1.7 | 0 |
| Body copy (UI elements) | 16px | Regular 400 | 1.5 | 0 |
| Labels / metadata | 14px | Regular 400 | 1.4 | 0.01em |
| Badges / tags | 12px | SemiBold 600 | — | 0.04em |
| Data values (large) | 48px | SemiBold 600 | 1.0 | -0.01em |
| Data values (medium) | 32px | Medium 500 | 1.1 | 0 |
| Data labels | 11px | Medium 500 | — | 0.06em |

**Tabular numbers:** Always use `font-variant-numeric: tabular-nums` for any number that appears in a table, chart, or data comparison. Prevents layout shift as numbers change.

---

### 3.4 Type Color Rules

| Context | Text color | Notes |
|---|---|---|
| Hero headline on Warm Black | `#FFFFFF` | Maximum contrast for dark hero |
| Section headline on Warm Black | `#F6F1EB` (Warm Ivory) | Slightly softer, editorial feel |
| Body copy on Warm Black | `#C4B9AA` | Warm gray — never full white for body |
| Hero headline on Warm Ivory | `#13110E` (Warm Black) | Maximum contrast |
| Body copy on Warm Ivory | `#7A6E5F` (Atlas Stone) | Warm, readable, editorial |
| Data values | `#2C2420` | Near-black — maximum precision |
| Labels / metadata | `#9B8E7E` | Secondary — recedes appropriately |
| Champagne Gold accent text | `#C8A46A` | Use only for emphasis, not body |

---

## Chapter 4 — Photography & Imagery

### 4.1 Photography Philosophy

Photography in Atlas serves two distinct jobs:

**In the editorial register:** Photography is the emotional proof. It shows what Atlas enables — the ceremony in the sun-drenched ballroom, the reception in the candlelit courtyard, the baraat arriving at the venue steps. These images do not need data overlays. They need to stop the reader.

**In the intelligence register:** Photography is context, not emotion. A venue's exterior as background to its constraint data. The ballroom behind the capacity analysis. Never let the photography overwhelm the data in intelligence-register sections.

### 4.2 Subject Matter

- **Venues:** Exterior architecture, grand entrance moments, empty ballrooms that show scale and light. Not posed couple shots in the ballroom.
- **Events:** Full-scale South Asian and fusion weddings at premium venues — the scale of production, the ceremony detail, the reception energy. Not stock photography of generic weddings.
- **People:** Only real people. No stock models. Vendor headshots and planner portraits should be authentic and professional, not aspirational stock.
- **Data/UI:** The venue analytics mockup (capacity diagram, confidence scores, risk flags) — this is a signature Atlas visual element that should appear in every intelligence-register hero.

### 4.3 Photography Style

- **Color treatment:** Warm but not orange. The warmth of late afternoon light, not Instagram orange. Skin tones preserved accurately. Gold elements (fabric, decor, light) should glow, not blow out.
- **Contrast:** High but not crushed. Deep shadows with open highlights. The quality of a luxury hotel's lighting, not a flash-lit event photo.
- **Composition:** Venues photographed with architectural precision — straight verticals, proper lens selection (no extreme wide-angle distortion). Event moments photographed with editorial patience — not the forced spontaneity of staged lifestyle photography.
- **Coverage:** Atlanta and Georgia venues only, until data coverage expands. Do not use photography of non-covered venues in marketing contexts. Authenticity is the moat.

### 4.4 The Intelligence Overlay Visual

The UI mockup showing venue capacity data, floor plan overlays, and confidence scores (as seen in Landing 1) is Atlas's signature visual element. It should appear:
- In the first intelligence-register hero section of the marketing site
- In the Venue Production Analyzer feature callout
- In any context where the core Atlas intelligence capability needs to be communicated visually

Design principles for this element:
- The floor plan diagram should be clean and schematic — not a literal architectural drawing
- The data overlays should use the actual Atlas type and color system (not mockup-style placeholders)
- Confidence indicators should use the canonical semantic colors
- The overall composition should feel like "real software you would actually use," not a feature illustration

---

## Chapter 5 — Spatial System

### 5.1 The Core Unit

Base unit: **8px**. All spacing, sizing, and layout values are multiples of 8.

| Token name | Value | Common use |
|---|---|---|
| `space-1` | 8px | Inline gaps, icon padding |
| `space-2` | 16px | Component internal padding |
| `space-3` | 24px | Between related elements |
| `space-4` | 32px | Between components |
| `space-6` | 48px | Section sub-spacing |
| `space-8` | 64px | Section spacing (mobile) |
| `space-12` | 96px | Section spacing (desktop) |
| `space-16` | 128px | Major section breaks |
| `space-24` | 192px | Hero vertical padding |

### 5.2 Grid

**Desktop (≥1280px):** 12-column grid, 80px column, 24px gutter, 80px margin  
**Tablet (768–1279px):** 8-column grid, 60px column, 20px gutter, 40px margin  
**Mobile (<768px):** 4-column grid, fluid columns, 16px gutter, 24px margin

**Maximum content width:** 1440px. Pages are centered within the viewport at wider screens.  
**Maximum text column width:** 720px. Long-form body text never exceeds this width regardless of grid.  
**Data table width:** Full grid width is acceptable for data-dense planner views. Not for editorial content.

### 5.3 Elevation

Atlas uses a four-level elevation system, defined by shadow and background lightness, not just shadow alone.

| Level | Use | Shadow |
|---|---|---|
| 0 | Page surface | None |
| 1 | Cards at rest | `0 1px 3px rgba(0,0,0,0.08)` |
| 2 | Cards on hover, dropdowns | `0 4px 12px rgba(0,0,0,0.12)` |
| 3 | Modals, overlays | `0 16px 48px rgba(0,0,0,0.20)` |
| 4 | Command palette, full-screen overlays | `0 32px 80px rgba(0,0,0,0.32)` |

In dark sections, shadows are replaced with border-based elevation: `1px solid rgba(255,255,255,0.08)` for Level 1, `1px solid rgba(255,255,255,0.14)` for Level 2.

### 5.4 Border Radius

| Element | Radius |
|---|---|
| Buttons | 6px |
| Cards | 12px |
| Input fields | 8px |
| Modal dialogs | 16px |
| Badges / pills | 999px (full pill) |
| Venue photo crops | 12px |
| Data visualization cards | 8px |

**Principle:** Radius should feel considered, not generous. Atlas is not a rounded, friendly consumer app. The corners are slightly softened — not sharp (too corporate) and not fully rounded (too playful).

---

## Chapter 6 — Iconography

### 6.1 Icon Style

**Style:** Outline stroke icons, 1.5px stroke weight, 20×20px or 24×24px base size.  
**Corner treatment:** Rounded joins (not miter). Consistent with the overall border radius system.  
**Fill:** Transparent — no filled icons except for semantic-critical states (a filled checkmark for "verified," a filled circle for "active" status indicators).

**Source:** Atlas uses a consistent icon library — Lucide (open source, MIT licensed, excellent geometric quality) as the default. Custom icons may be drawn for Atlas-specific concepts (the capacity diagram icon, the risk flag icon, the confidence indicator) following the same stroke specifications.

### 6.2 Semantic Icon Set

These specific icons must be consistent throughout the product:

| Meaning | Icon | Notes |
|---|---|---|
| Verified constraint | Checkmark in circle (filled) | Warm Emerald fill |
| Risk / critical flag | Triangle with exclamation | Warm Crimson |
| Warning | Circle with exclamation | Warm Sienna |
| Research needed | Question mark in circle | Atlas Stone |
| AI-generated content | Sparkle / star | Champagne Gold — labels all AI outputs |
| Venue capacity | People icon + number | Used in venue cards |
| Timeline conflict | Overlapping rectangles + warning | Red variant |
| Confidence score | Filled gauge/meter | Color-coded to confidence level |

---

## Chapter 7 — Motion System

### 7.1 Motion Philosophy

Atlas moves like a premium publication, not a startup SaaS app.

The difference: startup SaaS moves fast (100–150ms transitions, quick snaps, instant feedback). Premium editorial experiences move with deliberateness — things arrive with intention, not urgency. The pacing communicates confidence.

**Atlas motion is slow enough to feel considered, fast enough to feel responsive.** This is not the same thing as "slow UX." A 300ms ease-in-out transition on a modal feels premium. A 600ms ease-in transition on a button feedback feels broken.

### 7.2 Easing Functions

| Use | Easing | Duration |
|---|---|---|
| Page transitions | `cubic-bezier(0.22, 1, 0.36, 1)` | 350ms |
| Modal / overlay enter | `cubic-bezier(0.22, 1, 0.36, 1)` | 280ms |
| Modal / overlay exit | `cubic-bezier(0.55, 0, 1, 0.45)` | 200ms |
| Card hover | `cubic-bezier(0.22, 1, 0.36, 1)` | 200ms |
| Button press | `cubic-bezier(0.22, 1, 0.36, 1)` | 80ms |
| Dropdown / menu open | `cubic-bezier(0.22, 1, 0.36, 1)` | 160ms |
| Data load / skeleton | Linear | Looping, 1500ms cycle |
| Scroll-triggered reveals | `cubic-bezier(0.22, 1, 0.36, 1)` | 400ms |

**No bounce.** No spring physics. No elasticity. Atlas does not bounce. Luxury products do not bounce.

### 7.3 Scroll Animation Rules

- Section reveals: translate-Y (24px → 0) + opacity (0 → 1), triggered at 20% scroll-into-view
- Staggered card reveals: 60ms delay per card in a row
- Hero imagery: subtle parallax at 0.15 depth (background moves slower than foreground) — only on desktop
- Data numbers: count-up animation when first entering view — 800ms, ease-out

**Performance rule:** All animations must respect `prefers-reduced-motion`. When the user has reduced motion enabled, all transitions drop to 0ms opacity change only — no transforms.

---

## Chapter 8 — Voice & Copywriting

### 8.1 The Atlas Voice

Atlas speaks with the quiet confidence of a seasoned professional — not the enthusiasm of a startup, not the formality of an enterprise vendor.

**Atlas copy is:**
- Direct — says what it means without hedging
- Specific — names the constraint, the venue, the risk (not "some issues were found")
- Honest — never softer than the facts warrant
- Considered — sentences that earned their place, not filler

**Atlas copy is never:**
- Exclamatory ("Check out this amazing venue!" / "You're going to love this!")
- Jargon-heavy ("leveraging AI-powered synergies")
- Vague ("helps you plan better")
- Overconfident ("the only platform you'll ever need")

### 8.2 Headline Principles

**The two-part headline structure** (visible in both reference images) is a strong Atlas pattern and should be canonical for hero sections:

```
[Declarative truth, short]
[Benefit or outcome, slightly longer]
```

Examples from the reference images:
- "Plan with certainty. / Protect every moment."
- "The clarity to plan it right. / The experience to live it fully."

This structure works because the first line establishes the stance (confident, precise, direct) and the second line earns the emotional resonance. Do not reverse the order.

**Headline length:** Hero headlines fit in 3–7 words per line. Never break a meaningful phrase across a line break if it can be avoided. Never sacrifice meaning for symmetry.

### 8.3 Feature Copy Principles

When describing Atlas features, describe the outcome, not the mechanism:

| Instead of | Write |
|---|---|
| "AI-powered venue matching" | "Find venues that actually work for your event" |
| "Trust metadata on every data point" | "Every constraint is sourced. You know where the number came from." |
| "Multi-role access control" | "Everyone sees exactly what they need" |
| "Timeline conflict detection" | "Atlas catches the collision before you sign the contract" |

The mechanism (AI, database, vector search) is Atlas's engineering. The outcome is the planner's problem solved.

### 8.4 Data Copy Standards

Data displayed by Atlas must be presented with precision and context:

- Always label units: "612 guests" not "612"
- Always include confidence when relevant: "850 marketed / 612 realistic (±5%)"
- Never present AI-generated numbers without a label: "Atlas Intelligence: estimated at 612 based on room dimensions and configuration" 
- Unknown is labeled explicitly: "Power specification: research needed"

### 8.5 Button Copy

Primary CTA on dark (intelligence) sections: **"Get Early Access"** or **"Analyze Your Venue"** — action-first, operationally specific.  
Primary CTA on light (editorial) sections: **"Find Your Venue"** or **"See How Atlas Works"** — discovery-forward.  
Secondary action: **"See How It Works"**, **"View a Demo"**, **"Learn More"** — avoid "Click here."

### 8.6 Error & Risk Copy

Risk flags and error messages are the moment Atlas either earns or loses planner trust. They must be:

- Specific: name the constraint, name the value, name why it matters
- Actionable: tell the planner what to do next
- Honest about confidence: if the flag is based on estimated data, say so

**Good:**  
> "The circuit capacity at this venue (estimated at 100A) may be insufficient for your production requirements. Confirm with venue management before finalizing the AV contract."

**Bad:**  
> "Potential power issue detected. Please review."

---

## Chapter 9 — What Atlas Looks Like (Reference Summary)

### 9.1 The Intelligence Register (Dark Sections)

```
Background: Atlas Warm Black (#13110E)
Secondary surface: Atlas Midnight Navy (#1C2A42)
Primary text: #FFFFFF
Body text: #C4B9AA (warm gray)
Accent: Champagne Gold (#C8A46A)
Headline type: Cormorant Garamond, Light 300
Body type: DM Sans, Regular 400
Borders: rgba(255,255,255,0.08)
```

This is where risk detection, capacity analysis, and operational intelligence live. Dense, precise, confident.

### 9.2 The Editorial Register (Light Sections)

```
Background: Atlas Warm Ivory (#F6F1EB)
Card surfaces: #FFFFFF
Primary text: #13110E (Warm Black)
Body text: #7A6E5F (Atlas Stone)
Accent: Champagne Gold (#C8A46A)
Headline type: Cormorant Garamond, Light 300
Body type: DM Sans, Regular 400
Borders: Atlas Parchment (#D9D0C3)
```

This is where venue discovery, photography, role benefits, and testimonials live. Generous, warm, editorial.

### 9.3 The Alternating Page Rhythm

```
Section 1 (dark)    → Hero: Platform identity, intelligence framing
Section 2 (light)   → Discovery: Venue cards, role benefits, photography
Section 3 (dark)    → Proof: Data confidence stats, risk detection, the numbers
Section 4 (light)   → Social proof: Testimonials, planner stories, partner venues
Section 5 (dark)    → Conversion: Primary CTA, early access
```

---

## Chapter 10 — What Atlas Does Not Look Like

| Do not | Why |
|---|---|
| All-dark pages | Intelligence sections earn their weight. Back-to-back dark sections read as a design choice without a product reason. |
| All-white / all-light pages | Loses the premium, authoritative register. Atlas is not a SaaS dashboard or a consumer wedding app. |
| Rounded corners everywhere (>16px) | Too playful. Atlas is precise. |
| Gradient backgrounds | Dates the design. Atlas uses flat color surfaces with photography. |
| Decorative serif fonts | Cormorant Garamond is editorial, not decorative. Do not use script or display-script fonts. |
| Henna patterns, floral motifs | The previous REVEL branding used these. They communicate "South Asian wedding vendor," not "intelligence platform." |
| Maroon and deep red as primary palette | This was the old visual direction. It is historical reference only. |
| Navy as a large-area background | Navy is used only as a secondary dark surface layered within Warm Black sections, not as the primary dark color. |
| Generic stock photography | No Shutterstock / iStock wedding photos. Real venues, real events. |
| Bounce animations | Not the product personality. |
| Emoji in UI | No. |

---

## Appendix — Decision Log

| Date | Decision | Rationale |
|---|---|---|
| 2026-06-28 | Black/champagne gold editorial direction is canonical | Replaces navy/gold. Reference: Apple / Aman / Four Seasons / Linear / Bloomberg |
| 2026-06-28 | Alternating warm black / warm ivory section rhythm is the canonical page structure | Established in both reference images; balances intelligence + editorial |
| 2026-06-28 | Cormorant Garamond + DM Sans as the type system | Editorial authority (serif) + operational clarity (sans-serif) |
| 2026-06-28 | No all-caps headlines or navigation | Luxury brands use mixed case; all-caps reads as shouting |
| 2026-06-28 | Navy (Midnight Navy #1C2A42) is a secondary dark, not a primary | Navy is corporate; warm near-black is premium |
| 2026-06-28 | No bounce, spring, or elastic animations | Not consistent with the brand's precision and restraint |
| 2026-06-28 | "Intelligence overlay" visual (venue floor plan + data overlay) is a canonical Atlas hero element | Signature of the platform's core value; must appear in hero |
