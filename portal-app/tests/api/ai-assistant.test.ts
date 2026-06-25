import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { answerWeddingQuestion, buildAssistantGrounding } from '@/lib/ai-assistant';
import { getDomainScopesForRole } from '@/lib/role-scoped-adapters';

// A seed event id that has a client plan (see lib/mock-client-milestones.ts).
const SEED_EVENT_ID = 'b3c9e1f2-4a7d-4e8b-a1c2-d5e6f7a8b9c0';

describe('buildAssistantGrounding — role-scoped event facts', () => {
  it('gives a couple their timeline, tasks, and payment plan', async () => {
    const grounding = await buildAssistantGrounding({
      eventId: SEED_EVENT_ID,
      role: 'couple',
      userId: 'user-couple',
      domainScopes: getDomainScopesForRole('couple')
    });

    expect(grounding).toContain('TIMELINE');
    expect(grounding).toContain('TASKS');
    expect(grounding).toContain('PLAN & PAYMENTS');
  });

  it('never exposes the payment plan to a vendor', async () => {
    const grounding = await buildAssistantGrounding({
      eventId: SEED_EVENT_ID,
      role: 'vendor',
      userId: 'user-vendor',
      domainScopes: getDomainScopesForRole('vendor')
    });

    expect(grounding).not.toContain('PLAN & PAYMENTS');
    expect(grounding).not.toContain('Total contract value');
    expect(grounding.length).toBeGreaterThan(0);
  });

  it('omits a domain the role cannot access', async () => {
    const scopes = getDomainScopesForRole('couple');
    const noTimeline = { ...scopes, timeline: { ...scopes.timeline, access: 'none' as const } };

    const grounding = await buildAssistantGrounding({
      eventId: SEED_EVENT_ID,
      role: 'couple',
      userId: 'user-couple',
      domainScopes: noTimeline
    });

    expect(grounding).not.toContain('TIMELINE');
  });
});

describe('answerWeddingQuestion — offline fallback', () => {
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

  it('returns a grounded readout (not an error) when no AI key is configured', async () => {
    const grounding = await buildAssistantGrounding({
      eventId: SEED_EVENT_ID,
      role: 'couple',
      userId: 'user-couple',
      domainScopes: getDomainScopesForRole('couple')
    });

    const answer = await answerWeddingQuestion({
      grounding,
      role: 'couple',
      messages: [{ role: 'user', content: 'When are my payments due?' }]
    });

    expect(answer.source).toBe('fallback');
    expect(answer.grounded).toBe(true);
    expect(answer.reply).toContain('preview mode');
    // The fallback echoes the real grounded facts rather than a generic message.
    expect(answer.reply).toContain('PLAN & PAYMENTS');
  });
});
