import { beforeEach, describe, expect, it, vi } from 'vitest';

const getSessionMock = vi.fn();
const listActiveAtlasRecommendationsMock = vi.fn();

vi.mock('@/lib/session', () => ({
  getSession: getSessionMock
}));

vi.mock('@/lib/atlas-evaluations', () => ({
  listActiveAtlasRecommendations: listActiveAtlasRecommendationsMock
}));

describe('onboarding recommendations route', () => {
  beforeEach(() => {
    vi.resetModules();
    getSessionMock.mockReset();
    listActiveAtlasRecommendationsMock.mockReset();

    getSessionMock.mockResolvedValue({
      userId: 'usr-planner-maulin',
      email: 'maulin@revel-ent.com',
      displayName: 'MC Maulin',
      role: 'planner',
      eventId: 'evt-revel-2026-11-15'
    });
  });

  it('returns 401 when session is missing', async () => {
    getSessionMock.mockResolvedValue(null);
    const { GET } = await import('@/app/api/onboarding/recommendations/route');

    const response = await GET(new Request('http://localhost/api/onboarding/recommendations'));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' });
  });

  it('returns 403 for role without onboarding access', async () => {
    getSessionMock.mockResolvedValue({
      userId: 'usr-vendor-heckno',
      email: 'heckno@revel-ent.com',
      displayName: 'DJ Heckno',
      role: 'vendor',
      eventId: 'evt-revel-2026-11-15'
    });
    const { GET } = await import('@/app/api/onboarding/recommendations/route');

    const response = await GET(new Request('http://localhost/api/onboarding/recommendations'));

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: 'Forbidden' });
  });

  it('returns 400 when event context is missing', async () => {
    getSessionMock.mockResolvedValue({
      userId: 'usr-planner-maulin',
      email: 'maulin@revel-ent.com',
      displayName: 'MC Maulin',
      role: 'planner',
      eventId: null
    });
    const { GET } = await import('@/app/api/onboarding/recommendations/route');

    const response = await GET(new Request('http://localhost/api/onboarding/recommendations'));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Missing event context' });
  });

  it('returns active atlas recommendations for current event', async () => {
    listActiveAtlasRecommendationsMock.mockResolvedValue({
      eventId: 'evt-revel-2026-11-15',
      activeStatuses: ['active', 'needs_review', 'snoozed'],
      source: 'database',
      items: [
        {
          id: 'e1',
          eventId: 'evt-revel-2026-11-15',
          venueId: 'v1',
          triggerKey: 'outdoor_power_or_curfew',
          groupedRecommendationKey: 'baraat_mobile_production_fx',
          fingerprint: 'fp-1',
          severity: 'warning',
          confidence: 0.86,
          status: 'active',
          evidence: { outdoors: true, limitedPower: true },
          recommendationPayload: {
            title: 'Outdoor Power or Curfew Risk',
            cta: 'Explore Baraat Upgrades'
          },
          missingFields: [],
          evaluatedBySource: 'api',
          createdAt: '2026-06-01T22:00:00.000Z',
          updatedAt: '2026-06-01T22:00:00.000Z'
        }
      ]
    });

    const { GET } = await import('@/app/api/onboarding/recommendations/route');
    const response = await GET(new Request('http://localhost/api/onboarding/recommendations?limit=5'));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.source).toBe('database');
    expect(payload.items).toHaveLength(1);
    expect(payload.items[0].triggerKey).toBe('outdoor_power_or_curfew');
    expect(listActiveAtlasRecommendationsMock).toHaveBeenCalledWith({
      eventId: 'evt-revel-2026-11-15',
      limit: 5
    });
  });
});