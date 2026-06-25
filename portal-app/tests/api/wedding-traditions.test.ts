import { describe, expect, it } from 'vitest';

import { buildGeneratedTimeline, buildTemplateRowsForTradition } from '@/lib/onboarding-timeline';
import type { AtlasVenueSeed } from '@/lib/atlas-venues';
import {
  DEFAULT_TRADITION_KEY,
  getPhaseLabel,
  getWeddingTradition,
  isWeddingTraditionKey,
  listWeddingTraditions
} from '@/lib/wedding-traditions';

const venue: AtlasVenueSeed = {
  id: 'venue-test',
  name: 'Test Hall',
  city: 'Austin',
  marketedCapacity: 400,
  comfortableRangeMin: 250,
  comfortableRangeMax: 350,
  notes: [],
  constraintsSummary: 'Test summary',
  sourceConfidence: 'partially_verified'
};

describe('wedding traditions registry', () => {
  it('ships several traditions and defaults to South Asian', () => {
    expect(listWeddingTraditions().length).toBeGreaterThanOrEqual(5);
    expect(DEFAULT_TRADITION_KEY).toBe('south_asian');
    expect(getWeddingTradition(undefined).key).toBe('south_asian');
    expect(getWeddingTradition('not-a-real-tradition').key).toBe('south_asian');
    expect(getWeddingTradition('jewish').key).toBe('jewish');
  });

  it('EVERY tradition reuses the canonical ceremony + reception phase codes', () => {
    // Timeline validation matches phaseCode === 'ceremony'/'reception' exactly, so
    // this invariant is what keeps feasibility checks working for every culture.
    for (const tradition of listWeddingTraditions()) {
      const codes = tradition.functions.map((fn) => fn.phaseCode);
      expect(codes, `${tradition.key} must contain a ceremony`).toContain('ceremony');
      expect(codes, `${tradition.key} must contain a reception`).toContain('reception');
    }
  });

  it('has unique phase codes within each tradition', () => {
    for (const tradition of listWeddingTraditions()) {
      const codes = tradition.functions.map((fn) => fn.phaseCode);
      expect(new Set(codes).size).toBe(codes.length);
    }
  });

  it('labels known phases and humanizes unknown ones', () => {
    expect(getPhaseLabel('mehndi')).toBe('Mehndi');
    expect(getPhaseLabel('tea_ceremony')).toBe('Tea Ceremony');
    expect(getPhaseLabel('ceremony')).toBe('Ceremony');
    expect(getPhaseLabel('some_new_ritual')).toBe('Some New Ritual');
  });

  it('recognizes valid tradition keys', () => {
    expect(isWeddingTraditionKey('east_asian')).toBe(true);
    expect(isWeddingTraditionKey('klingon')).toBe(false);
  });
});

describe('buildTemplateRowsForTradition', () => {
  it('reproduces the legacy South Asian template byte-for-byte', () => {
    expect(buildTemplateRowsForTradition('south_asian')).toEqual([
      { phase_code: 'mehndi', title: 'Mehndi Setup Complete', offset_minutes: -1560, default_duration_minutes: 60, requires_venue_check: false },
      { phase_code: 'haldi', title: 'Haldi Family Assembly', offset_minutes: -840, default_duration_minutes: 45, requires_venue_check: false },
      { phase_code: 'sangeet', title: 'Sangeet Production Check', offset_minutes: -300, default_duration_minutes: 30, requires_venue_check: true },
      { phase_code: 'baraat', title: 'Baraat Staging Ready', offset_minutes: -90, default_duration_minutes: 20, requires_venue_check: true },
      { phase_code: 'ceremony', title: 'Ceremony Guest Seating Open', offset_minutes: -45, default_duration_minutes: 30, requires_venue_check: false },
      { phase_code: 'reception', title: 'Reception Room Reset Complete', offset_minutes: 90, default_duration_minutes: 45, requires_venue_check: true }
    ]);
  });

  it('falls back to South Asian for an unknown tradition', () => {
    expect(buildTemplateRowsForTradition('nonsense')).toEqual(buildTemplateRowsForTradition('south_asian'));
  });

  it('produces tradition-specific functions for other cultures', () => {
    const jewish = buildTemplateRowsForTradition('jewish');
    expect(jewish.map((row) => row.phase_code)).toContain('ketubah');

    const eastAsian = buildTemplateRowsForTradition('east_asian');
    expect(eastAsian.map((row) => row.phase_code)).toContain('tea_ceremony');
    // tea_ceremony is NOT a South Asian function.
    expect(buildTemplateRowsForTradition('south_asian').map((row) => row.phase_code)).not.toContain('tea_ceremony');
  });
});

describe('buildGeneratedTimeline — tradition flows into the schedule', () => {
  it('builds a Jewish timeline with chuppah + canonical ceremony/reception', () => {
    const built = buildGeneratedTimeline({
      venue,
      weddingDate: '2026-10-10',
      templates: buildTemplateRowsForTradition('jewish'),
      templateSource: 'fallback',
      tradition: 'jewish',
      traditionLabel: 'Jewish'
    });

    expect(built.tradition).toBe('jewish');
    expect(built.traditionLabel).toBe('Jewish');
    expect(built.items.some((item) => item.phaseCode === 'ceremony')).toBe(true);
    expect(built.items.some((item) => item.phaseCode === 'reception')).toBe(true);
    expect(built.items.some((item) => item.title.includes('Chuppah'))).toBe(true);
    // Items are ordered by their offset.
    const offsets = built.items.map((item) => new Date(item.scheduledStartIso).getTime());
    expect([...offsets].sort((a, b) => a - b)).toEqual(offsets);
  });
});
