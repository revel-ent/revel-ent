import { NextResponse } from 'next/server';

import { getEventTimelineForRole, getEventTimelineFromPersistedRows } from '@/lib/mock-event-experience';
import { getSession } from '@/lib/session';
import { getSupabaseAdminClient } from '@/lib/supabase-server';

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!session.eventId) {
    return NextResponse.json({ error: 'Missing event context' }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();

  if (supabase && isUuid(session.eventId)) {
    const { data, error } = await supabase
      .from('timelines')
      .select('timeline_id,phase_code,title,scheduled_start,scheduled_end,status,escalation_hint,notes,atlas_prompt')
      .eq('event_id', session.eventId)
      .order('scheduled_start', { ascending: true });

    if (!error && data && data.length > 0) {
      return NextResponse.json({
        eventId: session.eventId,
        role: session.role,
        source: 'supabase',
        timeline: getEventTimelineFromPersistedRows({
          eventId: session.eventId,
          role: session.role,
          rows: data
        })
      });
    }
  }

  return NextResponse.json({
    eventId: session.eventId,
    role: session.role,
    source: 'mock',
    timeline: getEventTimelineForRole(session.eventId, session.role)
  });
}
