import { beforeEach, describe, expect, it, vi } from 'vitest';

const getSessionMock = vi.fn();

vi.mock('@/lib/session', () => ({
  getSession: getSessionMock
}));

describe('task write and vendor assignment contracts', () => {
  beforeEach(() => {
    vi.resetModules();
    getSessionMock.mockReset();
  });

  it('assigned vendor can update own task status', async () => {
    getSessionMock.mockResolvedValue({
      userId: 'usr-vendor-dreamcatchers',
      email: 'dcevents.us@gmail.com',
      displayName: 'The Dreamcatchers Events LLC',
      role: 'vendor',
      organizationId: 'org-revel-ent',
      eventId: 'b3c9e1f2-4a7d-4e8b-a1c2-d5e6f7a8b9c0'
    });

    const { PATCH } = await import('@/app/api/events/tasks/[taskId]/route');
    const response = await PATCH(
      new Request('http://localhost/api/events/tasks/task', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'acknowledged', notes: 'Dock route reviewed.' })
      }),
      { params: Promise.resolve({ taskId: 'b3c9e1f2-4a7d-4e8b-a1c2-d5e6f7a8b9c0:decor-loadin' }) }
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.mode).toBe('simulation');
    expect(payload.updatedTask.status).toBe('acknowledged');
    expect(payload.relatedTimeline[0].id).toBe('step-loadin');
  });

  it('vendor cannot update unassigned task', async () => {
    getSessionMock.mockResolvedValue({
      userId: 'usr-vendor-dreamcatchers',
      email: 'dcevents.us@gmail.com',
      displayName: 'The Dreamcatchers Events LLC',
      role: 'vendor',
      organizationId: 'org-revel-ent',
      eventId: 'b3c9e1f2-4a7d-4e8b-a1c2-d5e6f7a8b9c0'
    });

    const { PATCH } = await import('@/app/api/events/tasks/[taskId]/route');
    const response = await PATCH(
      new Request('http://localhost/api/events/tasks/task', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' })
      }),
      { params: Promise.resolve({ taskId: 'b3c9e1f2-4a7d-4e8b-a1c2-d5e6f7a8b9c0:planner-ceremony-flow' }) }
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: 'Forbidden' });
  });

  it('planner gets full vendor roster with assignment counts', async () => {
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
    expect(payload.roster.some((entry: { userId: string; assignmentCount: number }) => entry.userId === 'usr-vendor-dreamcatchers' && entry.assignmentCount > 0)).toBe(true);
  });

  it('vendor roster projection returns only self for vendor role', async () => {
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
    expect(payload.roster).toHaveLength(1);
    expect(payload.roster[0].userId).toBe('usr-vendor-dreamcatchers');
    expect(payload.roster[0].linkedTimeline.every((slice: { id: string }) => payload.roster[0].taskIds.length > 0)).toBe(true);
  });
});