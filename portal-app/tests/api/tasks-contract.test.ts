import { beforeEach, describe, expect, it, vi } from 'vitest';

const getSessionMock = vi.fn();

vi.mock('@/lib/session', () => ({
  getSession: getSessionMock
}));

describe('tasks contracts', () => {
  beforeEach(() => {
    vi.resetModules();
    getSessionMock.mockReset();
  });

  it('planner gets full task projection with timeline links', async () => {
    getSessionMock.mockResolvedValue({
      userId: 'usr-planner-amtopm',
      email: 'events@amtopmplanners.com',
      displayName: 'AM to PM planners',
      role: 'planner',
      organizationId: 'org-revel-ent',
      eventId: 'b3c9e1f2-4a7d-4e8b-a1c2-d5e6f7a8b9c0'
    });

    const { GET } = await import('@/app/api/events/tasks/route');
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.domainScope).toEqual({ access: 'read_write', projection: 'full' });
    expect(payload.permissions).toEqual({ canCreate: true, canEditAny: true });
    expect(payload.tasks.length).toBeGreaterThan(0);
    expect(payload.tasks.every((task: { linkedTimeline: unknown[] }) => task.linkedTimeline.length > 0)).toBe(true);
  });

  it('vendor gets only assigned tasks and related timeline slices', async () => {
    getSessionMock.mockResolvedValue({
      userId: 'usr-vendor-dreamcatchers',
      email: 'dcevents.us@gmail.com',
      displayName: 'The Dreamcatchers Events LLC',
      role: 'vendor',
      organizationId: 'org-revel-ent',
      eventId: 'b3c9e1f2-4a7d-4e8b-a1c2-d5e6f7a8b9c0'
    });

    const { GET } = await import('@/app/api/events/tasks/route');
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.domainScope).toEqual({ access: 'read_write', projection: 'assigned' });
    expect(payload.tasks.length).toBeGreaterThan(0);
    expect(payload.tasks.every((task: { assignee: { userId: string } }) => task.assignee.userId === 'usr-vendor-dreamcatchers')).toBe(true);
    expect(payload.relatedTimeline.every((slice: { id: string }) => payload.summary.linkedTimelineIds.includes(slice.id))).toBe(true);
  });

  it('couple sees only owner-filtered client-visible tasks', async () => {
    getSessionMock.mockResolvedValue({
      userId: 'usr-couple-akshay-patel',
      email: 'akshay.rani1128@gmail.com',
      displayName: 'Akshay Patel',
      role: 'couple',
      organizationId: 'org-revel-ent',
      eventId: 'b3c9e1f2-4a7d-4e8b-a1c2-d5e6f7a8b9c0'
    });

    const { GET } = await import('@/app/api/events/tasks/route');
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.domainScope).toEqual({ access: 'read', projection: 'owner_filtered' });
    expect(payload.permissions).toEqual({ canCreate: false, canEditAny: false });
    expect(payload.tasks.every((task: { title: string }) => !task.title.includes('Decor Load-In'))).toBe(true);
  });

  it('planner can create timeline-linked task preview', async () => {
    getSessionMock.mockResolvedValue({
      userId: 'usr-planner-amtopm',
      email: 'events@amtopmplanners.com',
      displayName: 'AM to PM planners',
      role: 'planner',
      organizationId: 'org-revel-ent',
      eventId: 'b3c9e1f2-4a7d-4e8b-a1c2-d5e6f7a8b9c0'
    });

    const { POST } = await import('@/app/api/events/tasks/route');
    const response = await POST(
      new Request('http://localhost/api/events/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Decorator Final Walkthrough',
          description: 'Confirm sweetheart stage placement and aisle clearance.',
          priority: 'high',
          assigneeUserId: 'usr-vendor-dreamcatchers',
          linkedTimelineItemIds: ['step-loadin'],
          clientVisible: false
        })
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload.mode).toBe('simulation');
    expect(payload.createdTask.linkedTimelineItemIds).toEqual(['step-loadin']);
    expect(payload.relatedTimeline[0].id).toBe('step-loadin');
  });

  it('couple cannot create canonical tasks', async () => {
    getSessionMock.mockResolvedValue({
      userId: 'usr-couple-akshay-patel',
      email: 'akshay.rani1128@gmail.com',
      displayName: 'Akshay Patel',
      role: 'couple',
      organizationId: 'org-revel-ent',
      eventId: 'b3c9e1f2-4a7d-4e8b-a1c2-d5e6f7a8b9c0'
    });

    const { POST } = await import('@/app/api/events/tasks/route');
    const response = await POST(
      new Request('http://localhost/api/events/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Nope',
          description: 'Should fail',
          assigneeUserId: 'usr-vendor-dreamcatchers',
          linkedTimelineItemIds: ['step-loadin']
        })
      })
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: 'Forbidden' });
  });
});