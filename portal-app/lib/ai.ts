import { findEventById } from '@/lib/mock-data';

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

export function buildFusionFlowPlan(input: FusionFlowInput) {
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

export function buildVenueAnalyzerReport(input: VenueAnalyzerInput) {
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

export function extractAtlasSignalsFromDocument(params: {
  sourceType: string;
  content: string;
}): IntakeExtraction {
  const raw = params.content || '';
  const content = raw.slice(0, 120_000);

  const amountMatches = content.match(/\$\s?\d[\d,]*(?:\.\d{2})?/g) || [];
  const percentageMatches = content.match(/\b\d{1,3}%\b/g) || [];

  const monthDateMatches =
    content.match(
      /\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2}(?:,\s*\d{4})?/gi
    ) || [];

  const isoDateMatches = content.match(/\b\d{4}-\d{2}-\d{2}\b/g) || [];

  const signalKeywords = [
    'wire',
    'deposit',
    'balance due',
    'guest count',
    'timeline',
    'dietary',
    'attire',
    'baraat',
    'sangeet',
    'ceremony',
    'upgrade',
    'payment terms',
    'vendor'
  ];

  const lowered = content.toLowerCase();
  const keywordSignals = signalKeywords.filter((keyword) => lowered.includes(keyword));

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
      ? `Extracted ${extractedDates.length} date signals, ${extractedAmounts.length} amount signals, and ${keywordSignals.length} workflow keywords from ${params.sourceType}.`
      : `No strong structured signals detected from ${params.sourceType}. Keep file for retrieval and manual review.`;

  return {
    sourceType: params.sourceType,
    extractedDates,
    extractedAmounts,
    extractedPercentages,
    keywordSignals,
    summary,
    confidence: Number(confidence.toFixed(2))
  };
}
