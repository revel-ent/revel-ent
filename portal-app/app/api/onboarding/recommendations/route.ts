import { NextResponse } from 'next/server';

import { listActiveAtlasRecommendations } from '@/lib/atlas-evaluations';
import { canUseOnboardingApi } from '@/lib/auth';
import { getSession } from '@/lib/session';

export async function GET(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!canUseOnboardingApi(session.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!session.eventId) {
    return NextResponse.json({ error: 'Missing event context' }, { status: 400 });
  }

  const url = new URL(request.url);
  const limitParam = url.searchParams.get('limit');
  const limit = limitParam ? Number(limitParam) : undefined;

  const payload = await listActiveAtlasRecommendations({
    eventId: session.eventId,
    limit: Number.isFinite(limit) ? limit : undefined
  });

  return NextResponse.json(payload, { status: 200 });
}