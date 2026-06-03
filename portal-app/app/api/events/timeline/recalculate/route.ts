import { NextResponse } from 'next/server';

import { buildBaseCanonicalTimeline, mapPersistedTimelineRows, recalculateTimeline } from '@/lib/canonical-timeline';
import { requireEventRoleContext } from '@/lib/event-context';
import { getSupabaseAdminClient } from '@/lib/supabase-server';

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function POST() {
  const { context, response } = await requireEventRoleContext({ allowedRoles: ['admin', 'planner'] });

  if (response || !context) {
    return response as NextResponse;
  }

  const supabase = getSupabaseAdminClient();
  if (supabase && isUuid(context.eventId)) {
    const { data, error } = await supabase
      .from('timelines')
      .select('timeline_id,phase_code,title,scheduled_start,scheduled_end,status,escalation_hint,notes,atlas_prompt,can_delegate_update')
      .eq('event_id', context.eventId)
      .order('scheduled_start', { ascending: true });

    if (error) {
      return NextResponse.json({ error: 'timeline_recalculate_failed', details: error.message }, { status: 500 });
    }

    const recalculated = recalculateTimeline(mapPersistedTimelineRows(context.eventId, data ?? []));
    return NextResponse.json({ mode: 'supabase', ...recalculated });
  }

  const recalculated = recalculateTimeline(buildBaseCanonicalTimeline(context.eventId));
  return NextResponse.json({ mode: 'simulation', ...recalculated });
}