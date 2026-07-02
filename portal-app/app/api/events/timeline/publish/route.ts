import { NextResponse } from 'next/server';

import { requireEventRoleContext } from '@/lib/event-context';
import { getSupabaseAdminClient } from '@/lib/supabase-server';
import { generateEventTimeline } from '@/lib/timeline-generation';

interface PublishBody {
  tradition?: unknown;
}

export async function POST(request: Request) {
  const { context, response } = await requireEventRoleContext({ allowedRoles: ['admin', 'planner'] });

  if (response || !context) {
    return response as NextResponse;
  }

  let body: PublishBody = {};

  try {
    body = (await request.json()) as PublishBody;
  } catch {
    // No body is fine — tradition is optional.
  }

  const tradition = typeof body.tradition === 'string' ? body.tradition.trim() : undefined;

  // Re-derive and re-generate deterministically rather than trusting a client-held item list
  // that could have drifted from the venue's real constraints between preview and publish.
  const outcome = await generateEventTimeline({ eventId: context.eventId, tradition });

  if (!outcome.ok) {
    return NextResponse.json({ error: outcome.error }, { status: outcome.status });
  }

  if (outcome.existingTimelineCount > 0) {
    return NextResponse.json(
      {
        error: 'timeline_exists',
        message: `This event already has ${outcome.existingTimelineCount} timeline item(s). Publishing again would duplicate them — clear the existing timeline first if you need to regenerate.`
      },
      { status: 409 }
    );
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json({ error: 'supabase_unavailable' }, { status: 503 });
  }

  const timelineRows = outcome.generation.items.map((item) => ({
    event_id: context.eventId,
    phase_code: item.phaseCode,
    title: item.title,
    scheduled_start: item.scheduledStartIso,
    scheduled_end: item.scheduledEndIso,
    status: 'pending',
    is_template_generated: true,
    atlas_prompt: item.atlasPrompt,
    escalation_hint: item.escalationHint,
    notes: null
  }));

  const { error: insertError } = await supabase.from('timelines').insert(timelineRows);

  if (insertError) {
    return NextResponse.json({ error: 'timeline_insert_failed', details: insertError.message }, { status: 500 });
  }

  // Persist the tradition used so a future regeneration (after clearing) defaults to the same
  // choice instead of silently falling back to DEFAULT_TRADITION_KEY again.
  const { data: eventRow } = await supabase
    .from('events')
    .select('atlas_entitlement_snapshot')
    .eq('event_id', context.eventId)
    .maybeSingle();

  const existingSnapshot = (eventRow?.atlas_entitlement_snapshot as Record<string, unknown> | null) ?? {};

  if (existingSnapshot.tradition_key !== outcome.resolvedTradition) {
    await supabase
      .from('events')
      .update({ atlas_entitlement_snapshot: { ...existingSnapshot, tradition_key: outcome.resolvedTradition } })
      .eq('event_id', context.eventId);
  }

  return NextResponse.json(
    {
      mode: 'supabase',
      eventId: context.eventId,
      timelineCount: timelineRows.length,
      venue: outcome.generation.venue.name,
      tradition: outcome.resolvedTradition,
      message: 'Timeline generated and published.'
    },
    { status: 200 }
  );
}
