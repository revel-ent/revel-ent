# REVEL PMF Validation Scorecard (2-4 Week Beta)

Last updated: 2026-05-22
Owner: REVEL Product + Ops

## Goal

Decide if REVEL can scale the new portal with confidence based on real usage, not intuition.

Primary user outcome:
- Couples and planners complete key planning actions faster with fewer blockers.

Primary business outcome:
- More qualified planning conversions with lower coordination overhead.

## Weekly Metrics

Track these every week for 2-4 weeks:

1. Activation
- Definition: % of invited users who complete first meaningful portal action within 48 hours.
- Meaningful actions: submit intake, run venue analyzer, send dispatch update, confirm timeline item.
- Target: >= 60%

2. Engagement
- Definition: Weekly active couples + planners in authenticated portal.
- Target: week-over-week growth >= 15%

3. Conversion
- Definition: % of qualified inquiries progressing to paid consult or signed package.
- Target: >= 25% from qualified inquiries

4. Operational efficiency
- Definition: reduction in coordination back-and-forth and manual follow-ups.
- Measured by: dispatch count per event, unresolved blockers >24h, timeline clarification messages.
- Target: >= 40% reduction in manual follow-up volume

5. Reliability
- Definition: successful outbound updates across email + WhatsApp.
- Target: >= 98% sent (non-simulated) across production channels

## Data Collection

Capture at minimum:
- Event code
- User role
- Action type
- Timestamp
- Result status (success/fail)
- Time-to-complete for key workflows

Source systems:
- Portal app event logs
- Dispatch result statuses
- CRM/sales notes for conversion

## PMF Threshold (Go Signal)

Consider PMF signal strong enough for scaling if, for two consecutive weeks:
- Activation >= 60%
- Engagement growth >= 15% WoW
- Conversion >= 25% of qualified inquiries
- Efficiency improvement >= 40%
- Channel reliability >= 98%

If one or more thresholds miss:
- Keep hybrid launch mode
- Prioritize fixes on onboarding friction, unclear workflows, and dispatch confidence

## Weekly Review Ritual (30 minutes)

1. Read scorecard deltas from last week.
2. Identify top 3 friction points from user sessions.
3. Decide one high-impact fix for the next 7 days.
4. Re-check thresholds and go/no-go confidence.

## Notes

- PMF is not a single moment; treat it as repeated evidence.
- Keep Squarespace infrastructure as fallback until cutover gate is passed.
