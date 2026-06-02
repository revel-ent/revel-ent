import { beforeEach, describe, expect, it, vi } from 'vitest';

const runCapacityCheckLiveMock = vi.fn();
const runOutdoorPowerCurfewLiveMock = vi.fn();
const generateTimelineFromVenueMock = vi.fn();
const getSupabaseAdminClientMock = vi.fn();
const isSupabaseConfiguredMock = vi.fn();
const getSessionMock = vi.fn();
const signSessionTokenMock = vi.fn();

vi.mock('@/lib/atlas-venues', async () => {
  const actual = await vi.importActual('@/lib/atlas-venues');
  return {
    ...actual,
    runCapacityCheckLive: runCapacityCheckLiveMock,
    runOutdoorPowerCurfewLive: runOutdoorPowerCurfewLiveMock
  };
});

vi.mock('@/lib/onboarding-timeline', () => ({
  generateTimelineFromVenue: generateTimelineFromVenueMock
}));

vi.mock('@/lib/supabase-server', () => ({
  getSupabaseAdminClient: getSupabaseAdminClientMock,
  isSupabaseConfigured: isSupabaseConfiguredMock
}));

vi.mock('@/lib/session', () => ({
  getSession: getSessionMock
}));

vi.mock('@/lib/session-token', async () => {
  const actual = await vi.importActual('@/lib/session-token');
  return {
    ...actual,
    signSessionToken: signSessionTokenMock
  };
});

describe('onboarding routes', () => {
  beforeEach(() => {
    vi.resetModules();
    runCapacityCheckLiveMock.mockReset();
    runOutdoorPowerCurfewLiveMock.mockReset();
    generateTimelineFromVenueMock.mockReset();
    getSupabaseAdminClientMock.mockReset();
    isSupabaseConfiguredMock.mockReset();
    getSessionMock.mockReset();
    signSessionTokenMock.mockReset();

    getSessionMock.mockResolvedValue({
      userId: 'usr-planner-maulin',
      email: 'maulin@revel-ent.com',
      displayName: 'MC Maulin',
      role: 'planner',
      eventId: '0f1d7d0a-7c8f-4f5f-9c89-9c8b2f3e1a11'
    });
    signSessionTokenMock.mockResolvedValue('signed-session-token');
    runOutdoorPowerCurfewLiveMock.mockResolvedValue(null);
  });

  it('venue-check returns 401 when session is missing', async () => {
    getSessionMock.mockResolvedValue(null);
    const { POST } = await import('@/app/api/onboarding/venue-check/route');

    const request = new Request('http://localhost/api/onboarding/venue-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ venueId: 'atlas-venue-1', guestCount: 200 })
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' });
  });

  it('venue-check returns 403 for unauthorized role', async () => {
    getSessionMock.mockResolvedValue({
      userId: 'usr-vendor-heckno',
      email: 'heckno@revel-ent.com',
      displayName: 'DJ Heckno',
      role: 'vendor',
      eventId: '0f1d7d0a-7c8f-4f5f-9c89-9c8b2f3e1a11'
    });
    const { POST } = await import('@/app/api/onboarding/venue-check/route');

    const request = new Request('http://localhost/api/onboarding/venue-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ venueId: 'atlas-venue-1', guestCount: 200 })
    });

    const response = await POST(request);

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: 'Forbidden' });
  });

  it('timeline approve returns 401 when session is missing', async () => {
    getSessionMock.mockResolvedValue(null);
    const { POST } = await import('@/app/api/onboarding/timeline/approve/route');

    const request = new Request('http://localhost/api/onboarding/timeline/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ venueId: 'atlas-record-777', guestCount: 200 })
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' });
  });

  it('timeline approve returns 403 for unauthorized role', async () => {
    getSessionMock.mockResolvedValue({
      userId: 'usr-vendor-heckno',
      email: 'heckno@revel-ent.com',
      displayName: 'DJ Heckno',
      role: 'vendor',
      eventId: '0f1d7d0a-7c8f-4f5f-9c89-9c8b2f3e1a11'
    });
    const { POST } = await import('@/app/api/onboarding/timeline/approve/route');

    const request = new Request('http://localhost/api/onboarding/timeline/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ venueId: 'atlas-record-777', guestCount: 200 })
    });

    const response = await POST(request);

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: 'Forbidden' });
  });

  it('venue-check returns live capacity payload when venue is found', async () => {
    runCapacityCheckLiveMock.mockResolvedValue({
      status: 'safe',
      message: 'Comfortable fit.',
      venue: {
        id: 'atlas-venue-1',
        name: 'Atlas Ballroom',
        city: 'Atlanta, GA',
        marketedCapacity: 500,
        comfortableRangeMin: 280,
        comfortableRangeMax: 420,
        notes: ['Dock is shared after 3 PM.'],
        constraintsSummary: 'Planner reviewed.',
        sourceConfidence: 'vendor_verified'
      }
    });

    const { POST } = await import('@/app/api/onboarding/venue-check/route');

    const request = new Request('http://localhost/api/onboarding/venue-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ venueId: 'atlas-venue-1', guestCount: 300 })
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.status).toBe('safe');
    expect(payload.atlasOutdoorPowerCurfew).toBeNull();
    expect(runCapacityCheckLiveMock).toHaveBeenCalledWith({ venueId: 'atlas-venue-1', guestCount: 300 });
    expect(runOutdoorPowerCurfewLiveMock).toHaveBeenCalledWith({
      venueId: 'atlas-venue-1',
      eventId: '0f1d7d0a-7c8f-4f5f-9c89-9c8b2f3e1a11',
      ceremonyOutdoors: undefined,
      baraatOutdoors: undefined
    });
  });

  it('venue-check returns outdoor power/curfew recommendation when trigger fires', async () => {
    runCapacityCheckLiveMock.mockResolvedValue({
      status: 'tight',
      message: 'Possible but tight.',
      venue: {
        id: 'atlas-venue-2',
        name: 'Atlas Gardens',
        city: 'Atlanta, GA',
        marketedCapacity: 350,
        comfortableRangeMin: 200,
        comfortableRangeMax: 280,
        notes: [],
        constraintsSummary: 'Outdoor power review needed.',
        sourceConfidence: 'partially_verified'
      }
    });
    runOutdoorPowerCurfewLiveMock.mockResolvedValue({
      venue: {
        id: 'atlas-venue-2',
        name: 'Atlas Gardens',
        city: 'Atlanta, GA',
        marketedCapacity: 350,
        comfortableRangeMin: 200,
        comfortableRangeMax: 280,
        notes: [],
        constraintsSummary: 'Outdoor power review needed.',
        sourceConfidence: 'partially_verified'
      },
      persistenceMode: 'persisted',
      recommendation: {
        triggerKey: 'outdoor_power_or_curfew',
        groupedRecommendationKey: 'baraat_mobile_production_fx',
        status: 'active',
        severity: 'warning',
        confidence: 0.86,
        fired: true,
        title: 'Outdoor Power or Curfew Risk',
        message: 'Outdoor plan intersects venue constraints.',
        cta: 'Explore Baraat Upgrades',
        evidence: {
          outdoors: true,
          limitedPower: true,
          strictCurfew: true,
          amplifiedDenied: false,
          curfewHour: 22
        },
        missingFields: [],
        fingerprint: 'evt-1:ven-1:outdoor_power_or_curfew:1:1:1:0:22'
      }
    });

    const { POST } = await import('@/app/api/onboarding/venue-check/route');

    const request = new Request('http://localhost/api/onboarding/venue-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        venueId: 'atlas-venue-2',
        guestCount: 290,
        ceremonyOutdoors: true,
        baraatOutdoors: true
      })
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.atlasOutdoorPowerCurfew?.triggerKey).toBe('outdoor_power_or_curfew');
    expect(payload.atlasEvaluationPersistenceMode).toBe('persisted');
    expect(runOutdoorPowerCurfewLiveMock).toHaveBeenCalledWith({
      venueId: 'atlas-venue-2',
      eventId: '0f1d7d0a-7c8f-4f5f-9c89-9c8b2f3e1a11',
      ceremonyOutdoors: true,
      baraatOutdoors: true
    });
  });

  it('venue-check returns 404 when live adapter has no venue', async () => {
    runCapacityCheckLiveMock.mockResolvedValue(null);

    const { POST } = await import('@/app/api/onboarding/venue-check/route');

    const request = new Request('http://localhost/api/onboarding/venue-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ venueId: 'missing-venue', guestCount: 120 })
    });

    const response = await POST(request);

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: 'venue_not_found' });
  });

  it('timeline generate returns venue intelligence metadata', async () => {
    getSupabaseAdminClientMock.mockReturnValue(null);
    isSupabaseConfiguredMock.mockReturnValue(false);
    generateTimelineFromVenueMock.mockResolvedValue({
      venue: {
        id: 'atlas-venue-2',
        name: 'Regency Hall',
        city: 'Atlanta, GA',
        marketedCapacity: 420,
        comfortableRangeMin: 240,
        comfortableRangeMax: 340,
        notes: [],
        constraintsSummary: 'Live data loaded.',
        sourceConfidence: 'partially_verified'
      },
      venueIntelligence: {
        sourceConfidence: 'partially_verified',
        topConstraints: [
          {
            key: 'curfew_time',
            label: 'curfew time',
            value: '22:00',
            notes: 'Noise restrictions enforced after 10 PM.'
          }
        ],
        sourceLinks: [{ label: 'Venue packet', url: 'https://example.com/venue-packet' }]
      },
      weddingDate: '2026-10-12T17:00:00.000Z',
      items: [],
      warnings: [],
      templateSource: 'fallback'
    });

    const { POST } = await import('@/app/api/onboarding/timeline/generate/route');

    const request = new Request('http://localhost/api/onboarding/timeline/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ venueId: 'atlas-venue-2' })
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.venueIntelligence.topConstraints).toHaveLength(1);
    expect(payload.venueIntelligence.sourceConfidence).toBe('partially_verified');
    expect(payload.persistenceMode).toBe('simulated');
  });

  it('timeline approve queries venues by atlas_record_id before insert', async () => {
    const venueEqCalls: Array<{ column: string; value: string }> = [];
    const eventsInsertMock = vi.fn().mockReturnValue({
      select: () => ({
        single: async () => ({ data: { event_id: 'evt-new-1' }, error: null })
      })
    });
    const timelinesInsertMock = vi.fn().mockResolvedValue({ error: null });
    const membershipsUpsertMock = vi.fn().mockResolvedValue({ error: null });

    getSupabaseAdminClientMock.mockReturnValue({
      from: (table: string) => {
        if (table === 'venues') {
          return {
            select: () => ({
              eq: (column: string, value: string) => {
                venueEqCalls.push({ column, value });
                return {
                  limit: () => ({
                    maybeSingle: async () => ({ data: { venue_id: 'ven-1' }, error: null })
                  })
                };
              }
            })
          };
        }

        if (table === 'events') {
          return {
            insert: eventsInsertMock
          };
        }

        if (table === 'timelines') {
          return {
            insert: timelinesInsertMock
          };
        }

        if (table === 'memberships') {
          return {
            upsert: membershipsUpsertMock
          };
        }

        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: null, error: null })
            })
          })
        };
      }
    });

    isSupabaseConfiguredMock.mockReturnValue(true);
    generateTimelineFromVenueMock.mockResolvedValue({
      venue: {
        id: 'atlas-record-777',
        name: 'Atrium Center',
        city: 'Atlanta, GA',
        marketedCapacity: 360,
        comfortableRangeMin: 210,
        comfortableRangeMax: 290,
        notes: [],
        constraintsSummary: 'Imported constraints',
        sourceConfidence: 'vendor_verified'
      },
      venueIntelligence: {
        sourceConfidence: 'vendor_verified',
        topConstraints: [],
        sourceLinks: []
      },
      weddingDate: '2026-11-20T17:00:00.000Z',
      items: [
        {
          phaseCode: 'baraat',
          title: 'Baraat Staging',
          scheduledStartIso: '2026-11-20T15:00:00.000Z',
          scheduledEndIso: '2026-11-20T15:20:00.000Z',
          escalationHint: null,
          atlasPrompt: {
            venueId: 'atlas-record-777',
            venueName: 'Atrium Center',
            requiresVenueCheck: true,
            note: 'Imported constraints'
          }
        }
      ],
      warnings: [],
      templateSource: 'database'
    });

    const { POST } = await import('@/app/api/onboarding/timeline/approve/route');

    const request = new Request('http://localhost/api/onboarding/timeline/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        venueId: 'atlas-record-777',
        guestCount: 250,
        weddingDate: '2026-11-20',
        couplePrimaryName: 'Rani Patel',
        partnerName: 'Akshay Patel',
        eventLabel: 'Wedding Weekend'
      })
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.mode).toBe('supabase');
    expect(payload.sessionEventId).toBe('evt-new-1');
    expect(venueEqCalls[0]).toEqual({ column: 'atlas_record_id', value: 'atlas-record-777' });
    expect(eventsInsertMock).toHaveBeenCalledTimes(1);
    expect(timelinesInsertMock).toHaveBeenCalledTimes(1);
    expect(membershipsUpsertMock).toHaveBeenCalledTimes(1);
    expect(signSessionTokenMock).toHaveBeenCalledWith(
      expect.objectContaining({
        eventId: 'evt-new-1',
        role: 'planner'
      })
    );
    expect(response.headers.get('set-cookie') || '').toContain('revel_session=');
  });
});
