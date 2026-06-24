import { NextResponse } from 'next/server';

import { runCapacityCheckLive, runVenueFeasibilityLive } from '@/lib/atlas-venues';
import { canUseOnboardingApi } from '@/lib/auth';
import { getSession } from '@/lib/session';

interface VenueCheckBody {
  venueId?: unknown;
  guestCount?: unknown;
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

  // Run the operational-truth feasibility triggers alongside the legacy comfortable-range check.
  // Persists when the planner is in an event context; otherwise returns inline for display only.
  const feasibility = await runVenueFeasibilityLive({
    venueId,
    eventId: session.eventId ?? null,
    desiredGuests: guestCount
  });

  return NextResponse.json(
    {
      ...result,
      atlasOutdoorPowerCurfew: feasibility?.atlasOutdoorPowerCurfew ?? null,
      atlasEvaluationPersistenceMode: feasibility?.atlasEvaluationPersistenceMode ?? 'skipped',
      recommendations: feasibility?.recommendations ?? []
    },
    { status: 200 }
  );
}
