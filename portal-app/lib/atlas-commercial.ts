import type { SupabaseClient } from '@supabase/supabase-js';

import type {
  AtlasBillingState,
  AtlasEntitlementTemplate,
  AtlasEventMode,
  AtlasWorkspaceCommercialState,
  AtlasWorkspaceOwnerRole,
  AtlasWorkspacePlan
} from '@/lib/atlas-types';

export interface ResolvedEntitlementTemplate {
  source: 'database' | 'default';
  templateKey: string;
  templatePayload: Record<string, unknown>;
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function parseEventMode(value: unknown): AtlasEventMode | null {
  return value === 'revel_managed' || value === 'independent' ? value : null;
}

export function parseWorkspacePlan(value: unknown): AtlasWorkspacePlan | null {
  return value === 'essential' || value === 'pro' || value === 'premium' ? value : null;
}

export function parseBillingState(value: unknown): AtlasBillingState | null {
  return value === 'included' || value === 'trialing' || value === 'active' || value === 'past_due' || value === 'canceled'
    ? value
    : null;
}

export function parseWorkspaceOwnerRole(value: unknown): AtlasWorkspaceOwnerRole | null {
  return value === 'admin' || value === 'planner' || value === 'couple' ? value : null;
}

export function defaultBillingStateForMode(mode: AtlasEventMode): AtlasBillingState {
  return mode === 'revel_managed' ? 'included' : 'trialing';
}

export function coerceWorkspaceCommercialState(
  input: Partial<AtlasWorkspaceCommercialState> & { eventId: string }
): AtlasWorkspaceCommercialState {
  const mode = input.mode ?? 'revel_managed';
  const workspacePlan = mode === 'revel_managed' ? null : input.workspacePlan ?? 'essential';
  const billingState = mode === 'revel_managed' ? 'included' : input.billingState ?? defaultBillingStateForMode(mode);

  return {
    eventId: input.eventId,
    mode,
    workspacePlan,
    billingState,
    workspaceOwnerUserId: input.workspaceOwnerUserId ?? null,
    workspaceOwnerRole: input.workspaceOwnerRole ?? null,
    entitlementSnapshot: input.entitlementSnapshot ?? {}
  };
}

export function inferSourceSurfaceFromRole(role: string): 'admin_console' | 'planner_dashboard' | 'couple_dashboard' {
  if (role === 'admin') {
    return 'admin_console';
  }

  if (role === 'planner') {
    return 'planner_dashboard';
  }

  return 'couple_dashboard';
}

export async function resolveEntitlementTemplate(
  supabase: SupabaseClient | null,
  mode: AtlasEventMode,
  workspacePlan: AtlasWorkspacePlan | null
): Promise<ResolvedEntitlementTemplate> {
  if (supabase) {
    const query = supabase
      .from('atlas_entitlement_templates')
      .select('template_key,entitlement_payload')
      .eq('mode', mode)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1);

    const { data, error } = workspacePlan
      ? await query.eq('workspace_plan', workspacePlan).maybeSingle()
      : await query.is('workspace_plan', null).maybeSingle();

    if (!error && data) {
      return {
        source: 'database',
        templateKey: data.template_key,
        templatePayload: (data.entitlement_payload ?? {}) as Record<string, unknown>
      };
    }
  }

  if (mode === 'revel_managed') {
    return {
      source: 'default',
      templateKey: 'revel_managed_default_v1',
      templatePayload: {
        workspaceMode: 'revel_managed',
        capabilities: {
          coreWorkspace: true,
          coreIntelligence: true
        },
        billing: {
          payer: 'revel',
          seatBilling: false
        }
      }
    };
  }

  const plan = workspacePlan ?? 'essential';
  const isPro = plan === 'pro' || plan === 'premium';

  return {
    source: 'default',
    templateKey: `independent_${plan}_v1`,
    templatePayload: {
      workspaceMode: 'independent',
      capabilities: {
        coreWorkspace: true,
        coreIntelligence: true,
        advancedSignals: isPro,
        conciergeSupport: plan === 'premium'
      },
      billing: {
        payer: 'workspace_owner',
        seatBilling: false
      }
    }
  };
}

export function sanitizeTemplateForResponse(template: ResolvedEntitlementTemplate): Pick<AtlasEntitlementTemplate, 'templateKey' | 'entitlementPayload'> {
  return {
    templateKey: template.templateKey,
    entitlementPayload: template.templatePayload
  };
}
