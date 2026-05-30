import { NextResponse } from 'next/server';

import { getCoordinationFeedByEvent } from '@/lib/mock-ops';
import { getSession } from '@/lib/session';

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!session.eventId) {
    return NextResponse.json({ error: 'Missing event context' }, { status: 400 });
  }

  if (!['admin', 'planner', 'vendor'].includes(session.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({
    eventId: session.eventId,
    items: getCoordinationFeedByEvent(session.eventId)
  });
}
