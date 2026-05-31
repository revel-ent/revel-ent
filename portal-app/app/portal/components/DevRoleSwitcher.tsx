'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';

import { ROLES, type Role } from '@/lib/auth';
import type { EventRecord } from '@/lib/mock-data';

const ROLE_LABELS: Record<Role, string> = {
  admin: 'Admin',
  couple: 'Couple',
  planner: 'Planner',
  vendor: 'Vendor',
  guest: 'Guest',
  delegate_coordinator: 'Family Coordinator',
  venue_coordinator: 'Venue Coordinator'
};

export default function DevRoleSwitcher({
  currentRole,
  currentEventId,
  events
}: {
  currentRole: Role;
  currentEventId: string | null;
  events: EventRecord[];
}) {
  const pathname = usePathname();
  const nextPath = useMemo(() => {
    if (!pathname || !pathname.startsWith('/portal')) {
      return '/portal';
    }

    return pathname;
  }, [pathname]);

  return (
    <form action="/api/auth/dev-switch-role" method="POST" className="dev-role-switcher">
      <input type="hidden" name="next" value={nextPath} />
      <label htmlFor="devSwitchRole">Dev role</label>
      <select id="devSwitchRole" name="role" defaultValue={currentRole}>
        {ROLES.map((role) => (
          <option key={role} value={role}>
            {ROLE_LABELS[role]}
          </option>
        ))}
      </select>

      <label htmlFor="devSwitchEvent">Event</label>
      <select id="devSwitchEvent" name="eventId" defaultValue={currentEventId || ''}>
        {events.map((event) => (
          <option key={event.id} value={event.id}>
            {event.title}
          </option>
        ))}
      </select>

      <button type="submit" className="portal-nav-link">
        Switch
      </button>
    </form>
  );
}
