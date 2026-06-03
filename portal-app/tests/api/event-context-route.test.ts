import { beforeEach, describe, expect, it, vi } from 'vitest';

const getSessionMock = vi.fn();

vi.mock('@/lib/session', () => ({
  getSession: getSessionMock
}));

describe('event context route', () => {
  beforeEach(() => {
    vi.resetModules();
    getSessionMock.mockReset();
  });

  it('returns 401 when session is missing', async () => {
    getSessionMock.mockResolvedValue(null);
    const { GET } = await import('@/app/api/events/context/route');

    const response = await GET();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' });
  });

  it('returns normalized context and role-scoped domains for couple role', async () => {
    getSessionMock.mockResolvedValue({
      userId: 'usr-couple-akshay',
      email: 'akshay.rani1128@gmail.com',
      displayName: 'Akshay Patel',
      role: 'couple',
      organizationId: 'org-revel-ent',
      eventId: 'evt-akshay-rani'
    });

    const { GET } = await import('@/app/api/events/context/route');
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.actor).toEqual({
      userId: 'usr-couple-akshay',
      email: 'akshay.rani1128@gmail.com',
      displayName: 'Akshay Patel',
      role: 'couple',
      workspaceSurface: 'couple',
      roleContextLocked: true
    });
    expect(payload.event).toEqual({
      organizationId: 'org-revel-ent',
      eventId: 'evt-akshay-rani'
    });
    expect(payload.domainScopes.timeline).toEqual({ access: 'read', projection: 'owner_filtered' });
    expect(payload.domainScopes.music).toEqual({ access: 'read_write', projection: 'owner_filtered' });
    expect(payload.domainScopes.equipment).toEqual({ access: 'none', projection: 'none' });
  });

  it('returns production workspace surface and operations scopes', async () => {
    getSessionMock.mockResolvedValue({
      userId: 'usr-prod-1',
      email: 'production@example.com',
      displayName: 'Production Lead',
      role: 'production',
      organizationId: 'org-revel-ent',
      eventId: 'evt-akshay-rani'
    });

    const { GET } = await import('@/app/api/events/context/route');
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.actor.workspaceSurface).toBe('production');
    expect(payload.domainScopes.venue_intelligence).toEqual({ access: 'read_write', projection: 'operations' });
    expect(payload.domainScopes.run_of_show).toEqual({ access: 'read_write', projection: 'operations' });
  });
});