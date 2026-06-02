# ATLAS-STRIPE-BUSINESS-SETUP

## Goal
Configure Atlas payment processing against your business Stripe account with the current product policy:
- Checks are not supported.
- Card + Apple/Google Pay + ACH are primary rails.
- Zelle/Venmo/Cash App are optional manual rails tracked in Atlas.

## Current Product Mapping
- Workspace-level billing (one payer per wedding workspace).
- Suggested launch prices:
  - Essential: 149 USD per wedding
  - Pro: 349 USD per wedding
  - Premium: 749 USD per wedding

## Stripe Account Setup (Business)
1. Complete Stripe business verification (legal entity, tax profile, payout bank account).
2. Enable payment methods:
   - Cards
   - Apple Pay / Google Pay
   - ACH debit/bank transfer (US)
3. Configure payout schedule (recommended: daily once stable, weekly during launch if desired).
4. Configure statement descriptor for customer clarity:
   - Example: `ATLAS REVEL`

## Products and Prices in Stripe
Create one-time prices for per-wedding workspace billing:
1. Product: `Atlas Essential Workspace`
   - Price: 149.00 USD, one-time
2. Product: `Atlas Pro Workspace`
   - Price: 349.00 USD, one-time
3. Product: `Atlas Premium Workspace`
   - Price: 749.00 USD, one-time

Optional phase-2 subscription:
1. Product: `Planner Portfolio Add-On`
   - Price: 99.00 USD recurring monthly

## Webhooks (Required)
Create a webhook endpoint in Stripe for production and include at least:
- `checkout.session.completed`
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `charge.refunded`

Store and use the webhook signing secret for signature verification.

## Environment Variables (Production)
Set in Vercel project settings:
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`

If Connect is used for split payouts later:
- `STRIPE_CONNECT_CLIENT_ID`

## Atlas Configuration Steps
1. Open couple/planner workspace payment settings panel.
2. Keep checks disabled (already enforced).
3. Set Stripe account ID in workspace settings where needed.
4. Enable manual rails only if handles are explicitly configured.

## Tax and Compliance
1. Decide tax handling mode before launch:
   - Stripe Tax enabled (recommended)
   - or manual tax treatment outside Atlas
2. Add Terms/Privacy links in checkout flow.
3. Ensure refund and cancellation policy is documented and linked in checkout.

## Operational Guardrails
1. Do not enable manual rails without verified destination handles.
2. Reconcile Stripe payouts daily during first 30 days.
3. Track failed payments and set retry/reminder policy.
4. Keep workspace billing owner explicit in Atlas commercial settings.

## Launch Checklist
- Stripe account verified
- Products/prices created
- Payment methods enabled
- Webhook endpoint active and verified
- Production env vars set in Vercel
- Atlas workspace payment settings configured
- Test transactions completed (card + ACH)
- Refund flow tested
