import { NextResponse } from 'next/server';

import {
  coerceWorkspaceCommercialState,
  inferSourceSurfaceFromRole,
  isUuid,
  parseBillingState,
  parseEventMode,
  parseWorkspaceOwnerRole,
  parseWorkspacePlan,
  resolveEntitlementTemplate,
  sanitizeTemplateForResponse
} from '@/lib/atlas-commercial';
import { canManageEventCommercialSettings } from '@/lib/auth';
import { getSession } from '@/lib/session';
import { getSupabaseAdminClient } from '@/lib/supabase-server';

interface UpdateCommercialBody {
  mode?: unknown;
  workspacePlan?: unknown;
  billingState?: unknown;
  workspaceOwnerUserId?: unknown;
  workspaceOwnerRole?: unknown;
  reasonCode?: unknown;
  note?: unknown;
}

function isNonEmptyObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && Object.keys(value).length > 0;
}

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!session.eventId) {
    return NextResponse.json({ error: 'Missing event context' }, { status: 400 });
  }

  if (!canManageEventCommercialSettings(session.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase || !isUuid(session.eventId)) {
    const state = coerceWorkspaceCommercialState({
      eventId: session.eventId,
      mode: 'revel_managed',
      workspaceOwnerUserId: session.userId,
      workspaceOwnerRole: session.role === 'couple' || session.role === 'planner' ? session.role : 'admin'
    });

    const template = await resolveEntitlementTemplate(null, state.mode, state.workspacePlan);

    return NextResponse.json(
      {
        source: 'simulation',
        state,
        entitlementTemplate: sanitizeTemplateForResponse(template)
      },
      { status: 200 }
    );
  }

  const { data, error } = await supabase
    .from('events')
    .select(
      'event_id,atlas_mode,atlas_workspace_plan,atlas_billing_state,atlas_workspace_owner_user_id,atlas_workspace_owner_role,atlas_entitlement_snapshot'
    )
    .eq('event_id', session.eventId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: 'event_commercial_read_failed', details: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'event_not_found' }, { status: 404 });
  }

  const state = coerceWorkspaceCommercialState({
    eventId: data.event_id,
    mode: parseEventMode(data.atlas_mode) ?? 'revel_managed',
    workspacePlan: parseWorkspacePlan(data.atlas_workspace_plan),
    billingState: parseBillingState(data.atlas_billing_state) ?? 'included',
    workspaceOwnerUserId: data.atlas_workspace_owner_user_id,
    workspaceOwnerRole: parseWorkspaceOwnerRole(data.atlas_workspace_owner_role),
    entitlementSnapshot: (data.atlas_entitlement_snapshot ?? {}) as Record<string, unknown>
  });

  const template = await resolveEntitlementTemplate(supabase, state.mode, state.workspacePlan);

  return NextResponse.json(
    {
      source: 'supabase',
      state,
      entitlementTemplate: sanitizeTemplateForResponse(template),
      resolvedEntitlement: isNonEmptyObject(state.entitlementSnapshot) ? state.entitlementSnapshot : template.templatePayload
    },
    { status: 200 }
  );
}

export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!session.eventId) {
    return NextResponse.json({ error: 'Missing event context' }, { status: 400 });
  }

  if (!canManageEventCommercialSettings(session.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: UpdateCommercialBody;

  try {
    body = (await request.json()) as UpdateCommercialBody;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();

  const modePatch = body.mode === undefined ? undefined : parseEventMode(body.mode);
  const planPatch = body.workspacePlan === undefined ? undefined : parseWorkspacePlan(body.workspacePlan);
  const billingPatch = body.billingState === undefined ? undefined : parseBillingState(body.billingState);
  const ownerRolePatch = body.workspaceOwnerRole === undefined ? undefined : parseWorkspaceOwnerRole(body.workspaceOwnerRole);
  const ownerUserPatch = body.workspaceOwnerUserId === undefined ? undefined : typeof body.workspaceOwnerUserId === 'string' ? body.workspaceOwnerUserId.trim() : null;

  if (body.mode !== undefined && !modePatch) {
    return NextResponse.json({ error: 'invalid_mode' }, { status: 400 });
  }

  if (body.workspacePlan !== undefined && !planPatch) {
    return NextResponse.json({ error: 'invalid_workspace_plan' }, { status: 400 });
  }

  if (body.billingState !== undefined && !billingPatch) {
    return NextResponse.json({ error: 'invalid_billing_state' }, { status: 400 });
  }

  if (body.workspaceOwnerRole !== undefined && !ownerRolePatch) {
    return NextResponse.json({ error: 'invalid_workspace_owner_role' }, { status: 400 });
  }

  if (body.workspaceOwnerUserId !== undefined && ownerUserPatch === null) {
    return NextResponse.json({ error: 'invalid_workspace_owner_user_id' }, { status: 400 });
  }

  if (!supabase || !isUuid(session.eventId)) {
    const mode = modePatch ?? 'revel_managed';
    const workspacePlan = mode === 'revel_managed' ? null : planPatch ?? 'essential';

    if (mode === 'independent' && !workspacePlan) {
      return NextResponse.json({ error: 'workspace_plan_required_for_independent_mode' }, { status: 400 });
    }

    const template = await resolveEntitlementTemplate(null, mode, workspacePlan);
    const state = coerceWorkspaceCommercialState({
      eventId: session.eventId,
      mode,
      workspacePlan,
      billingState: billingPatch ?? undefined,
      workspaceOwnerUserId: ownerUserPatch ?? session.userId,
      workspaceOwnerRole: ownerRolePatch ?? (session.role === 'planner' || session.role === 'couple' ? session.role : 'admin'),
      entitlementSnapshot: template.templatePayload
    });

    return NextResponse.json(
      {
        source: 'simulation',
        state,
        entitlementTemplate: sanitizeTemplateForResponse(template),
        auditStatus: 'simulated'
      },
      { status: 200 }
    );
  }

  const { data: current, error: readError } = await supabase
    .from('events')
    .select(
      'event_id,atlas_mode,atlas_workspace_plan,atlas_billing_state,atlas_workspace_owner_user_id,atlas_workspace_owner_role,atlas_entitlement_snapshot'
    )
    .eq('event_id', session.eventId)
    .maybeSingle();

  if (readError) {
    return NextResponse.json({ error: 'event_commercial_read_failed', details: readError.message }, { status: 500 });
  }

  if (!current) {
    return NextResponse.json({ error: 'event_not_found' }, { status: 404 });
  }

  const currentState = coerceWorkspaceCommercialState({
    eventId: current.event_id,
    mode: parseEventMode(current.atlas_mode) ?? 'revel_managed',
    workspacePlan: parseWorkspacePlan(current.atlas_workspace_plan),
    billingState: parseBillingState(current.atlas_billing_state) ?? 'included',
    workspaceOwnerUserId: current.atlas_workspace_owner_user_id,
    workspaceOwnerRole: parseWorkspaceOwnerRole(current.atlas_workspace_owner_role),
    entitlementSnapshot: (current.atlas_entitlement_snapshot ?? {}) as Record<string, unknown>
  });

  const nextMode = modePatch ?? currentState.mode;
  const nextPlan = nextMode === 'revel_managed' ? null : planPatch ?? currentState.workspacePlan ?? 'essential';

  if (nextMode === 'independent' && !nextPlan) {
    return NextResponse.json({ error: 'workspace_plan_required_for_independent_mode' }, { status: 400 });
  }

  const nextBillingState =
    nextMode === 'revel_managed' ? 'included' : billingPatch ?? currentState.billingState ?? 'trialing';

  const template = await resolveEntitlementTemplate(supabase, nextMode, nextPlan);

  const nextState = coerceWorkspaceCommercialState({
    eventId: currentState.eventId,
    mode: nextMode,
    workspacePlan: nextPlan,
    billingState: nextBillingState,
    workspaceOwnerUserId: ownerUserPatch ?? currentState.workspaceOwnerUserId,
    workspaceOwnerRole: ownerRolePatch ?? currentState.workspaceOwnerRole,
    entitlementSnapshot: template.templatePayload
  });

  const { data: updated, error: updateError } = await supabase
    .from('events')
    .update({
      atlas_mode: nextState.mode,
      atlas_workspace_plan: nextState.workspacePlan,
      atlas_billing_state: nextState.billingState,
      atlas_workspace_owner_user_id: nextState.workspaceOwnerUserId,
      atlas_workspace_owner_role: nextState.workspaceOwnerRole,
      atlas_entitlement_snapshot: nextState.entitlementSnapshot,
      updated_at: new Date().toISOString()
    })
    .eq('event_id', session.eventId)
    .select(
      'event_id,atlas_mode,atlas_workspace_plan,atlas_billing_state,atlas_workspace_owner_user_id,atlas_workspace_owner_role,atlas_entitlement_snapshot'
    )
    .maybeSingle();

  if (updateError) {
    return NextResponse.json({ error: 'event_commercial_update_failed', details: updateError.message }, { status: 500 });
  }

  if (!updated) {
    return NextResponse.json({ error: 'event_not_found' }, { status: 404 });
  }

  const reasonCode = typeof body.reasonCode === 'string' ? body.reasonCode.trim() : null;
  const note = typeof body.note === 'string' ? body.note.trim() : null;

  const { error: auditError } = await supabase.from('atlas_entitlement_audit').insert({
    event_id: session.eventId,
    actor_user_id: session.userId,
    actor_role: session.role,
    change_kind: 'manual_override',
    reason_code: reasonCode || null,
    note: note || null,
    previous_state: currentState,
    next_state: nextState,
    source_surface: inferSourceSurfaceFromRole(session.role)
  });

  if (auditError) {
    return NextResponse.json({ error: 'entitlement_audit_write_failed', details: auditError.message }, { status: 500 });
  }

  const finalState = coerceWorkspaceCommercialState({
    eventId: updated.event_id,
    mode: parseEventMode(updated.atlas_mode) ?? nextState.mode,
    workspacePlan: parseWorkspacePlan(updated.atlas_workspace_plan),
    billingState: parseBillingState(updated.atlas_billing_state) ?? nextState.billingState,
    workspaceOwnerUserId: updated.atlas_workspace_owner_user_id,
    workspaceOwnerRole: parseWorkspaceOwnerRole(updated.atlas_workspace_owner_role),
    entitlementSnapshot: (updated.atlas_entitlement_snapshot ?? {}) as Record<string, unknown>
  });

  return NextResponse.json(
    {
      source: 'supabase',
      state: finalState,
      entitlementTemplate: sanitizeTemplateForResponse(template),
      resolvedEntitlement: finalState.entitlementSnapshot,
      auditStatus: 'written'
    },
    { status: 200 }
  );
}
