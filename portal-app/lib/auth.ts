export const ROLES = ['admin', 'couple', 'planner', 'production', 'dj_mc', 'decorator', 'vendor', 'guest', 'delegate_coordinator', 'venue_coordinator'] as const;

export type Role = (typeof ROLES)[number];
export const MODULE_CAPABILITIES = [
  'onboarding.workspace',
  'intake.workspace',
  'live.command',
  'production.command',
  'venue.intelligence',
  'dj.booth',
  'vendor.coordination',
  'guest.concierge',
  'couple.workspace',
  'planner.workspace'
] as const;

export type ModuleCapability = (typeof MODULE_CAPABILITIES)[number];

const MODULE_ROUTE_MAP: Record<ModuleCapability, string> = {
  'onboarding.workspace': '/portal/onboarding',
  'intake.workspace': '/portal/intake',
  'live.command': '/portal/live',
  'production.command': '/portal/production',
  'venue.intelligence': '/portal/venue',
  'dj.booth': '/portal/dj',
  'vendor.coordination': '/portal/vendor',
  'guest.concierge': '/portal/guest',
  'couple.workspace': '/portal/couple',
  'planner.workspace': '/portal/planner'
};

const DEFAULT_LANDING_PRIORITY: ModuleCapability[] = [
  'production.command',
  'planner.workspace',
  'couple.workspace',
  'venue.intelligence',
  'dj.booth',
  'vendor.coordination',
  'guest.concierge',
  'live.command',
  'intake.workspace',
  'onboarding.workspace'
];

export interface RolePermission {
  portalRoutes: string[];
  moduleCapabilities: ModuleCapability[];
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
    portalRoutes: ['/portal', '/portal/onboarding', '/portal/intake', '/portal/live', '/portal/couple', '/portal/planner', '/portal/production', '/portal/vendor', '/portal/guest', '/portal/venue'],
    moduleCapabilities: ['onboarding.workspace', 'intake.workspace', 'live.command', 'production.command', 'venue.intelligence', 'dj.booth', 'vendor.coordination', 'guest.concierge', 'couple.workspace', 'planner.workspace'],
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
    moduleCapabilities: ['onboarding.workspace', 'couple.workspace'],
    canUseOnboardingApi: true,
    canApproveOnboardingTimeline: true,
    canUseIntake: false,
    canUseLiveMode: false,
    canUpdateLiveTimeline: false,
    canUseVenueWorkspace: false,
    requiresBoundedDayOfWindowForLiveUpdates: false
  },
  planner: {
    portalRoutes: ['/portal', '/portal/onboarding', '/portal/intake', '/portal/live', '/portal/planner', '/portal/production'],
    moduleCapabilities: ['onboarding.workspace', 'intake.workspace', 'live.command', 'production.command', 'planner.workspace'],
    canUseOnboardingApi: true,
    canApproveOnboardingTimeline: true,
    canUseIntake: true,
    canUseLiveMode: true,
    canUpdateLiveTimeline: true,
    canUseVenueWorkspace: false,
    requiresBoundedDayOfWindowForLiveUpdates: false
  },
  production: {
    portalRoutes: ['/portal', '/portal/live', '/portal/production'],
    moduleCapabilities: ['live.command', 'production.command'],
    canUseOnboardingApi: false,
    canApproveOnboardingTimeline: false,
    canUseIntake: false,
    canUseLiveMode: true,
    canUpdateLiveTimeline: true,
    canUseVenueWorkspace: false,
    requiresBoundedDayOfWindowForLiveUpdates: true
  },
  dj_mc: {
    portalRoutes: ['/portal', '/portal/live', '/portal/dj'],
    moduleCapabilities: ['live.command', 'dj.booth'],
    canUseOnboardingApi: false,
    canApproveOnboardingTimeline: false,
    canUseIntake: false,
    canUseLiveMode: true,
    canUpdateLiveTimeline: false,
    canUseVenueWorkspace: false,
    requiresBoundedDayOfWindowForLiveUpdates: true
  },
  decorator: {
    portalRoutes: ['/portal', '/portal/vendor'],
    moduleCapabilities: ['vendor.coordination'],
    canUseOnboardingApi: false,
    canApproveOnboardingTimeline: false,
    canUseIntake: false,
    canUseLiveMode: false,
    canUpdateLiveTimeline: false,
    canUseVenueWorkspace: false,
    requiresBoundedDayOfWindowForLiveUpdates: false
  },
  vendor: {
    portalRoutes: ['/portal', '/portal/vendor'],
    moduleCapabilities: ['vendor.coordination'],
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
    moduleCapabilities: ['guest.concierge'],
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
    moduleCapabilities: ['onboarding.workspace', 'live.command'],
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
    moduleCapabilities: ['live.command', 'venue.intelligence'],
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
  '/portal': ['admin', 'couple', 'planner', 'production', 'dj_mc', 'decorator', 'vendor', 'guest', 'delegate_coordinator', 'venue_coordinator'],
  '/portal/onboarding': ['admin', 'couple', 'planner', 'delegate_coordinator'],
  '/portal/intake': ['admin', 'planner'],
  '/portal/live': ['admin', 'planner', 'production', 'dj_mc', 'delegate_coordinator', 'venue_coordinator'],
  '/portal/couple': ['admin', 'couple'],
  '/portal/planner': ['admin', 'planner'],
  '/portal/production': ['admin', 'planner', 'production'],
  '/portal/dj': ['admin', 'dj_mc'],
  '/portal/vendor': ['admin', 'decorator', 'vendor'],
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

export function canAccessModule(role: Role, capability: ModuleCapability): boolean {
  return ROLE_PERMISSION_MATRIX[role].moduleCapabilities.includes(capability);
}

export function resolveDefaultPortalRoute(role: Role): string {
  if (role === 'admin' || role === 'planner') {
    return '/portal';
  }

  for (const capability of DEFAULT_LANDING_PRIORITY) {
    if (!canAccessModule(role, capability)) {
      continue;
    }

    const targetRoute = MODULE_ROUTE_MAP[capability];
    if (canAccessRoute(role, targetRoute)) {
      return targetRoute;
    }
  }

  return '/portal';
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
