import { beforeEach, describe, expect, it, vi } from 'vitest';

const getSessionMock = vi.fn();

vi.mock('@/lib/session', () => ({
  getSession: getSessionMock
}));

describe('couple domain routes contract', () => {
  beforeEach(async () => {
    vi.resetModules();
    getSessionMock.mockReset();
    const { __resetCoupleDomainsForTests } = await import('@/lib/couple-domains');
    __resetCoupleDomainsForTests();
  });

  it('checklist route exposes locked music workflow until deposit is confirmed', async () => {
    getSessionMock.mockResolvedValue({
      userId: 'usr-couple-akshay-patel',
      email: 'akshay.rani1128@gmail.com',
      displayName: 'Akshay Patel',
      role: 'couple',
      organizationId: 'org-revel-ent',
      eventId: 'b3c9e1f2-4a7d-4e8b-a1c2-d5e6f7a8b9c0'
    });

    const { GET } = await import('@/app/api/events/checklist/route');
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.summary.depositConfirmed).toBe(false);
    expect(payload.checklist.find((item: { id: string }) => item.id === 'todo-music-questionnaire')).toMatchObject({
      title: 'Complete Music Questionnaire',
      locked: true
    });
  });

  it('payment confirmation unlocks music workflow and music submission propagates to planner and dj routes', async () => {
    getSessionMock.mockResolvedValue({
      userId: 'usr-couple-akshay-patel',
      email: 'akshay.rani1128@gmail.com',
      displayName: 'Akshay Patel',
      role: 'couple',
      organizationId: 'org-revel-ent',
      eventId: 'b3c9e1f2-4a7d-4e8b-a1c2-d5e6f7a8b9c0'
    });

    const { PATCH: patchPayment } = await import('@/app/api/events/payments/[milestoneId]/route');
    const paymentResponse = await patchPayment(new Request('http://localhost/api/events/payments/pay-deposit', { method: 'PATCH' }), {
      params: Promise.resolve({ milestoneId: 'pay-deposit' })
    });
    const paymentPayload = await paymentResponse.json();

    expect(paymentResponse.status).toBe(200);
    expect(paymentPayload.summary.depositConfirmed).toBe(true);

    const { POST: submitMusic } = await import('@/app/api/events/music/route');
    const submitResponse = await submitMusic(
      new Request('http://localhost/api/events/music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          genreMix: {
            bhangraNewer: 20,
            bhangraOldSchool: 10,
            bollywoodNewer: 20,
            bollywoodOlder: 15,
            oldSchoolHipHop: 10,
            currentHipHopTop40: 10,
            house: 5,
            latin: 5,
            other: 5
          },
          otherGenres: 'Afrobeats edits',
          danceOffNotes: 'Family vs family dance-off in the middle of the open dance set.',
          additionalNotes: 'Late reception push after dinner.'
        })
      })
    );
    const submitPayload = await submitResponse.json();

    expect(submitResponse.status).toBe(201);
    expect(submitPayload.music.status).toBe('completed');

    getSessionMock.mockResolvedValue({
      userId: 'usr-planner-amtopm',
      email: 'events@amtopmplanners.com',
      displayName: 'AM to PM planners',
      role: 'planner',
      organizationId: 'org-revel-ent',
      eventId: 'b3c9e1f2-4a7d-4e8b-a1c2-d5e6f7a8b9c0'
    });

    const { GET: plannerMusicGet } = await import('@/app/api/events/music/route');
    const plannerMusicResponse = await plannerMusicGet();
    const plannerMusicPayload = await plannerMusicResponse.json();

    expect(plannerMusicResponse.status).toBe(200);
    expect(plannerMusicPayload.domainScope).toEqual({ access: 'read_write', projection: 'full' });
    expect(plannerMusicPayload.music.profile.plannerStatus).toBe('Complete');

    const { GET: approvalsGet } = await import('@/app/api/events/approvals/route');
    const approvalsResponse = await approvalsGet();
    const approvalsPayload = await approvalsResponse.json();

    expect(approvalsResponse.status).toBe(200);
    expect(approvalsPayload.summary.musicStatus).toBe('complete');

    getSessionMock.mockResolvedValue({
      userId: 'usr-dj-rani-akshay',
      email: 'djmc.akshayrani@example.com',
      displayName: 'Signature DJ + MC',
      role: 'dj_mc',
      organizationId: 'org-revel-ent',
      eventId: 'b3c9e1f2-4a7d-4e8b-a1c2-d5e6f7a8b9c0'
    });

    const { GET: djMusicGet } = await import('@/app/api/events/music/route');
    const djMusicResponse = await djMusicGet();
    const djMusicPayload = await djMusicResponse.json();

    expect(djMusicResponse.status).toBe(200);
    expect(djMusicPayload.domainScope).toEqual({ access: 'read_write', projection: 'operations' });
    expect(djMusicPayload.music.profile.otherNotes).toContain('Afrobeats edits');
  });

  it('music route rejects questionnaire totals that do not sum to 100', async () => {
    getSessionMock.mockResolvedValue({
      userId: 'usr-couple-akshay-patel',
      email: 'akshay.rani1128@gmail.com',
      displayName: 'Akshay Patel',
      role: 'couple',
      organizationId: 'org-revel-ent',
      eventId: 'b3c9e1f2-4a7d-4e8b-a1c2-d5e6f7a8b9c0'
    });

    const { PATCH: patchPayment } = await import('@/app/api/events/payments/[milestoneId]/route');
    await patchPayment(new Request('http://localhost/api/events/payments/pay-deposit', { method: 'PATCH' }), {
      params: Promise.resolve({ milestoneId: 'pay-deposit' })
    });

    const { POST } = await import('@/app/api/events/music/route');
    const response = await POST(
      new Request('http://localhost/api/events/music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          genreMix: {
            bhangraNewer: 10,
            bhangraOldSchool: 10,
            bollywoodNewer: 10,
            bollywoodOlder: 10,
            oldSchoolHipHop: 10,
            currentHipHopTop40: 10,
            house: 10,
            latin: 10,
            other: 15
          },
          otherGenres: '',
          danceOffNotes: '',
          additionalNotes: ''
        })
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'genre_mix_total_invalid' });
  });
});