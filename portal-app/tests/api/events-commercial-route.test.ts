import { beforeEach, describe, expect, it, vi } from 'vitest';

const getSessionMock = vi.fn();
const getSupabaseAdminClientMock = vi.fn();

vi.mock('@/lib/session', () => ({
  getSession: getSessionMock
}));

vi.mock('@/lib/supabase-server', () => ({
  getSupabaseAdminClient: getSupabaseAdminClientMock
}));

describe('events commercial route', () => {
  beforeEach(() => {
    vi.resetModules();
    getSessionMock.mockReset();
    getSupabaseAdminClientMock.mockReset();

    getSessionMock.mockResolvedValue({
      userId: 'usr-planner-maulin',
      email: 'maulin@revel-ent.com',
      displayName: 'MC Maulin',
      role: 'planner',
      eventId: 'evt-revel-2026-11-15'
    });

    getSupabaseAdminClientMock.mockReturnValue(null);
  });

  it('GET returns 401 when session is missing', async () => {
    getSessionMock.mockResolvedValue(null);
    const { GET } = await import('@/app/api/events/commercial/route');

    const response = await GET();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' });
  });

  it('GET returns 403 for role without commercial access', async () => {
    getSessionMock.mockResolvedValue({
      userId: 'usr-vendor-heckno',
      email: 'heckno@revel-ent.com',
      displayName: 'DJ Heckno',
      role: 'vendor',
      eventId: 'evt-revel-2026-11-15'
    });

    const { GET } = await import('@/app/api/events/commercial/route');
    const response = await GET();

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: 'Forbidden' });
  });

  it('GET returns simulation payload when supabase is unavailable', async () => {
    const { GET } = await import('@/app/api/events/commercial/route');
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.source).toBe('simulation');
    expect(payload.state.mode).toBe('revel_managed');
    expect(payload.entitlementTemplate.templateKey).toBe('revel_managed_default_v1');
  });

  it('GET reads persisted state and resolves template from supabase', async () => {
    getSessionMock.mockResolvedValue({
      userId: 'usr-admin-1',
      email: 'admin@revel-ent.com',
      displayName: 'Admin',
      role: 'admin',
      eventId: '0f1d7d0a-7c8f-4f5f-9c89-9c8b2f3e1a11'
    });

    const eventsMaybeSingleMock = vi.fn().mockResolvedValue({
      data: {
        event_id: '0f1d7d0a-7c8f-4f5f-9c89-9c8b2f3e1a11',
        atlas_mode: 'independent',
        atlas_workspace_plan: 'pro',
        atlas_billing_state: 'active',
        atlas_workspace_owner_user_id: 'usr-owner-1',
        atlas_workspace_owner_role: 'planner',
        atlas_entitlement_snapshot: { workspaceMode: 'independent', capabilities: { advancedSignals: true } }
      },
      error: null
    });

    const templateMaybeSingleMock = vi.fn().mockResolvedValue({
      data: {
        template_key: 'independent_pro_v1',
        entitlement_payload: { workspaceMode: 'independent', capabilities: { advancedSignals: true } }
      },
      error: null
    });

    getSupabaseAdminClientMock.mockReturnValue({
      from: (table: string) => {
        if (table === 'events') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: eventsMaybeSingleMock
              })
            })
          };
        }

        if (table === 'atlas_entitlement_templates') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  order: () => ({
                    limit: () => ({
                      eq: () => ({
                        maybeSingle: templateMaybeSingleMock
                      })
                    })
                  })
                })
              })
            })
          };
        }

        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: null, error: null })
            })
          })
        };
      }
    });

    const { GET } = await import('@/app/api/events/commercial/route');
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.source).toBe('supabase');
    expect(payload.state.mode).toBe('independent');
    expect(payload.entitlementTemplate.templateKey).toBe('independent_pro_v1');
    expect(eventsMaybeSingleMock).toHaveBeenCalled();
    expect(templateMaybeSingleMock).toHaveBeenCalled();
  });

  it('POST validates independent mode requires workspace plan', async () => {
    const { POST } = await import('@/app/api/events/commercial/route');

    const request = new Request('http://localhost/api/events/commercial', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'independent', workspacePlan: null })
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'invalid_workspace_plan' });
  });

  it('POST returns simulation state when supabase is unavailable', async () => {
    const { POST } = await import('@/app/api/events/commercial/route');

    const request = new Request('http://localhost/api/events/commercial', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'independent', workspacePlan: 'essential', billingState: 'trialing' })
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.source).toBe('simulation');
    expect(payload.state.mode).toBe('independent');
    expect(payload.state.workspacePlan).toBe('essential');
    expect(payload.auditStatus).toBe('simulated');
  });

  it('POST updates persisted state and writes entitlement audit', async () => {
    getSessionMock.mockResolvedValue({
      userId: 'usr-admin-1',
      email: 'admin@revel-ent.com',
      displayName: 'Admin',
      role: 'admin',
      eventId: '0f1d7d0a-7c8f-4f5f-9c89-9c8b2f3e1a11'
    });

    const eventsReadMaybeSingleMock = vi
      .fn()
      .mockResolvedValueOnce({
        data: {
          event_id: '0f1d7d0a-7c8f-4f5f-9c89-9c8b2f3e1a11',
          atlas_mode: 'revel_managed',
          atlas_workspace_plan: null,
          atlas_billing_state: 'included',
          atlas_workspace_owner_user_id: 'usr-admin-1',
          atlas_workspace_owner_role: 'admin',
          atlas_entitlement_snapshot: {}
        },
        error: null
      })
      .mockResolvedValueOnce({
        data: {
          event_id: '0f1d7d0a-7c8f-4f5f-9c89-9c8b2f3e1a11',
          atlas_mode: 'independent',
          atlas_workspace_plan: 'pro',
          atlas_billing_state: 'active',
          atlas_workspace_owner_user_id: 'usr-owner-1',
          atlas_workspace_owner_role: 'planner',
          atlas_entitlement_snapshot: { workspaceMode: 'independent', capabilities: { advancedSignals: true } }
        },
        error: null
      });

    const eventsUpdateMaybeSingleMock = vi.fn().mockResolvedValue({
      data: {
        event_id: '0f1d7d0a-7c8f-4f5f-9c89-9c8b2f3e1a11',
        atlas_mode: 'independent',
        atlas_workspace_plan: 'pro',
        atlas_billing_state: 'active',
        atlas_workspace_owner_user_id: 'usr-owner-1',
        atlas_workspace_owner_role: 'planner',
        atlas_entitlement_snapshot: { workspaceMode: 'independent', capabilities: { advancedSignals: true } }
      },
      error: null
    });

    const auditInsertMock = vi.fn().mockResolvedValue({ error: null });

    const templateMaybeSingleMock = vi.fn().mockResolvedValue({
      data: {
        template_key: 'independent_pro_v1',
        entitlement_payload: { workspaceMode: 'independent', capabilities: { advancedSignals: true } }
      },
      error: null
    });

    getSupabaseAdminClientMock.mockReturnValue({
      from: (table: string) => {
        if (table === 'events') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: eventsReadMaybeSingleMock
              })
            }),
            update: () => ({
              eq: () => ({
                select: () => ({
                  maybeSingle: eventsUpdateMaybeSingleMock
                })
              })
            })
          };
        }

        if (table === 'atlas_entitlement_templates') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  order: () => ({
                    limit: () => ({
                      eq: () => ({
                        maybeSingle: templateMaybeSingleMock
                      })
                    })
                  })
                })
              })
            })
          };
        }

        if (table === 'atlas_entitlement_audit') {
          return {
            insert: auditInsertMock
          };
        }

        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: null, error: null })
            })
          })
        };
      }
    });

    const { POST } = await import('@/app/api/events/commercial/route');

    const request = new Request('http://localhost/api/events/commercial', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'independent',
        workspacePlan: 'pro',
        billingState: 'active',
        workspaceOwnerUserId: 'usr-owner-1',
        workspaceOwnerRole: 'planner',
        reasonCode: 'owner_transfer',
        note: 'Moved to planner-owned independent workspace'
      })
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.source).toBe('supabase');
    expect(payload.state.mode).toBe('independent');
    expect(payload.state.workspacePlan).toBe('pro');
    expect(payload.auditStatus).toBe('written');
    expect(auditInsertMock).toHaveBeenCalledTimes(1);
  });
});
