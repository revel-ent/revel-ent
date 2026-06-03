import { NextResponse } from 'next/server';

import { canUpdateLiveTimeline, requiresBoundedDayOfWindowForLiveUpdates } from '@/lib/auth';
import { buildBaseCanonicalTimeline, getTimelineProjectionForRole } from '@/lib/canonical-timeline';
import { getSession } from '@/lib/session';
import { getSupabaseAdminClient } from '@/lib/supabase-server';

interface UpdateRequestBody {
  stepId?: unknown;
  status?: unknown;
  note?: unknown;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function isWithinBoundedUpdateWindow(startIso: string, endIso: string | null): boolean {
  const now = Date.now();
  const start = new Date(startIso).getTime();
  const end = endIso ? new Date(endIso).getTime() : start + 30 * 60_000;

  const windowStart = start - 2 * 60 * 60_000;
  const windowEnd = end + 2 * 60 * 60_000;

  return now >= windowStart && now <= windowEnd;
}

export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!session.eventId) {
    return NextResponse.json({ error: 'Missing event context' }, { status: 400 });
  }

  if (!canUpdateLiveTimeline(session.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = (await request.json()) as UpdateRequestBody;
  const stepId = typeof body.stepId === 'string' ? body.stepId.trim() : '';
  const status = typeof body.status === 'string' ? body.status.trim() : '';
  const note = typeof body.note === 'string' ? body.note.trim() : '';
  const allowedStatuses = ['pending', 'ready', 'in_progress', 'completed', 'delayed', 'blocked'];

  if (!stepId || !status) {
    return NextResponse.json({ error: 'stepId and status are required' }, { status: 400 });
  }

  if (!allowedStatuses.includes(status)) {
    return NextResponse.json({ error: 'invalid_status' }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  if (supabase && isUuid(session.eventId) && isUuid(stepId)) {
    const { data: candidate, error: candidateError } = await supabase
      .from('timelines')
      .select('timeline_id,scheduled_start,scheduled_end,can_delegate_update')
      .eq('event_id', session.eventId)
      .eq('timeline_id', stepId)
      .maybeSingle();

    if (candidateError) {
      return NextResponse.json({ error: 'timeline_lookup_failed', details: candidateError.message }, { status: 500 });
    }

    if (!candidate) {
      return NextResponse.json({ error: 'timeline_not_found' }, { status: 404 });
    }

    if (requiresBoundedDayOfWindowForLiveUpdates(session.role)) {
      if (!candidate.can_delegate_update) {
        return NextResponse.json({ error: 'update_outside_delegate_window' }, { status: 403 });
      }

      if (!isWithinBoundedUpdateWindow(candidate.scheduled_start, candidate.scheduled_end)) {
        return NextResponse.json({ error: 'update_outside_delegate_window' }, { status: 403 });
      }
    }

    const { data, error } = await supabase
      .from('timelines')
      .update({
        status,
        notes: note || null,
        updated_at: new Date().toISOString()
      })
      .eq('event_id', session.eventId)
      .eq('timeline_id', stepId)
      .select('timeline_id,status,notes,updated_at')
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: 'timeline_update_failed', details: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'timeline_not_found' }, { status: 404 });
    }

    return NextResponse.json({
      mode: 'supabase',
      eventId: session.eventId,
      updatedBy: session.displayName,
      role: session.role,
      update: {
        stepId: data.timeline_id,
        status: data.status,
        note: data.notes || '',
        updatedAt: data.updated_at
      }
    });
  }

  if (requiresBoundedDayOfWindowForLiveUpdates(session.role)) {
    const step = getTimelineProjectionForRole(buildBaseCanonicalTimeline(session.eventId), session.role).find((item) => item.id === stepId);

    if (!step || !isWithinBoundedUpdateWindow(step.startsAtIso, step.endsAtIso)) {
      return NextResponse.json({ error: 'update_outside_delegate_window' }, { status: 403 });
    }
  }

  return NextResponse.json({
    mode: 'simulation',
    eventId: session.eventId,
    updatedBy: session.displayName,
    role: session.role,
    update: {
      stepId,
      status,
      note,
      updatedAt: new Date().toISOString()
    }
  });
}
