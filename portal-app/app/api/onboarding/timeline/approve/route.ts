import { randomUUID } from 'crypto';

import { NextResponse } from 'next/server';

import { generateTimelineFromVenue } from '@/lib/onboarding-timeline';
import { getSupabaseAdminClient, isSupabaseConfigured } from '@/lib/supabase-server';

interface ApproveBody {
  venueId?: unknown;
  weddingDate?: unknown;
  guestCount?: unknown;
  couplePrimaryName?: unknown;
  partnerName?: unknown;
  eventLabel?: unknown;
}

export async function POST(request: Request) {
  let body: ApproveBody;

  try {
    body = (await request.json()) as ApproveBody;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const venueId = typeof body.venueId === 'string' ? body.venueId.trim() : '';
  const weddingDate = typeof body.weddingDate === 'string' ? body.weddingDate.trim() : undefined;
  const guestCountRaw =
    typeof body.guestCount === 'number'
      ? body.guestCount
      : typeof body.guestCount === 'string'
        ? Number(body.guestCount)
        : Number.NaN;

  const couplePrimaryName =
    typeof body.couplePrimaryName === 'string' && body.couplePrimaryName.trim().length > 0
      ? body.couplePrimaryName.trim()
      : 'REVEL Couple';
  const partnerName =
    typeof body.partnerName === 'string' && body.partnerName.trim().length > 0 ? body.partnerName.trim() : null;
  const eventLabel =
    typeof body.eventLabel === 'string' && body.eventLabel.trim().length > 0
      ? body.eventLabel.trim()
      : 'Wedding Weekend';

  if (!venueId || !Number.isFinite(guestCountRaw)) {
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

  const guestCount = Math.max(0, Math.floor(guestCountRaw));

  if (!supabase) {
    return NextResponse.json(
      {
        mode: 'simulated',
        eventId: `sim-${randomUUID()}`,
        timelineCount: generation.items.length,
        venue: generation.venue.name,
        message: 'Supabase credentials missing. Timeline approved in simulation mode only.'
      },
      { status: 200 }
    );
  }

  const { data: venueRecord } = await supabase
    .from('venues')
    .select('venue_id')
    .eq('atlas_slug', generation.venue.id)
    .limit(1)
    .maybeSingle();

  const { data: eventInsert, error: eventError } = await supabase
    .from('events')
    .insert({
      couple_primary_name: couplePrimaryName,
      partner_name: partnerName,
      event_label: eventLabel,
      guest_count_estimate: guestCount,
      city: generation.venue.city,
      venue_id: venueRecord?.venue_id ?? null,
      status: 'draft',
      starts_on: generation.weddingDate.slice(0, 10)
    })
    .select('event_id')
    .single();

  if (eventError || !eventInsert) {
    return NextResponse.json({ error: 'event_insert_failed', details: eventError?.message }, { status: 500 });
  }

  const timelineRows = generation.items.map((item) => ({
    event_id: eventInsert.event_id,
    phase_code: item.phaseCode,
    title: item.title,
    scheduled_start: item.scheduledStartIso,
    scheduled_end: item.scheduledEndIso,
    status: 'pending',
    is_template_generated: true,
    atlas_prompt: item.atlasPrompt,
    escalation_hint: item.escalationHint,
    notes: null
  }));

  const { error: timelineError } = await supabase.from('timelines').insert(timelineRows);

  if (timelineError) {
    return NextResponse.json({ error: 'timeline_insert_failed', details: timelineError.message }, { status: 500 });
  }

  return NextResponse.json(
    {
      mode: isSupabaseConfigured() ? 'supabase' : 'simulated',
      eventId: eventInsert.event_id,
      timelineCount: timelineRows.length,
      venue: generation.venue.name,
      message: 'Timeline approved and saved.'
    },
    { status: 200 }
  );
}
