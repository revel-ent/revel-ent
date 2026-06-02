import { NextResponse } from 'next/server';

import { runCapacityCheckLive, runOutdoorPowerCurfewLive } from '@/lib/atlas-venues';
import { canUseOnboardingApi } from '@/lib/auth';
import { getSession } from '@/lib/session';

interface VenueCheckBody {
  venueId?: unknown;
  guestCount?: unknown;
  ceremonyOutdoors?: unknown;
  baraatOutdoors?: unknown;
}

function toOptionalBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') {
    return value;
  }

  return undefined;
}

export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!canUseOnboardingApi(session.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: VenueCheckBody;

  try {
    body = (await request.json()) as VenueCheckBody;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const venueId = typeof body.venueId === 'string' ? body.venueId.trim() : '';
  const ceremonyOutdoors = toOptionalBoolean(body.ceremonyOutdoors);
  const baraatOutdoors = toOptionalBoolean(body.baraatOutdoors);
  const guestCount =
    typeof body.guestCount === 'number'
      ? body.guestCount
      : typeof body.guestCount === 'string'
        ? Number(body.guestCount)
        : Number.NaN;

  if (!venueId || !Number.isFinite(guestCount)) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  }

  const result = await runCapacityCheckLive({ venueId, guestCount });

  if (!result) {
    return NextResponse.json({ error: 'venue_not_found' }, { status: 404 });
  }

  const outdoorRecommendation = await runOutdoorPowerCurfewLive({
    venueId,
    eventId: session.eventId,
    ceremonyOutdoors,
    baraatOutdoors
  });

  return NextResponse.json(
    {
      ...result,
      atlasOutdoorPowerCurfew: outdoorRecommendation?.recommendation ?? null,
      atlasEvaluationPersistenceMode: outdoorRecommendation?.persistenceMode ?? 'skipped'
    },
    { status: 200 }
  );
}
