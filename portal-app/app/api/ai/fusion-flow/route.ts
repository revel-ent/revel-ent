import { NextResponse } from 'next/server';

import { buildFusionFlowPlan } from '@/lib/ai';
import { getSession } from '@/lib/session';

export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!['admin', 'couple', 'planner'].includes(session.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const guestCount = Number(body.guestCount || 0);

  if (!session.eventId) {
    return NextResponse.json({ error: 'Missing event context' }, { status: 400 });
  }

  const result = await buildFusionFlowPlan({
    eventId: session.eventId,
    cultureBlend: String(body.cultureBlend || 'South Asian + Fusion'),
    vibeGoal: String(body.vibeGoal || 'High energy, premium flow'),
    mustPlayTracks: String(body.mustPlayTracks || 'Custom set list'),
    guestCount: Number.isFinite(guestCount) && guestCount > 0 ? guestCount : 250
  });

  return NextResponse.json(result);
}
