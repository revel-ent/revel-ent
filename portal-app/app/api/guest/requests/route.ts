import { NextResponse } from 'next/server';

import { getSession } from '@/lib/session';
import { getSupabaseAdminClient } from '@/lib/supabase-server';
import { resolveSessionUserUuid } from '@/lib/user-identity';

interface GuestRequestPayload {
  requestType: 'song' | 'dietary';
  details: string;
}

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!['guest', 'couple', 'delegate_coordinator', 'admin', 'planner'].includes(session.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!session.eventId) {
    return NextResponse.json({ error: 'Missing event context' }, { status: 400 });
  }

  const body = (await request.json()) as Partial<GuestRequestPayload>;
  const requestType = body.requestType;
  const details = String(body.details || '').trim();

  if (!requestType || !['song', 'dietary'].includes(requestType)) {
    return NextResponse.json({ error: 'Invalid request type' }, { status: 400 });
  }

  if (!details || details.length < 3) {
    return NextResponse.json({ error: 'Please provide request details' }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json({ error: 'persistence_unavailable' }, { status: 503 });
  }

  const actorUserId = resolveSessionUserUuid({ userId: session.userId, email: session.email });
  const now = new Date().toISOString();

  const { error: insertError } = await supabase.from('guest_requests').insert({
    event_id: session.eventId,
    actor_user_id: actorUserId,
    actor_email: session.email,
    actor_role: session.role,
    source: 'guest_request_portal',
    request_type: requestType,
    details,
    status: 'queued',
    created_at: now,
    updated_at: now
  });

  if (insertError) {
    return NextResponse.json({ error: 'guest_request_insert_failed', details: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, message: 'Request received. The planning team has been notified.' });
}
