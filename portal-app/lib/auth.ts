export const ROLES = ['admin', 'couple', 'planner', 'vendor', 'guest', 'delegate_coordinator'] as const;

export type Role = (typeof ROLES)[number];

export const ROUTE_ACCESS: Record<string, Role[]> = {
  '/portal': ['admin', 'couple', 'planner', 'vendor', 'guest', 'delegate_coordinator'],
  '/portal/onboarding': ['admin', 'couple', 'planner', 'delegate_coordinator'],
  '/portal/live': ['admin', 'planner', 'delegate_coordinator'],
  '/portal/couple': ['admin', 'couple'],
  '/portal/planner': ['admin', 'planner'],
  '/portal/vendor': ['admin', 'vendor'],
  '/portal/guest': ['admin', 'guest']
};

export function isKnownRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

export function canAccessRoute(role: Role, pathname: string): boolean {
  const match = Object.keys(ROUTE_ACCESS)
    .sort((a, b) => b.length - a.length)
    .find((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

  if (!match) {
    return false;
  }

  return ROUTE_ACCESS[match].includes(role);
}
