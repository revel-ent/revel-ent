import { describe, expect, it, vi, beforeEach } from 'vitest';

const getSessionMock = vi.fn();
const getSupabaseAdminClientMock = vi.fn();

vi.mock('@/lib/session', () => ({
  getSession: getSessionMock
}));

vi.mock('@/lib/supabase-server', () => ({
  getSupabaseAdminClient: getSupabaseAdminClientMock
}));

describe('events routes', () => {
  beforeEach(() => {
    getSessionMock.mockReset();
    getSupabaseAdminClientMock.mockReset();
    getSupabaseAdminClientMock.mockReturnValue(null);
  });

  it('timeline route returns 401 when unauthenticated', async () => {
    getSessionMock.mockResolvedValue(null);
    const { GET } = await import('@/app/api/events/timeline/route');

    const response = await GET();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' });
  });

  it('timeline route returns timeline for valid session', async () => {
    getSessionMock.mockResolvedValue({
      userId: 'usr-planner-maulin',
      email: 'maulin@revel-ent.com',
      displayName: 'MC Maulin',
      role: 'planner',
      eventId: 'evt-revel-2026-11-15'
    });
    const { GET } = await import('@/app/api/events/timeline/route');

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.eventId).toBe('evt-revel-2026-11-15');
    expect(payload.role).toBe('planner');
    expect(Array.isArray(payload.timeline)).toBe(true);
    expect(payload.timeline.length).toBeGreaterThan(0);
    expect(payload.timeline.every((item: { eventId: string }) => item.eventId === 'evt-revel-2026-11-15')).toBe(true);
  });

  it('timeline route scopes output by role and event id', async () => {
    const { GET } = await import('@/app/api/events/timeline/route');

    getSessionMock.mockResolvedValue({
      userId: 'usr-vendor-heckno',
      email: 'heckno@revel-ent.com',
      displayName: 'DJ Heckno',
      role: 'vendor',
      eventId: 'evt-event-vendor'
    });
    const vendorResponse = await GET();
    const vendorPayload = await vendorResponse.json();

    getSessionMock.mockResolvedValue({
      userId: 'usr-guest-family',
      email: 'guestfamily@example.com',
      displayName: 'Family Guest',
      role: 'guest',
      eventId: 'evt-event-guest'
    });
    const guestResponse = await GET();
    const guestPayload = await guestResponse.json();

    expect(vendorResponse.status).toBe(200);
    expect(guestResponse.status).toBe(200);
    expect(vendorPayload.eventId).toBe('evt-event-vendor');
    expect(guestPayload.eventId).toBe('evt-event-guest');
    expect(vendorPayload.timeline.every((item: { eventId: string }) => item.eventId === 'evt-event-vendor')).toBe(
      true
    );
    expect(guestPayload.timeline.every((item: { eventId: string }) => item.eventId === 'evt-event-guest')).toBe(true);
  });

  it('live route returns 400 when event context missing', async () => {
    getSessionMock.mockResolvedValue({
      userId: 'usr-planner-maulin',
      email: 'maulin@revel-ent.com',
      displayName: 'MC Maulin',
      role: 'planner',
      eventId: null
    });
    const { GET } = await import('@/app/api/events/live/route');

    const response = await GET();

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Missing event context' });
  });

  it('live update route blocks guest role', async () => {
    getSessionMock.mockResolvedValue({
      userId: 'usr-guest-family',
      email: 'guestfamily@example.com',
      displayName: 'Family Guest',
      role: 'guest',
      eventId: 'evt-revel-2026-11-15'
    });
    const { POST } = await import('@/app/api/events/live/update/route');

    const request = new Request('http://localhost/api/events/live/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stepId: 'step-baraat',
        status: 'delayed',
        note: 'Traffic'
      })
    });

    const response = await POST(request);

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: 'Forbidden' });
  });

  it('live update route returns simulation payload for delegate coordinator', async () => {
    getSessionMock.mockResolvedValue({
      userId: 'usr-delegate-priya',
      email: 'priya@example.com',
      displayName: 'Priya (Family Coordinator)',
      role: 'delegate_coordinator',
      eventId: 'evt-revel-2026-11-15'
    });
    const { POST } = await import('@/app/api/events/live/update/route');

    const request = new Request('http://localhost/api/events/live/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stepId: 'step-baraat',
        status: 'delayed',
        note: 'Family arrival delay'
      })
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.mode).toBe('simulation');
    expect(payload.role).toBe('delegate_coordinator');
    expect(payload.update.stepId).toBe('step-baraat');
    expect(payload.update.status).toBe('delayed');
  });

  it('live update blocks bounded roles outside delegate window in persisted mode', async () => {
    getSessionMock.mockResolvedValue({
      userId: 'usr-delegate-priya',
      email: 'priya@example.com',
      displayName: 'Priya (Family Coordinator)',
      role: 'delegate_coordinator',
      eventId: '0f1d7d0a-7c8f-4f5f-9c89-9c8b2f3e1a11'
    });

    getSupabaseAdminClientMock.mockReturnValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: {
                  timeline_id: '8d8ab7a4-8df1-4c73-8851-f7f9f66e98fb',
                  scheduled_start: '2000-01-01T10:00:00.000Z',
                  scheduled_end: '2000-01-01T10:30:00.000Z',
                  can_delegate_update: true
                },
                error: null
              })
            })
          })
        })
      })
    });

    const { POST } = await import('@/app/api/events/live/update/route');

    const request = new Request('http://localhost/api/events/live/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stepId: '8d8ab7a4-8df1-4c73-8851-f7f9f66e98fb',
        status: 'delayed',
        note: 'Outside day-of window'
      })
    });

    const response = await POST(request);

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: 'update_outside_delegate_window' });
  });

  it('live update allows venue coordinator during bounded window in simulation mode', async () => {
    getSessionMock.mockResolvedValue({
      userId: 'usr-venue-anita',
      email: 'anita.venue@example.com',
      displayName: 'Anita (Venue Coordinator)',
      role: 'venue_coordinator',
      eventId: 'evt-revel-2026-11-15'
    });
    const { POST } = await import('@/app/api/events/live/update/route');

    const request = new Request('http://localhost/api/events/live/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stepId: 'step-baraat',
        status: 'delayed',
        note: 'Venue turnaround delay'
      })
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.role).toBe('venue_coordinator');
    expect(payload.update.stepId).toBe('step-baraat');
  });
});
