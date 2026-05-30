# Squarespace Cutover Decision Gate

Last updated: 2026-05-22
Owner: REVEL Product + Operations

## Decision Statement

Do not fully decommission Squarespace until the portal and marketing stack meet technical and commercial readiness together.

## Gate A: Technical Readiness (must all be true)

1. Domain and outbound messaging
- Resend domain status: verified
- Email delivery to target recipient set: stable
- WhatsApp delivery in production: stable

2. Auth and access
- Role-based login works for Admin, Planner, and Couple paths
- Session secret configured for Development and Production
- No active auth regressions in production logs

3. Workflow reliability
- Venue analyzer works on production route
- Dispatch workflow returns sent states under configured channels
- No blocker-severity runtime errors during core workflow

4. Deployment hygiene
- Production alias stable on Vercel
- Rollback path documented
- Operator checklist is current

## Gate B: PMF Signal (must all be true for at least 2 consecutive weeks)

1. Activation >= 60%
2. WoW engagement growth >= 15%
3. Qualified inquiry to paid consult/package >= 25%
4. >= 40% reduction in manual coordination follow-up
5. >= 98% dispatch reliability (non-simulated)

See scorecard: docs/pmf-validation-scorecard.md

## Gate C: Commercial Readiness

1. Clear packaging and pricing path
- Included access for REVEL-managed weddings
- Self-serve paid path for external weddings

2. Sales and support preparedness
- Team can explain value proposition in under 60 seconds
- Support SOP exists for onboarding and access issues

3. Risk controls
- Backup communication path if provider outage occurs
- DNS/provider ownership documented

## Cutover Modes

1. Hybrid mode (default now)
- Keep Squarespace active for fallback and continuity
- Run portal as primary workflow for pilot users

2. Progressive cutover
- Route more inbound traffic to Vercel pages
- Keep rollback capability for at least 30 days

3. Full cutover
- Decommission Squarespace dependencies only after all gates pass
- Archive DNS and provider config decisions in execution log

## Current Status (as of 2026-05-22)

- Technical readiness: mostly pass
- PMF signal: not yet proven (in validation window)
- Commercial readiness: in progress

Recommended mode: Hybrid
