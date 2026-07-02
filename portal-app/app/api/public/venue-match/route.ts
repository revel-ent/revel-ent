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

interface VenueConstraintRow {
  venue_id: string;
  key: string;
  value_text: string | null;
  value_number: number | null;
  value_boolean: boolean | null;
  source_confidence: string | null;
}

interface PolicyFact {
  label: string;
  confirmed: boolean;
}

// Order reflects what most affects a South Asian wedding's venue decision:
// curfew (late-night sangeet/reception), catering (halal/veg vendors), then
// fire/effects policy (agni pheras, sparks, haze during the reception show).
const POLICY_KEY_PRIORITY = [
  'curfew_time',
  'outside_catering_allowed',
  'open_flame_allowed',
  'cold_sparks_allowed',
  'haze_allowed',
] as const;

const MAX_POLICY_FACTS_PER_VENUE = 4;

function formatTime12h(raw: string): string {
  const match = raw.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return raw;
  const hour24 = parseInt(match[1], 10);
  const minute = match[2];
  const period = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:${minute} ${period}`;
}

function formatPolicyFact(row: VenueConstraintRow): PolicyFact | null {
  const confirmed = row.source_confidence === 'measured' || row.source_confidence === 'venue_doc';

  if (row.key === 'curfew_time' && row.value_text) {
    return { label: `${formatTime12h(row.value_text)} curfew`, confirmed };
  }

  if (row.value_boolean === null) return null;

  const labels: Record<string, [string, string]> = {
    outside_catering_allowed: ['Outside catering allowed', 'No outside catering'],
    open_flame_allowed: ['Open flame allowed', 'No open flame'],
    cold_sparks_allowed: ['Cold sparks allowed', 'No cold sparks'],
    haze_allowed: ['Haze effects allowed', 'No haze effects'],
  };

  const pair = labels[row.key];
  if (!pair) return null;

  return { label: row.value_boolean ? pair[0] : pair[1], confirmed };
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
    .map((v) => {
      const capacityMax = v.comfortable_range_max ?? v.marketed_capacity;
      // Derive the floor from whichever ceiling we're actually using — a real seated/banquet
      // figure (comfortable_range_max) is often well below marketed_capacity (theater/standing),
      // so basing the 60% floor on the inflated marketed number can push it above the real max.
      const capacityMin = v.comfortable_range_min ?? Math.round(capacityMax * 0.6);
      return {
        id: v.venue_id,
        name: v.name,
        roomName: v.room_name,
        city: v.city,
        state: v.state,
        capacityMin,
        capacityMax,
        marketedCapacity: v.marketed_capacity,
        verified: v.verification_status === 'verified',
        matchScore: scoreVenue(v as VenueRow, criteria),
        policyFacts: [] as PolicyFact[],
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 6);

  const { data: constraints } = await supabase
    .from('venue_constraints')
    .select('venue_id, key, value_text, value_number, value_boolean, source_confidence')
    .eq('category', 'policy')
    .in('venue_id', scored.map((v) => v.id));

  if (constraints) {
    const byVenue = new Map<string, VenueConstraintRow[]>();
    for (const row of constraints as VenueConstraintRow[]) {
      const list = byVenue.get(row.venue_id) ?? [];
      list.push(row);
      byVenue.set(row.venue_id, list);
    }

    for (const venue of scored) {
      const rows = byVenue.get(venue.id) ?? [];
      const facts = POLICY_KEY_PRIORITY
        .map((key) => rows.find((r) => r.key === key))
        .filter((row): row is VenueConstraintRow => Boolean(row))
        .map(formatPolicyFact)
        .filter((fact): fact is PolicyFact => fact !== null)
        .slice(0, MAX_POLICY_FACTS_PER_VENUE);
      venue.policyFacts = facts;
    }
  }

  return NextResponse.json({ results: scored, criteria });
}
