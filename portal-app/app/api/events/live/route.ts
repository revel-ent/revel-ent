import { NextResponse } from 'next/server';

import { canUseLiveMode } from '@/lib/auth';
import { buildLiveSnapshotFromTimeline, getEventTimelineFromPersistedRows, getLiveSnapshot } from '@/lib/mock-event-experience';
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

  if (!canUseLiveMode(session.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabase = getSupabaseAdminClient();

  if (supabase && isUuid(session.eventId)) {
    const { data, error } = await supabase
      .from('timelines')
      .select('timeline_id,phase_code,title,scheduled_start,scheduled_end,status,escalation_hint,notes,atlas_prompt')
      .eq('event_id', session.eventId)
      .order('scheduled_start', { ascending: true });

    if (!error && data && data.length > 0) {
      const timeline = getEventTimelineFromPersistedRows({
        eventId: session.eventId,
        role: session.role,
        rows: data
      });

      return NextResponse.json({
        ...buildLiveSnapshotFromTimeline({
          eventId: session.eventId,
          role: session.role,
          timeline
        }),
        source: 'supabase'
      });
    }
  }

  return NextResponse.json({
    ...getLiveSnapshot(session.eventId, session.role),
    source: 'mock'
  });
}
