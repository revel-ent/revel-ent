import { NextRequest, NextResponse } from 'next/server';

import { getCoordinationFeed, postCoordinationUpdate } from '@/lib/coordination';
import { getSession } from '@/lib/session';

const PLANNER_ROLES = ['admin', 'planner', 'ops'];
const READER_ROLES = ['admin', 'planner', 'ops', 'production', 'dj_mc', 'decorator', 'vendor'];

export async function GET() {
  const session = await getSession();

  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!session.eventId) return NextResponse.json({ error: 'Missing event context' }, { status: 400 });
  if (!READER_ROLES.includes(session.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { items, source } = await getCoordinationFeed(session.eventId);
  return NextResponse.json({ eventId: session.eventId, items, source });
}

export async function POST(req: NextRequest) {
  const session = await getSession();

  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!session.eventId) return NextResponse.json({ error: 'Missing event context' }, { status: 400 });
  if (!PLANNER_ROLES.includes(session.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = (await req.json()) as { message?: string };
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message) return NextResponse.json({ error: 'message is required' }, { status: 400 });

  const result = await postCoordinationUpdate({
    eventId: session.eventId,
    authorName: session.displayName,
    authorRole: session.role as 'planner' | 'ops' | 'admin',
    message,
  });

  if (!result) {
    return NextResponse.json({ error: 'Failed to post update — Supabase may not be configured' }, { status: 503 });
  }

  return NextResponse.json({ id: result.id }, { status: 201 });
}
