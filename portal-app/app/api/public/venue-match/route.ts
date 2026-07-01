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
Return valid JSON only — no markdown, no explanation, just the JSON object:
{
  "guestCount": number | null,
  "city": string | null,
  "style": string[]
}
Rules:
- guestCount: extract the lowest integer from any number/range mentioned. "500+ guests" → 500. "300-400 guests" → 300. Null only if no number at all.
- city: the most specific Georgia location mentioned (neighborhood, city, or suburb). "Buckhead" → "Buckhead". "near Atlanta" → "Atlanta". Default "Atlanta" for generic Georgia/Southeast references. Null only if no location clue exists.
- style: relevant style keywords from ["outdoor","ballroom","garden","rooftop","modern","traditional","intimate","grand"]. Empty array if none apply.`;

const GEORGIA_CITIES = ['atlanta','buckhead','alpharetta','marietta','decatur','sandy springs','dunwoody','smyrna','roswell','peachtree','gwinnett','duluth','johns creek','cumming','braselton','gainesville','savannah','augusta','macon'];

function preParsePrompt(prompt: string): Partial<MatchCriteria> {
  const lower = prompt.toLowerCase();
  const result: Partial<MatchCriteria> = {};

  // Extract guest count: grab the first number followed by optional + or range indicator
  const guestMatch = lower.match(/(\d{2,4})\+?\s*(?:guests?|people|attendees?|pax)/);
  if (guestMatch) {
    result.guestCount = parseInt(guestMatch[1], 10);
  }

  // Extract city: scan for known Georgia cities/neighborhoods
  for (const city of GEORGIA_CITIES) {
    if (lower.includes(city)) {
      // Title-case the city name
      result.city = city.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      break;
    }
  }

  return result;
}

function scoreVenue(venue: VenueRow, criteria: MatchCriteria): number {
  let score = 0;

  if (criteria.guestCount) {
    const cap = venue.marketed_capacity || 0;
    const min = venue.comfortable_range_min ?? (cap > 0 ? Math.round(cap * 0.6) : null);
    const max = venue.comfortable_range_max ?? (cap > 0 ? cap : null);
    if (min !== null && max !== null && criteria.guestCount >= min && criteria.guestCount <= max) {
      score += 40;
    } else if (min !== null && min > 0 && criteria.guestCount < min) {
      score += Math.round(40 * (criteria.guestCount / min));
    } else if (max !== null && max > 0 && criteria.guestCount > max) {
      if (criteria.guestCount / max <= 1.15) score += 20;
    } else {
      score += 15;
    }
  } else {
    score += 20;
  }

  // City relevance bonus: penalise venues outside the queried city.
  if (criteria.city && venue.city) {
    const vc = venue.city.toLowerCase();
    const qc = criteria.city.toLowerCase();
    if (vc.includes(qc) || qc.includes(vc)) {
      score += 20;
    } else {
      score -= 15;
    }
  }

  // Guard against non-numeric source_confidence (empty string, etc.)
  const rawConf = venue.source_confidence;
  const conf = (typeof rawConf === 'number' && Number.isFinite(rawConf)) ? rawConf : 0.5;
  score += Math.round(conf * 30);

  if (venue.verification_status === 'verified') score += 10;

  return Math.min(100, Math.max(0, score));
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const rawPrompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';

  if (!rawPrompt || rawPrompt.length > 500) {
    return NextResponse.json({ error: 'prompt required (max 500 chars)' }, { status: 400 });
  }

  // Regex pre-parse — always runs, provides a reliable baseline.
  const preParsed = preParsePrompt(rawPrompt);

  // Gemini fills in style keywords and may refine city/guestCount.
  let criteria: MatchCriteria = { ...preParsed };
  if (isGeminiConfigured()) {
    const extracted = await geminiGenerateJson<MatchCriteria>(rawPrompt, EXTRACT_SYSTEM).catch(() => null);
    if (extracted) {
      criteria = {
        guestCount: extracted.guestCount ?? preParsed.guestCount ?? null,
        city: extracted.city ?? preParsed.city ?? null,
        style: extracted.style ?? [],
      };
    }
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
