import { findEventById } from '@/lib/mock-data';
import { geminiGenerateJson, isGeminiConfigured } from '@/lib/gemini';

export interface FusionFlowInput {
  eventId: string;
  cultureBlend: string;
  vibeGoal: string;
  mustPlayTracks: string;
  guestCount: number;
}

export interface VenueAnalyzerInput {
  eventId: string;
  venueName: string;
  guestCount: number;
  ceilingHeightFt: number;
  roomType: string;
}

export interface IntakeExtraction {
  sourceType: string;
  extractedDates: string[];
  extractedAmounts: string[];
  extractedPercentages: string[];
  keywordSignals: string[];
  summary: string;
  confidence: number;
}

export interface FusionFlowMoment {
  phase: string;
  musicDirection: string;
  lightingState: string;
}

export interface FusionFlowPlan {
  event: string;
  assumptions: string[];
  timelineMoments: FusionFlowMoment[];
  nextBestAction: string;
  confidence: number;
}

export interface VenueAnalyzerReport {
  event: string;
  venue: string;
  roomType: string;
  required: string[];
  riskFlags: string[];
  trustMetadata: {
    sourceType: string;
    reviewedBy: string;
    reviewedOn: string;
    confidenceScore: number;
  };
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

function heuristicFusionFlowPlan(input: FusionFlowInput): FusionFlowPlan {
  const event = findEventById(input.eventId);
  const crowdScale = input.guestCount >= 300 ? 'high-density crowd' : 'mid-density crowd';

  return {
    event: event?.title || 'Unknown Event',
    assumptions: [
      `Culture blend focus: ${input.cultureBlend}`,
      `Guest volume profile: ${crowdScale}`,
      `Primary energy goal: ${input.vibeGoal}`
    ],
    timelineMoments: [
      {
        phase: 'Arrival + Cocktail',
        musicDirection: 'Warm open-format with cultural cues at low BPM',
        lightingState: 'Ambient gold wash with soft perimeter uplighting'
      },
      {
        phase: 'Grand Entry + First Peak',
        musicDirection: `Transition into high-impact entry sequence. Seed tracks around: ${input.mustPlayTracks}`,
        lightingState: 'Dynamic moving heads + controlled haze where venue allows'
      },
      {
        phase: 'Dance Floor Sustain',
        musicDirection: 'Alternate diaspora anthems with crossover resets every 3-4 songs',
        lightingState: 'Peak program with alternating color temperatures for crowd resets'
      }
    ],
    nextBestAction: 'Route to consultation with this draft attached and lock production package assumptions.',
    confidence: 0.84
  };
}

async function geminiFusionFlowPlan(input: FusionFlowInput): Promise<FusionFlowPlan | null> {
  if (!isGeminiConfigured()) {
    return null;
  }

  const system =
    'You are a wedding music and experience director. You design how music and lighting evolve across an event\'s key moments, honoring the couple\'s specific cultural blend. You work with every culture and tradition — weave the traditions actually named in the blend and never default to one. Return only valid JSON.';

  const prompt = `Design the music and lighting arc for this wedding. Return JSON with exactly these fields:
{
  "assumptions": string[],
  "timelineMoments": [{ "phase": string, "musicDirection": string, "lightingState": string }],
  "nextBestAction": string
}

Rules:
- assumptions: 3-4 short planning assumptions you are making.
- timelineMoments: 3-5 moments in chronological order. musicDirection and lightingState are one concise sentence each.
- Honor the cultural blend and the must-play seeds; scale energy to the guest count and the stated vibe goal.
- nextBestAction: one concrete next step for the planner.

Cultural blend: ${input.cultureBlend}
Vibe goal: ${input.vibeGoal}
Must-play seeds: ${input.mustPlayTracks}
Guest count: ${input.guestCount}`;

  try {
    const raw = await geminiGenerateJson<{ assumptions?: unknown; timelineMoments?: unknown; nextBestAction?: unknown }>(
      prompt,
      system
    );

    if (!raw) {
      return null;
    }

    const assumptions = toStringArray(raw.assumptions).slice(0, 6);
    const timelineMoments = (Array.isArray(raw.timelineMoments) ? raw.timelineMoments : [])
      .map((entry) => {
        const moment = entry as { phase?: unknown; musicDirection?: unknown; lightingState?: unknown };
        return {
          phase: typeof moment.phase === 'string' ? moment.phase : '',
          musicDirection: typeof moment.musicDirection === 'string' ? moment.musicDirection : '',
          lightingState: typeof moment.lightingState === 'string' ? moment.lightingState : ''
        };
      })
      .filter((moment) => moment.phase && moment.musicDirection)
      .slice(0, 6);
    const nextBestAction = typeof raw.nextBestAction === 'string' && raw.nextBestAction ? raw.nextBestAction : '';

    if (assumptions.length === 0 || timelineMoments.length === 0 || !nextBestAction) {
      return null;
    }

    const event = findEventById(input.eventId);

    return {
      event: event?.title || 'Unknown Event',
      assumptions,
      timelineMoments,
      nextBestAction,
      confidence: 0.88
    };
  } catch {
    return null;
  }
}

export async function buildFusionFlowPlan(input: FusionFlowInput): Promise<FusionFlowPlan> {
  const aiPlan = await geminiFusionFlowPlan(input);
  return aiPlan ?? heuristicFusionFlowPlan(input);
}

function heuristicVenueAnalyzerReport(input: VenueAnalyzerInput): VenueAnalyzerReport {
  const event = findEventById(input.eventId);
  const verticalCoverageRisk = input.ceilingHeightFt >= 20;
  const crowdRisk = input.guestCount >= 320;

  const required = [
    'Dedicated DJ booth power isolation',
    'Wireless microphone redundancy (minimum two handheld + one lav)'
  ];

  if (verticalCoverageRisk) {
    required.push('Vertical truss or elevated fixture strategy for room saturation');
  }

  if (crowdRisk) {
    required.push('Expanded speaker coverage zones to prevent dead pockets');
  }

  return {
    event: event?.title || 'Unknown Event',
    venue: input.venueName,
    roomType: input.roomType,
    required,
    riskFlags: [
      verticalCoverageRisk ? 'Ceiling height may dilute standard uplighting coverage.' : 'Ceiling height within standard range.',
      crowdRisk ? 'Guest volume indicates potential bottlenecks for dancefloor flow.' : 'Guest volume within standard circulation range.'
    ],
    trustMetadata: {
      sourceType: 'ops-model-v1',
      reviewedBy: 'REVEL Production Team',
      reviewedOn: '2026-05-22',
      confidenceScore: 0.8
    }
  };
}

async function geminiVenueAnalyzerReport(input: VenueAnalyzerInput): Promise<VenueAnalyzerReport | null> {
  if (!isGeminiConfigured()) {
    return null;
  }

  const system =
    'You are a live-event production advisor for weddings of every culture. Given a room\'s basic specs you recommend the production elements the event will need and flag logistical risks. Base everything on the specs provided; never invent specific venue facts you were not given. Return only valid JSON.';

  const prompt = `Analyze this venue room for a wedding. Return JSON with exactly these fields:
{
  "required": string[],
  "riskFlags": string[]
}

Rules:
- required: 4-7 production elements this room and guest count will need (audio coverage, power, rigging, staging, etc.).
- riskFlags: 2-5 logistical risks given the specs; if a dimension looks fine, say so plainly rather than inventing a risk.
- Be specific to the numbers given. Do not assume a culture or invent facts not provided.

Venue: ${input.venueName}
Room type: ${input.roomType}
Guest count: ${input.guestCount}
Ceiling height (ft): ${input.ceilingHeightFt}`;

  try {
    const raw = await geminiGenerateJson<{ required?: unknown; riskFlags?: unknown }>(prompt, system);

    if (!raw) {
      return null;
    }

    const required = toStringArray(raw.required).slice(0, 8);
    const riskFlags = toStringArray(raw.riskFlags).slice(0, 6);

    if (required.length === 0) {
      return null;
    }

    const event = findEventById(input.eventId);

    return {
      event: event?.title || 'Unknown Event',
      venue: input.venueName,
      roomType: input.roomType,
      required,
      riskFlags,
      trustMetadata: {
        sourceType: 'atlas-ai-v1',
        reviewedBy: 'Atlas AI (model-generated draft)',
        reviewedOn: new Date().toISOString().slice(0, 10),
        confidenceScore: 0.84
      }
    };
  } catch {
    return null;
  }
}

export async function buildVenueAnalyzerReport(input: VenueAnalyzerInput): Promise<VenueAnalyzerReport> {
  const aiReport = await geminiVenueAnalyzerReport(input);
  return aiReport ?? heuristicVenueAnalyzerReport(input);
}

// Universal contract / logistics terms — material to a wedding of ANY culture.
const UNIVERSAL_CONTRACT_KEYWORDS = [
  'wire',
  'deposit',
  'balance due',
  'payment terms',
  'gratuity',
  'service charge',
  'cancellation',
  'force majeure',
  'certificate of insurance',
  'guest count',
  'timeline',
  'load-in',
  'curfew',
  'overtime',
  'dietary',
  'attire',
  'upgrade',
  'vendor'
];

// Representative wedding-function / ritual names across traditions. These seed
// the AI extractor and back the regex fallback. This is deliberately NOT an
// allowlist — the AI path surfaces any function or ritual it identifies in the
// document's own vocabulary, including traditions not enumerated here.
const MULTI_TRADITION_FUNCTION_KEYWORDS = [
  // South Asian
  'mehndi',
  'haldi',
  'sangeet',
  'baraat',
  'ceremony',
  'reception',
  'vidaai',
  // Jewish
  'hora',
  'ketubah',
  'chuppah',
  'bedeken',
  // Christian / Western
  'processional',
  'recessional',
  'rehearsal dinner',
  'first look',
  'cocktail hour',
  // East Asian
  'tea ceremony',
  // West African
  'traditional ceremony',
  'white wedding'
];

const SIGNAL_KEYWORDS = [...UNIVERSAL_CONTRACT_KEYWORDS, ...MULTI_TRADITION_FUNCTION_KEYWORDS];

interface GeminiExtractionShape {
  extractedDates: string[];
  extractedAmounts: string[];
  extractedPercentages: string[];
  keywordSignals: string[];
  summary: string;
}

function regexExtractSignals(sourceType: string, content: string): IntakeExtraction {
  const amountMatches = content.match(/\$\s?\d[\d,]*(?:\.\d{2})?/g) || [];
  const percentageMatches = content.match(/\b\d{1,3}(?:\.\d+)?\s?%/g) || [];

  const monthDateMatches =
    content.match(
      /\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2}(?:,\s*\d{4})?/gi
    ) || [];

  const isoDateMatches = content.match(/\b\d{4}-\d{2}-\d{2}\b/g) || [];

  const lowered = content.toLowerCase();
  const keywordSignals = SIGNAL_KEYWORDS.filter((keyword) => lowered.includes(keyword));

  const extractedDates = Array.from(new Set([...monthDateMatches, ...isoDateMatches])).slice(0, 16);
  const extractedAmounts = Array.from(new Set(amountMatches)).slice(0, 16);
  const extractedPercentages = Array.from(new Set(percentageMatches)).slice(0, 10);

  const confidenceBase = 0.45;
  const confidence = Math.min(
    0.93,
    confidenceBase +
      Math.min(0.2, extractedDates.length * 0.03) +
      Math.min(0.2, extractedAmounts.length * 0.04) +
      Math.min(0.08, extractedPercentages.length * 0.02) +
      Math.min(0.1, keywordSignals.length * 0.01)
  );

  const summary =
    extractedAmounts.length || extractedDates.length
      ? `Extracted ${extractedDates.length} date signals, ${extractedAmounts.length} amount signals, and ${keywordSignals.length} workflow keywords from ${sourceType}.`
      : `No strong structured signals detected from ${sourceType}. Keep file for retrieval and manual review.`;

  return {
    sourceType,
    extractedDates,
    extractedAmounts,
    extractedPercentages,
    keywordSignals,
    summary,
    confidence: Number(confidence.toFixed(2))
  };
}

async function geminiExtractSignals(sourceType: string, content: string): Promise<IntakeExtraction | null> {
  if (!isGeminiConfigured() || !content.trim()) {
    return null;
  }

  const system =
    'You are a document analyst for a wedding planning platform that serves couples of every culture and tradition — South Asian, Jewish, Christian, East Asian, African, Latin, Middle Eastern, secular, interfaith, and beyond. Read each contract, proposal, or event document on its own terms. Never assume a single culture; use the vocabulary the document itself uses. Return only valid JSON.';

  const prompt = `Extract structured data from this ${sourceType} document and return JSON with exactly these fields:
{
  "extractedDates": string[],
  "extractedAmounts": string[],
  "extractedPercentages": string[],
  "keywordSignals": string[],
  "summary": string
}

Rules:
- extractedDates: date references found, max 16 items (e.g. "March 14, 2026", "2026-03-14")
- extractedAmounts: monetary amounts, max 16 items (e.g. "$5,000.00", "$1,500")
- extractedPercentages: percentage values, max 10 items (e.g. "25%", "10%")
- keywordSignals: the wedding functions, rituals, and material contract obligations this document actually references, in the document's own words and culture. Examples spanning traditions: ${SIGNAL_KEYWORDS.join(', ')}. This list is illustrative, NOT exhaustive — include ANY culturally specific function or obligation you identify even if it is absent from the examples. Max 24 items.
- summary: 1-2 sentences describing what this document covers, the tradition(s) it appears to serve, and its key obligations

Document:
${content.slice(0, 60_000)}`;

  try {
    const raw = await geminiGenerateJson<GeminiExtractionShape>(prompt, system);

    if (!raw) {
      return null;
    }

    const dates = Array.isArray(raw.extractedDates) ? raw.extractedDates.slice(0, 16) : [];
    const amounts = Array.isArray(raw.extractedAmounts) ? raw.extractedAmounts.slice(0, 16) : [];
    const percentages = Array.isArray(raw.extractedPercentages) ? raw.extractedPercentages.slice(0, 10) : [];
    const keywords = Array.isArray(raw.keywordSignals) ? raw.keywordSignals.slice(0, 24) : [];
    const summary = typeof raw.summary === 'string' && raw.summary ? raw.summary : `Extracted from ${sourceType}.`;

    const confidenceBase = 0.62;
    const confidence = Math.min(
      0.97,
      confidenceBase +
        Math.min(0.15, dates.length * 0.02) +
        Math.min(0.15, amounts.length * 0.03) +
        Math.min(0.05, percentages.length * 0.01) +
        Math.min(0.05, keywords.length * 0.005)
    );

    return {
      sourceType,
      extractedDates: dates,
      extractedAmounts: amounts,
      extractedPercentages: percentages,
      keywordSignals: keywords,
      summary,
      confidence: Number(confidence.toFixed(2))
    };
  } catch {
    return null;
  }
}

export async function extractAtlasSignalsFromDocument(params: {
  sourceType: string;
  content: string;
}): Promise<IntakeExtraction> {
  const content = (params.content || '').slice(0, 120_000);

  const geminiResult = await geminiExtractSignals(params.sourceType, content);

  if (geminiResult) {
    return geminiResult;
  }

  return regexExtractSignals(params.sourceType, content);
}
