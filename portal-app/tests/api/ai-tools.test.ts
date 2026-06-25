import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { buildFusionFlowPlan, buildVenueAnalyzerReport } from '@/lib/ai';

// With no GEMINI_API_KEY these resolve to the deterministic heuristic — the
// guaranteed floor. With a key, the Gemini path returns a strictly richer,
// culture-aware result and falls back to exactly these shapes on any failure.
describe('AI tools — offline heuristic fallback', () => {
  const savedKey = process.env.GEMINI_API_KEY;

  beforeEach(() => {
    delete process.env.GEMINI_API_KEY;
  });

  afterEach(() => {
    if (savedKey === undefined) {
      delete process.env.GEMINI_API_KEY;
    } else {
      process.env.GEMINI_API_KEY = savedKey;
    }
  });

  describe('buildFusionFlowPlan', () => {
    it('returns a complete plan that echoes the cultural blend', async () => {
      const plan = await buildFusionFlowPlan({
        eventId: 'evt-unknown',
        cultureBlend: 'Punjabi + Mexican',
        vibeGoal: 'Elegant then high energy',
        mustPlayTracks: 'Track A, Track B',
        guestCount: 280
      });

      expect(plan.confidence).toBe(0.84);
      expect(plan.timelineMoments).toHaveLength(3);
      expect(plan.timelineMoments[0]).toHaveProperty('musicDirection');
      expect(plan.timelineMoments[0]).toHaveProperty('lightingState');
      expect(plan.assumptions.join(' ')).toContain('Punjabi + Mexican');
      expect(plan.nextBestAction.length).toBeGreaterThan(0);
    });
  });

  describe('buildVenueAnalyzerReport', () => {
    it('flags vertical + crowd risk for a tall, high-capacity room', async () => {
      const report = await buildVenueAnalyzerReport({
        eventId: 'evt-unknown',
        venueName: 'Grand Hall',
        roomType: 'Ballroom',
        guestCount: 340,
        ceilingHeightFt: 22
      });

      expect(report.trustMetadata.reviewedBy).toBe('REVEL Production Team');
      expect(report.trustMetadata.confidenceScore).toBe(0.8);
      expect(report.required).toContain('Vertical truss or elevated fixture strategy for room saturation');
      expect(report.required).toContain('Expanded speaker coverage zones to prevent dead pockets');
      expect(report.riskFlags.some((flag) => flag.includes('Ceiling height may dilute'))).toBe(true);
    });

    it('reports all-clear for a modest room', async () => {
      const report = await buildVenueAnalyzerReport({
        eventId: 'evt-unknown',
        venueName: 'Garden Room',
        roomType: 'Salon',
        guestCount: 120,
        ceilingHeightFt: 14
      });

      expect(report.required).not.toContain('Vertical truss or elevated fixture strategy for room saturation');
      expect(report.riskFlags.some((flag) => flag.includes('within standard range'))).toBe(true);
      expect(report.riskFlags.some((flag) => flag.includes('within standard circulation range'))).toBe(true);
    });
  });
});
