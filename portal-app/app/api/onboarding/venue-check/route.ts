import { NextResponse } from 'next/server';

import { runCapacityCheck } from '@/lib/atlas-venues';

interface VenueCheckBody {
  venueId?: unknown;
  guestCount?: unknown;
}

export async function POST(request: Request) {
  let body: VenueCheckBody;

  try {
    body = (await request.json()) as VenueCheckBody;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const venueId = typeof body.venueId === 'string' ? body.venueId.trim() : '';
  const guestCount =
    typeof body.guestCount === 'number'
      ? body.guestCount
      : typeof body.guestCount === 'string'
        ? Number(body.guestCount)
        : Number.NaN;

  if (!venueId || !Number.isFinite(guestCount)) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  }

  const result = runCapacityCheck({ venueId, guestCount });

  if (!result) {
    return NextResponse.json({ error: 'venue_not_found' }, { status: 404 });
  }

  return NextResponse.json(result, { status: 200 });
}
