export const ROLES = ['admin', 'couple', 'planner', 'vendor', 'guest', 'delegate_coordinator', 'venue_coordinator'] as const;

export type Role = (typeof ROLES)[number];

export interface RolePermission {
  portalRoutes: string[];
  canUseOnboardingApi: boolean;
  canApproveOnboardingTimeline: boolean;
  canUseIntake: boolean;
  canUseLiveMode: boolean;
  canUpdateLiveTimeline: boolean;
  canUseVenueWorkspace: boolean;
  requiresBoundedDayOfWindowForLiveUpdates: boolean;
}

export const ROLE_PERMISSION_MATRIX: Record<Role, RolePermission> = {
  admin: {
    portalRoutes: ['/portal', '/portal/onboarding', '/portal/intake', '/portal/live', '/portal/couple', '/portal/planner', '/portal/vendor', '/portal/guest', '/portal/venue'],
    canUseOnboardingApi: true,
    canApproveOnboardingTimeline: true,
    canUseIntake: true,
    canUseLiveMode: true,
    canUpdateLiveTimeline: true,
    canUseVenueWorkspace: true,
    requiresBoundedDayOfWindowForLiveUpdates: false
  },
  couple: {
    portalRoutes: ['/portal', '/portal/onboarding', '/portal/couple'],
    canUseOnboardingApi: true,
    canApproveOnboardingTimeline: true,
    canUseIntake: false,
    canUseLiveMode: false,
    canUpdateLiveTimeline: false,
    canUseVenueWorkspace: false,
    requiresBoundedDayOfWindowForLiveUpdates: false
  },
  planner: {
    portalRoutes: ['/portal', '/portal/onboarding', '/portal/intake', '/portal/live', '/portal/planner'],
    canUseOnboardingApi: true,
    canApproveOnboardingTimeline: true,
    canUseIntake: true,
    canUseLiveMode: true,
    canUpdateLiveTimeline: true,
    canUseVenueWorkspace: false,
    requiresBoundedDayOfWindowForLiveUpdates: false
  },
  vendor: {
    portalRoutes: ['/portal', '/portal/vendor'],
    canUseOnboardingApi: false,
    canApproveOnboardingTimeline: false,
    canUseIntake: false,
    canUseLiveMode: false,
    canUpdateLiveTimeline: false,
    canUseVenueWorkspace: false,
    requiresBoundedDayOfWindowForLiveUpdates: false
  },
  guest: {
    portalRoutes: ['/portal', '/portal/guest'],
    canUseOnboardingApi: false,
    canApproveOnboardingTimeline: false,
    canUseIntake: false,
    canUseLiveMode: false,
    canUpdateLiveTimeline: false,
    canUseVenueWorkspace: false,
    requiresBoundedDayOfWindowForLiveUpdates: false
  },
  delegate_coordinator: {
    portalRoutes: ['/portal', '/portal/onboarding', '/portal/live'],
    canUseOnboardingApi: true,
    canApproveOnboardingTimeline: true,
    canUseIntake: false,
    canUseLiveMode: true,
    canUpdateLiveTimeline: true,
    canUseVenueWorkspace: false,
    requiresBoundedDayOfWindowForLiveUpdates: true
  },
  venue_coordinator: {
    portalRoutes: ['/portal', '/portal/live', '/portal/venue'],
    canUseOnboardingApi: false,
    canApproveOnboardingTimeline: false,
    canUseIntake: false,
    canUseLiveMode: true,
    canUpdateLiveTimeline: true,
    canUseVenueWorkspace: true,
    requiresBoundedDayOfWindowForLiveUpdates: true
  }
};

export const ROUTE_ACCESS: Record<string, Role[]> = {
  '/portal': ['admin', 'couple', 'planner', 'vendor', 'guest', 'delegate_coordinator', 'venue_coordinator'],
  '/portal/onboarding': ['admin', 'couple', 'planner', 'delegate_coordinator'],
  '/portal/intake': ['admin', 'planner'],
  '/portal/live': ['admin', 'planner', 'delegate_coordinator', 'venue_coordinator'],
  '/portal/couple': ['admin', 'couple'],
  '/portal/planner': ['admin', 'planner'],
  '/portal/vendor': ['admin', 'vendor'],
  '/portal/guest': ['admin', 'guest'],
  '/portal/venue': ['admin', 'venue_coordinator']
};

export function isKnownRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

export function canUseOnboardingApi(role: Role): boolean {
  return ROLE_PERMISSION_MATRIX[role].canUseOnboardingApi;
}

export function canApproveOnboardingTimeline(role: Role): boolean {
  return ROLE_PERMISSION_MATRIX[role].canApproveOnboardingTimeline;
}

export function canUseIntake(role: Role): boolean {
  return ROLE_PERMISSION_MATRIX[role].canUseIntake;
}

export function canUseLiveMode(role: Role): boolean {
  return ROLE_PERMISSION_MATRIX[role].canUseLiveMode;
}

export function canUpdateLiveTimeline(role: Role): boolean {
  return ROLE_PERMISSION_MATRIX[role].canUpdateLiveTimeline;
}

export function requiresBoundedDayOfWindowForLiveUpdates(role: Role): boolean {
  return ROLE_PERMISSION_MATRIX[role].requiresBoundedDayOfWindowForLiveUpdates;
}

export function canUseVenueWorkspace(role: Role): boolean {
  return ROLE_PERMISSION_MATRIX[role].canUseVenueWorkspace;
}

export function canManageEventCommercialSettings(role: Role): boolean {
  return role === 'admin' || role === 'planner' || role === 'couple';
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
