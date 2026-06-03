import { beforeEach, describe, expect, it, vi } from 'vitest';

const getSessionMock = vi.fn();
const getSupabaseAdminClientMock = vi.fn();

vi.mock('@/lib/session', () => ({
  getSession: getSessionMock
}));

vi.mock('@/lib/supabase-server', () => ({
  getSupabaseAdminClient: getSupabaseAdminClientMock
}));

describe('timeline foundation contract', () => {
  beforeEach(() => {
    vi.resetModules();
    getSessionMock.mockReset();
    getSupabaseAdminClientMock.mockReset();
  });

  it('returns role-scoped timeline metadata for dj_mc context', async () => {
    getSessionMock.mockResolvedValue({
      userId: 'usr-dj-1',
      email: 'djmc@example.com',
      displayName: 'DJ MC Team',
      role: 'dj_mc',
      organizationId: 'org-revel-ent',
      eventId: 'evt-akshay-rani'
    });
    getSupabaseAdminClientMock.mockReturnValue(null);

    const { GET } = await import('@/app/api/events/timeline/route');
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.role).toBe('dj_mc');
    expect(payload.domainScope).toEqual({ access: 'read', projection: 'operations' });
    expect(Array.isArray(payload.timeline)).toBe(true);
    expect(payload.timeline.length).toBeGreaterThan(0);
    expect(payload.timeline.every((item: { readOnly: boolean }) => item.readOnly)).toBe(true);
  });

  it('returns owner-filtered read-only projection for couple context', async () => {
    getSessionMock.mockResolvedValue({
      userId: 'usr-couple-1',
      email: 'couple@example.com',
      displayName: 'Couple',
      role: 'couple',
      organizationId: 'org-revel-ent',
      eventId: 'evt-akshay-rani'
    });
    getSupabaseAdminClientMock.mockReturnValue(null);

    const { GET } = await import('@/app/api/events/timeline/route');
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.domainScope).toEqual({ access: 'read', projection: 'owner_filtered' });
    expect(payload.timeline.every((item: { readOnly: boolean }) => item.readOnly)).toBe(true);
    expect(payload.timeline.every((item: { visibility: string }) => item.visibility !== 'operations')).toBe(true);
  });

  it('returns 400 when event context is missing', async () => {
    getSessionMock.mockResolvedValue({
      userId: 'usr-admin-1',
      email: 'admin@example.com',
      displayName: 'Admin',
      role: 'admin',
      organizationId: 'org-revel-ent',
      eventId: null
    });

    const { GET } = await import('@/app/api/events/timeline/route');
    const response = await GET();

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Missing event context' });
  });

  it('planner patch contract returns recalculated simulation payload', async () => {
    getSessionMock.mockResolvedValue({
      userId: 'usr-planner-1',
      email: 'planner@example.com',
      displayName: 'Planner',
      role: 'planner',
      organizationId: 'org-revel-ent',
      eventId: 'evt-akshay-rani'
    });
    getSupabaseAdminClientMock.mockReturnValue(null);

    const { PATCH } = await import('@/app/api/events/timeline/[itemId]/route');
    const response = await PATCH(
      new Request('http://localhost/api/events/timeline/step-baraat', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduledStartIso: '2026-06-03T18:00:00.000Z',
          scheduledEndIso: '2026-06-03T18:30:00.000Z',
          notes: 'Shifted for family arrival buffer.'
        })
      }),
      { params: Promise.resolve({ itemId: 'step-baraat' }) }
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.mode).toBe('simulation');
    expect(payload.updated.domainScope).toEqual({ access: 'read_write', projection: 'full' });
    expect(Array.isArray(payload.updated.timeline)).toBe(true);
    expect(Array.isArray(payload.adjustments)).toBe(true);
  });

  it('couple patch contract is forbidden', async () => {
    getSessionMock.mockResolvedValue({
      userId: 'usr-couple-1',
      email: 'couple@example.com',
      displayName: 'Couple',
      role: 'couple',
      organizationId: 'org-revel-ent',
      eventId: 'evt-akshay-rani'
    });

    const { PATCH } = await import('@/app/api/events/timeline/[itemId]/route');
    const response = await PATCH(
      new Request('http://localhost/api/events/timeline/step-baraat', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Updated title' })
      }),
      { params: Promise.resolve({ itemId: 'step-baraat' }) }
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: 'Forbidden' });
  });

  it('planner recalculate contract returns conflicts and adjustments', async () => {
    getSessionMock.mockResolvedValue({
      userId: 'usr-admin-1',
      email: 'admin@example.com',
      displayName: 'Admin',
      role: 'admin',
      organizationId: 'org-revel-ent',
      eventId: 'evt-akshay-rani'
    });
    getSupabaseAdminClientMock.mockReturnValue(null);

    const { POST } = await import('@/app/api/events/timeline/recalculate/route');
    const response = await POST();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.mode).toBe('simulation');
    expect(Array.isArray(payload.items)).toBe(true);
    expect(Array.isArray(payload.conflicts)).toBe(true);
    expect(Array.isArray(payload.adjustments)).toBe(true);
  });
});