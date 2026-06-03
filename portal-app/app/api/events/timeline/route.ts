import { NextResponse } from 'next/server';

import { createTimelineResponse, buildBaseCanonicalTimeline, mapPersistedTimelineRows } from '@/lib/canonical-timeline';
import { requireEventRoleContext } from '@/lib/event-context';
import { getSupabaseAdminClient } from '@/lib/supabase-server';

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function GET() {
  const { context, response } = await requireEventRoleContext();

  if (response || !context) {
    return response as NextResponse;
  }

  const supabase = getSupabaseAdminClient();

  if (supabase && isUuid(context.eventId)) {
    const { data, error } = await supabase
      .from('timelines')
      .select('timeline_id,phase_code,title,scheduled_start,scheduled_end,status,escalation_hint,notes,atlas_prompt')
      .eq('event_id', context.eventId)
      .order('scheduled_start', { ascending: true });

    if (!error && data && data.length > 0) {
      return NextResponse.json(
        createTimelineResponse({
          eventId: context.eventId,
          role: context.role,
          source: 'supabase',
          items: mapPersistedTimelineRows(context.eventId, data)
        })
      );
    }
  }

  return NextResponse.json(
    createTimelineResponse({
      eventId: context.eventId,
      role: context.role,
      source: 'mock',
      items: buildBaseCanonicalTimeline(context.eventId)
    })
  );
}
