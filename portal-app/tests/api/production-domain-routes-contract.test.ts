import { beforeEach, describe, expect, it, vi } from 'vitest';

const getSessionMock = vi.fn();

vi.mock('@/lib/session', () => ({
  getSession: getSessionMock
}));

describe('production domain routes contract', () => {
  beforeEach(async () => {
    vi.resetModules();
    getSessionMock.mockReset();
    const { __resetProductionDomainsForTests } = await import('@/lib/production-domains');
    __resetProductionDomainsForTests();
  });

  it('returns venue intelligence projection for production role', async () => {
    getSessionMock.mockResolvedValue({
      userId: 'usr-production-akshay-rani',
      email: 'production.akshayrani@example.com',
      displayName: 'REVEL Production Team',
      role: 'production',
      organizationId: 'org-revel-ent',
      eventId: 'b3c9e1f2-4a7d-4e8b-a1c2-d5e6f7a8b9c0'
    });

    const { GET } = await import('@/app/api/events/venue-intelligence/route');
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.domainScope).toEqual({ access: 'read_write', projection: 'operations' });
    expect(payload.venue.riskFlags.length).toBeGreaterThan(0);
    expect(payload.venue.summary.openCriticalCount).toBeGreaterThan(0);
  });

  it('rejects equipment updates for couple role', async () => {
    getSessionMock.mockResolvedValue({
      userId: 'usr-couple-akshay-patel',
      email: 'akshay.rani1128@gmail.com',
      displayName: 'Akshay Patel',
      role: 'couple',
      organizationId: 'org-revel-ent',
      eventId: 'b3c9e1f2-4a7d-4e8b-a1c2-d5e6f7a8b9c0'
    });

    const { PATCH } = await import('@/app/api/events/equipment/[itemId]/route');
    const response = await PATCH(
      new Request('http://localhost/api/events/equipment/equip-audio-line-array', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ready' })
      }),
      { params: Promise.resolve({ itemId: 'equip-audio-line-array' }) }
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: 'Forbidden' });
  });

  it('propagates dependency chain from venue risk ack to equipment and run-of-show', async () => {
    getSessionMock.mockResolvedValue({
      userId: 'usr-production-akshay-rani',
      email: 'production.akshayrani@example.com',
      displayName: 'REVEL Production Team',
      role: 'production',
      organizationId: 'org-revel-ent',
      eventId: 'b3c9e1f2-4a7d-4e8b-a1c2-d5e6f7a8b9c0'
    });

    const { PATCH: patchRisk } = await import('@/app/api/events/venue-intelligence/risks/[riskId]/route');
    const { PATCH: patchEquipment } = await import('@/app/api/events/equipment/[itemId]/route');
    const { GET: getRunOfShow } = await import('@/app/api/events/run-of-show/route');

    await patchRisk(
      new Request('http://localhost/api/events/venue-intelligence/risks/risk-loadin-collision', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acknowledged: true, mitigationNote: 'Dock runner assigned.' })
      }),
      { params: Promise.resolve({ riskId: 'risk-loadin-collision' }) }
    );

    const equipmentResponse = await patchEquipment(
      new Request('http://localhost/api/events/equipment/equip-audio-line-array', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ready' })
      }),
      { params: Promise.resolve({ itemId: 'equip-audio-line-array' }) }
    );

    expect(equipmentResponse.status).toBe(200);

    const runOfShowResponse = await getRunOfShow();
    const runOfShowPayload = await runOfShowResponse.json();

    expect(runOfShowResponse.status).toBe(200);
    const baraatCue = runOfShowPayload.runOfShow.cues.find((cue: { id: string }) => cue.id === 'cue-baraat-stack');
    expect(baraatCue).toBeDefined();
    expect(baraatCue.status).not.toBe('blocked');
  });

  it('returns production workspace aggregate projection and hero state', async () => {
    getSessionMock.mockResolvedValue({
      userId: 'usr-production-akshay-rani',
      email: 'production.akshayrani@example.com',
      displayName: 'REVEL Production Team',
      role: 'production',
      organizationId: 'org-revel-ent',
      eventId: 'b3c9e1f2-4a7d-4e8b-a1c2-d5e6f7a8b9c0'
    });

    const { GET } = await import('@/app/api/events/production/workspace/route');
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.workspace.hero).toBeTruthy();
    expect(payload.workspace.nextActions.length).toBeGreaterThan(0);
    expect(payload.workspace.venue.summary.totalCount).toBeGreaterThan(0);
    expect(payload.workspace.equipment.summary.totalCount).toBeGreaterThan(0);
    expect(payload.workspace.cueBoard.summary.totalCount).toBeGreaterThan(0);
  });
});
