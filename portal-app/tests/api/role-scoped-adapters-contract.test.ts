import { describe, expect, it } from 'vitest';

import { canAccessDomain, createRoleScopedAdapter, getDomainScope } from '@/lib/role-scoped-adapters';

describe('role-scoped adapters contract', () => {
  it('returns scoped access for key Phase 3 roles', () => {
    expect(getDomainScope('timeline', 'admin')).toEqual({ access: 'read_write', projection: 'full' });
    expect(getDomainScope('timeline', 'couple')).toEqual({ access: 'read', projection: 'owner_filtered' });
    expect(getDomainScope('run_of_show', 'production')).toEqual({ access: 'read_write', projection: 'operations' });
    expect(getDomainScope('music', 'dj_mc')).toEqual({ access: 'read_write', projection: 'operations' });
    expect(getDomainScope('venue_intelligence', 'venue_coordinator')).toEqual({ access: 'read', projection: 'venue' });
    expect(getDomainScope('tasks', 'vendor')).toEqual({ access: 'read_write', projection: 'assigned' });
  });

  it('answers read/write capability checks', () => {
    expect(canAccessDomain('equipment', 'production', 'write')).toBe(true);
    expect(canAccessDomain('approvals', 'vendor', 'read')).toBe(false);
    expect(canAccessDomain('timeline', 'couple', 'write')).toBe(false);
  });

  it('applies projectors based on projection mode', () => {
    const adaptTimeline = createRoleScopedAdapter<{ steps: string[] }, { mode: string; steps: string[] }>({
      domain: 'timeline',
      projectors: {
        full: (input) => ({ mode: 'full', steps: input.steps }),
        owner_filtered: (input) => ({ mode: 'owner_filtered', steps: input.steps.slice(0, 1) }),
        operations: (input) => ({ mode: 'operations', steps: input.steps.slice(0, 2) }),
        assigned: (input) => ({ mode: 'assigned', steps: input.steps.slice(0, 1) }),
        venue: (input) => ({ mode: 'venue', steps: input.steps.slice(0, 1) }),
        summary: (input) => ({ mode: 'summary', steps: input.steps.slice(0, 1) })
      }
    });

    expect(adaptTimeline('admin', { steps: ['a', 'b', 'c'] })).toEqual({ mode: 'full', steps: ['a', 'b', 'c'] });
    expect(adaptTimeline('couple', { steps: ['a', 'b', 'c'] })).toEqual({ mode: 'owner_filtered', steps: ['a'] });
    expect(adaptTimeline('production', { steps: ['a', 'b', 'c'] })).toEqual({ mode: 'operations', steps: ['a', 'b'] });
  });
});