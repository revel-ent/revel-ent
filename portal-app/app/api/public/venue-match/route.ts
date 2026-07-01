import { NextResponse } from 'next/server';

import { geminiGenerateJson, isGeminiConfigured } from '@/lib/gemini';
import { getSupabaseAdminClient } from '@/lib/supabase-server';

export const runtime = 'nodejs';

interface MatchCriteria {
  guestCount?: number | null;
  city?: string | null;
  style?: string[];
}

interface VenueRow {
  venue_id: string;
  name: string;
  room_name: string | null;
  city: string;
  state: string;
  marketed_capacity: number;
  comfortable_range_min: number | null;
  comfortable_range_max: number | null;
  source_confidence: number | null;
  verification_status: string | null;
}

const EXTRACT_SYSTEM = `You extract venue search criteria from natural language.
Return valid JSON only:
{
  "guestCount": number | null,
  "city": string | null,
  "style": string[]
}
Rules:
- guestCount: integer if mentioned ("300 guests" → 300). Null otherwise.
- city: city name if explicitly mentioned. Default "Atlanta" when region is Georgia/Southeast. Null if truly unclear.
- style: keywords like "outdoor", "modern", "traditional", "ballroom", "garden", "rooftop". Empty array if none.`;

function scoreVenue(venue: VenueRow, criteria: MatchCriteria): number {
  let score = 0;

  if (criteria.guestCount) {
    const min = venue.comfortable_range_min ?? Math.round(venue.marketed_capacity * 0.6);
    const max = venue.comfortable_range_max ?? venue.marketed_capacity;
    if (criteria.guestCount >= min && criteria.guestCount <= max) {
      score += 40;
    } else if (criteria.guestCount < min) {
      score += Math.round(40 * (criteria.guestCount / min));
    } else {
      const overRatio = criteria.guestCount / max;
      if (overRatio <= 1.15) score += 20;
    }
  } else {
    score += 20;
  }

  const conf = venue.source_confidence ?? 0.5;
  score += Math.round(conf * 40);

  if (venue.verification_status === 'verified') score += 20;

  return Math.min(100, score);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const rawPrompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';

  if (!rawPrompt || rawPrompt.length > 500) {
    return NextResponse.json({ error: 'prompt required (max 500 chars)' }, { status: 400 });
  }

  let criteria: MatchCriteria = {};
  if (isGeminiConfigured()) {
    const extracted = await geminiGenerateJson<MatchCriteria>(rawPrompt, EXTRACT_SYSTEM).catch(() => null);
    if (extracted) criteria = extracted;
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Venue data unavailable' }, { status: 503 });
  }

  let query = supabase
    .from('venues')
    .select(
      'venue_id, name, room_name, city, state, marketed_capacity, comfortable_range_min, comfortable_range_max, source_confidence, verification_status'
    )
    .order('source_confidence', { ascending: false })
    .limit(40);

  if (criteria.city) {
    query = query.ilike('city', `%${criteria.city}%`);
  }

  const { data: venues } = await query;

  if (!venues || venues.length === 0) {
    return NextResponse.json({ results: [], criteria });
  }

  const scored = (venues as VenueRow[])
    .map((v) => ({
      id: v.venue_id,
      name: v.name,
      roomName: v.room_name,
      city: v.city,
      state: v.state,
      capacityMin: v.comfortable_range_min ?? Math.round(v.marketed_capacity * 0.6),
      capacityMax: v.comfortable_range_max ?? v.marketed_capacity,
      marketedCapacity: v.marketed_capacity,
      verified: v.verification_status === 'verified',
      matchScore: scoreVenue(v as VenueRow, criteria),
    }))
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 6);

  return NextResponse.json({ results: scored, criteria });
}
