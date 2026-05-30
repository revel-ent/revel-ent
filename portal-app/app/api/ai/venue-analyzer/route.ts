import { NextResponse } from 'next/server';

import { buildVenueAnalyzerReport } from '@/lib/ai';
import { getSession } from '@/lib/session';

export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!['admin', 'planner', 'vendor', 'couple'].includes(session.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const guestCount = Number(body.guestCount || 0);
  const ceilingHeightFt = Number(body.ceilingHeightFt || 0);

  if (!session.eventId) {
    return NextResponse.json({ error: 'Missing event context' }, { status: 400 });
  }

  const result = buildVenueAnalyzerReport({
    eventId: session.eventId,
    venueName: String(body.venueName || 'Unknown Venue'),
    roomType: String(body.roomType || 'Ballroom'),
    guestCount: Number.isFinite(guestCount) && guestCount > 0 ? guestCount : 250,
    ceilingHeightFt: Number.isFinite(ceilingHeightFt) && ceilingHeightFt > 0 ? ceilingHeightFt : 18
  });

  return NextResponse.json(result);
}
