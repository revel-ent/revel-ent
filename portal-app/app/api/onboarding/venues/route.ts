import { NextResponse } from 'next/server';

import { listAtlasVenues } from '@/lib/atlas-venues';
import { canUseOnboardingApi } from '@/lib/auth';
import { getSession } from '@/lib/session';

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!canUseOnboardingApi(session.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const loaded = await listAtlasVenues();
  return NextResponse.json(loaded, { status: 200 });
}
