# ATLAS-PRICING-AND-PAYMENTS

## Decision Snapshot (Founder Direction)
- Keep Revel-managed events free for all participants.
- Independent mode is paid at the workspace level (one payer per wedding).
- Do not offer check payments.

## Recommended Launch Price Points (v1)

### Revel-Managed Mode
- Price: $0
- Billing owner: Revel operations
- Included: full workspace + core intelligence

### Independent Mode (Per-Wedding Workspace)
- Essential: $149 per wedding
- Pro: $349 per wedding
- Premium: $749 per wedding

### Optional Professional Add-On (Phase 2)
- Planner Portfolio Add-On: $99 per month
- Intended for planners managing multiple independent weddings concurrently

## Why These Price Points
- Essential at $149 is low enough to reduce first-purchase friction for DIY and budget-conscious couples.
- Pro at $349 aligns with clear operational value for multi-event complexity and coordinator-heavy workflows.
- Premium at $749 positions Atlas as a high-trust operating layer for complex, high-budget celebrations.

## Payment Rails Policy (No Checks)

### Supported at Launch
- Credit/debit cards (Stripe)
- Apple Pay / Google Pay (via Stripe checkout elements where available)
- ACH bank transfer (Stripe)
- Zelle (manual external transfer with in-product payment status tracking)
- Venmo (manual external transfer with in-product payment status tracking)
- Cash App (manual external transfer with in-product payment status tracking)

Default launch posture:
- Card + Apple/Google Pay + ACH are enabled by default.
- Zelle/Venmo/Cash App are disabled by default and become available only when a verified handle is configured.

### Not Supported
- Check payments

## Product Implementation Notes
- Separate payment processing from payment status tracking:
  - Stripe rails: process + reconcile automatically.
  - External rails (Zelle/Venmo/Cash App): record intent, mark pending, then mark verified/paid by authorized role.
- Keep `event/workspace` as billing boundary, not per-user seats.
- Persist payment method availability per workspace so Revel-managed and independent workspaces can differ.

## Metrics to Validate in First 60 Days
- Conversion rate by tier
- Upgrade rate Essential -> Pro
- Payment success rate for Stripe rails
- Share of manual external rails usage (Zelle/Venmo/Cash App)
- Days-to-pay for invoices by rail

## Re-pricing Trigger Criteria
- If Essential conversion < 7% after 60 days, test $99 intro pricing.
- If Pro conversion > 35% of paid workspaces, test Pro at $399.
- If Premium adoption < 8%, evaluate packaging before discounting.
