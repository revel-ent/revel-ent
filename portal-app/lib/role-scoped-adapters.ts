import { type Role } from '@/lib/auth';

export const DOMAIN_KEYS = [
  'event_overview',
  'timeline',
  'tasks',
  'vendors',
  'venue_intelligence',
  'music',
  'approvals',
  'equipment',
  'run_of_show'
] as const;

export type DomainKey = (typeof DOMAIN_KEYS)[number];

export type DomainAccess = 'none' | 'read' | 'read_write';

export type DomainProjection =
  | 'none'
  | 'full'
  | 'owner_filtered'
  | 'operations'
  | 'venue'
  | 'assigned'
  | 'summary';

export interface DomainScope {
  access: DomainAccess;
  projection: DomainProjection;
}

type DomainScopeMatrix = Record<DomainKey, Record<Role, DomainScope>>;

const NO_ACCESS: DomainScope = { access: 'none', projection: 'none' };
const FULL_RW: DomainScope = { access: 'read_write', projection: 'full' };
const FULL_READ: DomainScope = { access: 'read', projection: 'full' };
const OWNER_FILTERED_READ: DomainScope = { access: 'read', projection: 'owner_filtered' };
const OWNER_FILTERED_RW: DomainScope = { access: 'read_write', projection: 'owner_filtered' };
const OPERATIONS_READ: DomainScope = { access: 'read', projection: 'operations' };
const OPERATIONS_RW: DomainScope = { access: 'read_write', projection: 'operations' };
const VENUE_READ: DomainScope = { access: 'read', projection: 'venue' };
const ASSIGNED_READ: DomainScope = { access: 'read', projection: 'assigned' };
const ASSIGNED_RW: DomainScope = { access: 'read_write', projection: 'assigned' };
const SUMMARY_READ: DomainScope = { access: 'read', projection: 'summary' };

const ROLE_SCOPED_DOMAIN_MATRIX: DomainScopeMatrix = {
  event_overview: {
    admin: FULL_RW,
    couple: OWNER_FILTERED_READ,
    planner: FULL_RW,
    production: OPERATIONS_READ,
    dj_mc: SUMMARY_READ,
    vendor: ASSIGNED_READ,
    guest: NO_ACCESS,
    delegate_coordinator: OPERATIONS_READ,
    venue_coordinator: VENUE_READ
  },
  timeline: {
    admin: FULL_RW,
    couple: OWNER_FILTERED_READ,
    planner: FULL_RW,
    production: OPERATIONS_READ,
    dj_mc: OPERATIONS_READ,
    vendor: ASSIGNED_READ,
    guest: SUMMARY_READ,
    delegate_coordinator: OPERATIONS_RW,
    venue_coordinator: VENUE_READ
  },
  tasks: {
    admin: FULL_RW,
    couple: OWNER_FILTERED_READ,
    planner: FULL_RW,
    production: OPERATIONS_RW,
    dj_mc: ASSIGNED_RW,
    vendor: ASSIGNED_RW,
    guest: NO_ACCESS,
    delegate_coordinator: OPERATIONS_RW,
    venue_coordinator: VENUE_READ
  },
  vendors: {
    admin: FULL_RW,
    couple: OWNER_FILTERED_READ,
    planner: FULL_RW,
    production: OPERATIONS_READ,
    dj_mc: NO_ACCESS,
    vendor: ASSIGNED_READ,
    guest: NO_ACCESS,
    delegate_coordinator: OPERATIONS_READ,
    venue_coordinator: VENUE_READ
  },
  venue_intelligence: {
    admin: FULL_RW,
    couple: SUMMARY_READ,
    planner: FULL_RW,
    production: OPERATIONS_RW,
    dj_mc: SUMMARY_READ,
    vendor: ASSIGNED_READ,
    guest: NO_ACCESS,
    delegate_coordinator: OPERATIONS_READ,
    venue_coordinator: VENUE_READ
  },
  music: {
    admin: FULL_RW,
    couple: OWNER_FILTERED_RW,
    planner: FULL_RW,
    production: SUMMARY_READ,
    dj_mc: OPERATIONS_RW,
    vendor: NO_ACCESS,
    guest: NO_ACCESS,
    delegate_coordinator: SUMMARY_READ,
    venue_coordinator: NO_ACCESS
  },
  approvals: {
    admin: FULL_RW,
    couple: OWNER_FILTERED_RW,
    planner: FULL_RW,
    production: NO_ACCESS,
    dj_mc: NO_ACCESS,
    vendor: NO_ACCESS,
    guest: NO_ACCESS,
    delegate_coordinator: NO_ACCESS,
    venue_coordinator: NO_ACCESS
  },
  equipment: {
    admin: FULL_RW,
    couple: NO_ACCESS,
    planner: FULL_RW,
    production: OPERATIONS_RW,
    dj_mc: SUMMARY_READ,
    vendor: ASSIGNED_READ,
    guest: NO_ACCESS,
    delegate_coordinator: OPERATIONS_READ,
    venue_coordinator: VENUE_READ
  },
  run_of_show: {
    admin: FULL_RW,
    couple: SUMMARY_READ,
    planner: FULL_RW,
    production: OPERATIONS_RW,
    dj_mc: OPERATIONS_RW,
    vendor: ASSIGNED_READ,
    guest: NO_ACCESS,
    delegate_coordinator: OPERATIONS_RW,
    venue_coordinator: VENUE_READ
  }
};

export function getDomainScope(domain: DomainKey, role: Role): DomainScope {
  return ROLE_SCOPED_DOMAIN_MATRIX[domain][role];
}

export function getDomainScopesForRole(role: Role): Record<DomainKey, DomainScope> {
  return DOMAIN_KEYS.reduce(
    (acc, domain) => {
      acc[domain] = getDomainScope(domain, role);
      return acc;
    },
    {} as Record<DomainKey, DomainScope>
  );
}

export function canAccessDomain(domain: DomainKey, role: Role, requiredAccess: 'read' | 'write' = 'read'): boolean {
  const scope = getDomainScope(domain, role);

  if (scope.access === 'none') {
    return false;
  }

  if (requiredAccess === 'read') {
    return true;
  }

  return scope.access === 'read_write';
}

type Projector<TInput, TOutput> = (input: TInput, scope: DomainScope) => TOutput;

export function createRoleScopedAdapter<TInput, TOutput>(params: {
  domain: DomainKey;
  projectors: Partial<Record<DomainProjection, Projector<TInput, TOutput>>>;
}) {
  return (role: Role, input: TInput): TOutput | null => {
    const scope = getDomainScope(params.domain, role);

    if (scope.access === 'none' || scope.projection === 'none') {
      return null;
    }

    const projector = params.projectors[scope.projection] ?? params.projectors.full;

    if (!projector) {
      throw new Error(`Missing projector for ${params.domain}:${scope.projection}`);
    }

    return projector(input, scope);
  };
}