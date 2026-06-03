import { describe, expect, it } from 'vitest';

import {
  getCanonicalTaskBundle,
  getTaskProjectionForActor,
  getVendorRosterProjectionForActor,
  patchCanonicalTaskForActor,
  type TaskStatus
} from '@/lib/canonical-tasks';

const EVENT_ID = 'b3c9e1f2-4a7d-4e8b-a1c2-d5e6f7a8b9c0';

describe('task domain foundation contract', () => {
  it('models timeline-to-task linkage and owner-to-assignee separation for decorator flow', () => {
    const bundle = getCanonicalTaskBundle(EVENT_ID, 'usr-planner-amtopm', 'planner');
    const decorTask = bundle.tasks.find((task) => task.id === `${EVENT_ID}:decor-loadin`);
    const assignment = bundle.assignments.find((item) => item.taskId === `${EVENT_ID}:decor-loadin`);
    const timelineSlice = bundle.timeline.find((item) => item.id === 'step-loadin');

    expect(decorTask).toBeTruthy();
    expect(assignment).toBeTruthy();
    expect(timelineSlice).toBeTruthy();

    expect(decorTask).toMatchObject({
      ownerRole: 'planner',
      status: 'pending',
      linkedTimelineItemIds: ['step-loadin']
    });
    expect(assignment).toMatchObject({
      assigneeUserId: 'usr-vendor-dreamcatchers',
      assigneeRole: 'vendor',
      vendorProfile: 'decorator'
    });
    expect(timelineSlice).toMatchObject({
      title: 'Vendor Load-In and Sound Check',
      phase: 'load_in'
    });
  });

  it('supports the defined task lifecycle states on assigned vendor updates', () => {
    const statuses: TaskStatus[] = ['acknowledged', 'in_progress', 'blocked', 'completed'];

    for (const status of statuses) {
      const result = patchCanonicalTaskForActor({
        eventId: EVENT_ID,
        actorUserId: 'usr-vendor-dreamcatchers',
        actorRole: 'vendor',
        taskId: `${EVENT_ID}:decor-loadin`,
        patch: {
          status,
          notes: `Status moved to ${status}`
        }
      });

      expect(result.forbidden).toBe(false);
      expect(result.task).toMatchObject({
        id: `${EVENT_ID}:decor-loadin`,
        status,
        notes: `Status moved to ${status}`
      });
      expect(result.relatedTimeline.map((item) => item.id)).toEqual(['step-loadin']);
    }
  });

  it('projects decorator assignment only to the assigned vendor with the linked timeline slice', () => {
    const vendorProjection = getTaskProjectionForActor({
      eventId: EVENT_ID,
      actorUserId: 'usr-vendor-dreamcatchers',
      actorRole: 'vendor'
    });

    expect(vendorProjection.domainScope).toEqual({ access: 'read_write', projection: 'assigned' });
    expect(vendorProjection.tasks).toHaveLength(1);
    expect(vendorProjection.tasks[0]).toMatchObject({
      id: `${EVENT_ID}:decor-loadin`,
      ownerRole: 'planner',
      assignee: {
        userId: 'usr-vendor-dreamcatchers',
        role: 'vendor',
        profile: 'decorator'
      },
      canUpdateStatus: true,
      readOnly: false
    });
    expect(vendorProjection.tasks[0].linkedTimeline.map((item) => item.id)).toEqual(['step-loadin']);
    expect(vendorProjection.relatedTimeline.map((item) => item.id)).toEqual(['step-loadin']);
  });

  it('keeps decorator task hidden from couple while exposing it to planner and production operations', () => {
    const coupleProjection = getTaskProjectionForActor({
      eventId: EVENT_ID,
      actorUserId: 'usr-couple-akshay-patel',
      actorRole: 'couple'
    });
    const plannerProjection = getTaskProjectionForActor({
      eventId: EVENT_ID,
      actorUserId: 'usr-planner-amtopm',
      actorRole: 'planner'
    });
    const productionProjection = getTaskProjectionForActor({
      eventId: EVENT_ID,
      actorUserId: 'usr-production-akshay-rani',
      actorRole: 'production'
    });

    expect(coupleProjection.tasks.some((task) => task.id === `${EVENT_ID}:decor-loadin`)).toBe(false);
    expect(plannerProjection.tasks.some((task) => task.id === `${EVENT_ID}:decor-loadin`)).toBe(true);
    expect(productionProjection.tasks.some((task) => task.id === `${EVENT_ID}:decor-loadin`)).toBe(true);
  });

  it('returns venue-scoped task windows and vendor roster slices for the assigned roles', () => {
    const venueTaskProjection = getTaskProjectionForActor({
      eventId: EVENT_ID,
      actorUserId: 'usr-planner-amtopm',
      actorRole: 'venue_coordinator'
    });
    const vendorRosterProjection = getVendorRosterProjectionForActor({
      eventId: EVENT_ID,
      actorUserId: 'usr-vendor-dreamcatchers',
      actorRole: 'vendor'
    });

    expect(venueTaskProjection.domainScope).toEqual({ access: 'read', projection: 'venue' });
    expect(venueTaskProjection.tasks).toHaveLength(1);
    expect(venueTaskProjection.tasks[0]).toMatchObject({
      id: `${EVENT_ID}:venue-cocktail-reset`,
      assignee: {
        role: 'venue_coordinator',
        profile: 'venue'
      }
    });
    expect(venueTaskProjection.tasks[0].linkedTimeline.map((item) => item.id)).toEqual(['step-cocktail']);

    expect(vendorRosterProjection.domainScope).toEqual({ access: 'read', projection: 'assigned' });
    expect(vendorRosterProjection.roster).toHaveLength(1);
    expect(vendorRosterProjection.roster[0]).toMatchObject({
      userId: 'usr-vendor-dreamcatchers',
      vendorProfile: 'decorator',
      assignmentCount: 1,
      taskIds: [`${EVENT_ID}:decor-loadin`]
    });
    expect(vendorRosterProjection.roster[0].linkedTimeline.map((item) => item.id)).toEqual(['step-loadin']);
  });
});