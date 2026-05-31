import { NextResponse } from 'next/server';

import { canUseOnboardingApi } from '@/lib/auth';
import { generateTimelineFromVenue } from '@/lib/onboarding-timeline';
import { getSession } from '@/lib/session';
import { getSupabaseAdminClient, isSupabaseConfigured } from '@/lib/supabase-server';

interface GenerateBody {
  venueId?: unknown;
  weddingDate?: unknown;
}

export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!canUseOnboardingApi(session.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: GenerateBody;

  try {
    body = (await request.json()) as GenerateBody;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const venueId = typeof body.venueId === 'string' ? body.venueId.trim() : '';
  const weddingDate = typeof body.weddingDate === 'string' ? body.weddingDate.trim() : undefined;

  if (!venueId) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();

  const generation = await generateTimelineFromVenue({
    venueId,
    weddingDate,
    fetchTemplates: async () => {
      if (!supabase) {
        return null;
      }

      const { data, error } = await supabase
        .from('timeline_templates')
        .select('phase_code,title,offset_minutes,default_duration_minutes,requires_venue_check')
        .eq('template_key', 'south_asian_weekend_v1')
        .eq('active', true);

      if (error || !data) {
        return null;
      }

      return data;
    }
  });

  if (!generation) {
    return NextResponse.json({ error: 'venue_not_found' }, { status: 404 });
  }

  return NextResponse.json(
    {
      ...generation,
      persistenceMode: isSupabaseConfigured() ? 'supabase_configured' : 'simulated'
    },
    { status: 200 }
  );
}
