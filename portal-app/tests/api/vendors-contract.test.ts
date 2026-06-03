import { beforeEach, describe, expect, it, vi } from 'vitest';

const getSessionMock = vi.fn();

vi.mock('@/lib/session', () => ({
  getSession: getSessionMock
}));

describe('vendors contract', () => {
  beforeEach(() => {
    vi.resetModules();
    getSessionMock.mockReset();
  });

  it('returns planner vendor roster with assignment counts and related timeline slices', async () => {
    getSessionMock.mockResolvedValue({
      userId: 'usr-planner-amtopm',
      email: 'events@amtopmplanners.com',
      displayName: 'AM to PM planners',
      role: 'planner',
      organizationId: 'org-revel-ent',
      eventId: 'b3c9e1f2-4a7d-4e8b-a1c2-d5e6f7a8b9c0'
    });

    const { GET } = await import('@/app/api/events/vendors/route');
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.domainScope).toEqual({ access: 'read_write', projection: 'full' });
    expect(payload.permissions).toEqual({ canManageAssignments: true });
    expect(payload.roster.length).toBeGreaterThan(0);
    expect(payload.roster.every((entry: { linkedTimeline: unknown[] }) => Array.isArray(entry.linkedTimeline))).toBe(true);
    expect(payload.roster.some((entry: { userId: string; assignmentCount: number }) => entry.userId === 'usr-vendor-dreamcatchers' && entry.assignmentCount > 0)).toBe(true);
  });

  it('returns vendor-scoped roster narrowed to assigned vendor', async () => {
    getSessionMock.mockResolvedValue({
      userId: 'usr-vendor-dreamcatchers',
      email: 'dcevents.us@gmail.com',
      displayName: 'The Dreamcatchers Events LLC',
      role: 'vendor',
      organizationId: 'org-revel-ent',
      eventId: 'b3c9e1f2-4a7d-4e8b-a1c2-d5e6f7a8b9c0'
    });

    const { GET } = await import('@/app/api/events/vendors/route');
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.domainScope).toEqual({ access: 'read', projection: 'assigned' });
    expect(payload.permissions).toEqual({ canManageAssignments: false });
    expect(payload.roster).toHaveLength(1);
    expect(payload.roster[0].userId).toBe('usr-vendor-dreamcatchers');
    expect(payload.roster[0].linkedTimeline.length).toBeGreaterThan(0);
  });
});