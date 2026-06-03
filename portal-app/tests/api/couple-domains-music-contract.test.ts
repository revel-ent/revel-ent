import { beforeEach, describe, expect, it } from 'vitest';

import {
  __resetCoupleDomainsForTests,
  getApprovalProjectionForActor,
  getChecklistState,
  getMusicProjectionForActor,
  markPaymentMilestoneComplete,
  submitMusicQuestionnaire
} from '@/lib/couple-domains';

const EVENT_ID = 'b3c9e1f2-4a7d-4e8b-a1c2-d5e6f7a8b9c0';

describe('couple domains music contract', () => {
  beforeEach(() => {
    __resetCoupleDomainsForTests();
  });

  it('keeps music workflow locked until deposit confirmation and unlocks the todo after deposit', () => {
    const before = getChecklistState(EVENT_ID);
    const lockedTodo = before.checklist.find((item) => item.id === 'todo-music-questionnaire');

    expect(before.summary.depositConfirmed).toBe(false);
    expect(lockedTodo).toMatchObject({
      title: 'Complete Music Questionnaire',
      locked: true,
      actionLabel: null
    });

    markPaymentMilestoneComplete(EVENT_ID, 'pay-deposit', '2026-06-03');

    const after = getChecklistState(EVENT_ID);
    const unlockedTodo = after.checklist.find((item) => item.id === 'todo-music-questionnaire');
    expect(after.summary.depositConfirmed).toBe(true);
    expect(unlockedTodo).toMatchObject({
      locked: false,
      actionLabel: 'Complete Music Questionnaire',
      badgeLabel: 'Action Required'
    });
  });

  it('submits structured music data, generates profile, and marks checklist complete', () => {
    markPaymentMilestoneComplete(EVENT_ID, 'pay-deposit', '2026-06-03');

    const submitted = submitMusicQuestionnaire(EVENT_ID, {
      genreMix: {
        bhangraNewer: 20,
        bhangraOldSchool: 10,
        bollywoodNewer: 20,
        bollywoodOlder: 15,
        oldSchoolHipHop: 10,
        currentHipHopTop40: 15,
        house: 5,
        latin: 3,
        other: 2
      },
      otherGenres: 'Afrobeats and Punjabi fusion edits',
      danceOffNotes: 'Bride side vs groom side with open participation after the first round.',
      additionalNotes: 'Keep the aunties engaged early, then open up for cousins after dinner.'
    });

    expect(submitted.status).toBe('completed');
    expect(submitted.questionnaire?.genreMix.bhangraNewer).toBe(20);
    expect(submitted.profile?.title).toBe('Music Experience Profile');
    expect(submitted.profile?.otherNotes).toContain('Afrobeats');

    const checklist = getChecklistState(EVENT_ID);
    expect(checklist.summary.musicStatus).toBe('completed');
    expect(checklist.checklist.find((item) => item.id === 'todo-music-questionnaire')).toMatchObject({
      status: 'completed',
      actionLabel: 'View Music Profile'
    });
  });

  it('projects completed music profile into planner and dj_mc roles automatically', () => {
    markPaymentMilestoneComplete(EVENT_ID, 'pay-deposit', '2026-06-03');
    submitMusicQuestionnaire(EVENT_ID, {
      genreMix: {
        bhangraNewer: 25,
        bhangraOldSchool: 10,
        bollywoodNewer: 15,
        bollywoodOlder: 10,
        oldSchoolHipHop: 10,
        currentHipHopTop40: 10,
        house: 5,
        latin: 5,
        other: 10
      },
      otherGenres: 'Open-format club edits after the cultural block.',
      danceOffNotes: 'Open circle if the room is ready for it.',
      additionalNotes: 'Keep transitions clean between cultural sets and open format.'
    });

    const plannerProjection = getMusicProjectionForActor({ eventId: EVENT_ID, actorRole: 'planner' });
    const djProjection = getMusicProjectionForActor({ eventId: EVENT_ID, actorRole: 'dj_mc' });
    const approvalsProjection = getApprovalProjectionForActor({ eventId: EVENT_ID, actorRole: 'planner' });

    expect(plannerProjection.domainScope).toEqual({ access: 'read_write', projection: 'full' });
    expect(plannerProjection.music?.status).toBe('completed');
    expect(plannerProjection.music?.profile?.plannerStatus).toBe('Complete');

    expect(djProjection.domainScope).toEqual({ access: 'read_write', projection: 'operations' });
    expect(djProjection.music?.profile?.otherNotes).toContain('Open-format club edits');
    expect(djProjection.music?.profile?.danceOffPlan).toContain('Open circle');

    expect(approvalsProjection.domainScope).toEqual({ access: 'read_write', projection: 'full' });
    expect(approvalsProjection.summary.musicStatus).toBe('complete');
  });
});