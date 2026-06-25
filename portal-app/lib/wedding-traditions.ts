/**
 * Wedding tradition registry.
 *
 * Atlas was built South-Asian-first, but the planning engine is not. Each
 * tradition declares the functions that make up its weekend, with relative
 * offsets to the same anchor the onboarding generator uses (the primary
 * ceremony day at 5:00 PM local = offset 0). This is what makes Atlas
 * adaptable to any wedding: the generator, validator, and assistant all read
 * from this data instead of assuming one culture.
 *
 * IMPORTANT: the primary ceremony and primary reception MUST keep the canonical
 * phase codes `ceremony` and `reception` in every tradition. Timeline
 * validation (lib/atlas-operational-truth/timeline-validation.ts) matches those
 * exact codes to measure curfew and room-flip risk, so reusing them keeps the
 * feasibility checks working for every culture. Culture-specific functions
 * (mehndi, hora, tea_ceremony, ...) use their own codes.
 */

export interface WeddingFunctionTemplate {
  phaseCode: string;
  phaseLabel: string;
  title: string;
  offsetMinutes: number;
  defaultDurationMinutes: number;
  requiresVenueCheck: boolean;
}

export interface WeddingTradition {
  key: string;
  label: string;
  description: string;
  functions: WeddingFunctionTemplate[];
}

export const DEFAULT_TRADITION_KEY = 'south_asian';

const SOUTH_ASIAN: WeddingTradition = {
  key: 'south_asian',
  label: 'South Asian',
  description: 'Multi-day weekend — mehndi, haldi, sangeet, baraat, ceremony, and reception.',
  functions: [
    { phaseCode: 'mehndi', phaseLabel: 'Mehndi', title: 'Mehndi Setup Complete', offsetMinutes: -1560, defaultDurationMinutes: 60, requiresVenueCheck: false },
    { phaseCode: 'haldi', phaseLabel: 'Haldi', title: 'Haldi Family Assembly', offsetMinutes: -840, defaultDurationMinutes: 45, requiresVenueCheck: false },
    { phaseCode: 'sangeet', phaseLabel: 'Sangeet', title: 'Sangeet Production Check', offsetMinutes: -300, defaultDurationMinutes: 30, requiresVenueCheck: true },
    { phaseCode: 'baraat', phaseLabel: 'Baraat', title: 'Baraat Staging Ready', offsetMinutes: -90, defaultDurationMinutes: 20, requiresVenueCheck: true },
    { phaseCode: 'ceremony', phaseLabel: 'Ceremony', title: 'Ceremony Guest Seating Open', offsetMinutes: -45, defaultDurationMinutes: 30, requiresVenueCheck: false },
    { phaseCode: 'reception', phaseLabel: 'Reception', title: 'Reception Room Reset Complete', offsetMinutes: 90, defaultDurationMinutes: 45, requiresVenueCheck: true }
  ]
};

const JEWISH: WeddingTradition = {
  key: 'jewish',
  label: 'Jewish',
  description: 'Tisch and bedeken, ketubah signing, chuppah ceremony, and a reception with the hora.',
  functions: [
    { phaseCode: 'tisch_bedeken', phaseLabel: 'Tisch & Bedeken', title: 'Tisch & Bedeken Begin', offsetMinutes: -120, defaultDurationMinutes: 45, requiresVenueCheck: false },
    { phaseCode: 'ketubah', phaseLabel: 'Ketubah Signing', title: 'Ketubah Signing', offsetMinutes: -75, defaultDurationMinutes: 30, requiresVenueCheck: false },
    { phaseCode: 'ceremony', phaseLabel: 'Ceremony', title: 'Chuppah Ceremony Begins', offsetMinutes: -45, defaultDurationMinutes: 30, requiresVenueCheck: false },
    { phaseCode: 'cocktail_hour', phaseLabel: 'Cocktail Hour', title: 'Cocktail Hour Opens', offsetMinutes: 0, defaultDurationMinutes: 60, requiresVenueCheck: true },
    { phaseCode: 'reception', phaseLabel: 'Reception', title: 'Reception & Hora Grand Entrance', offsetMinutes: 75, defaultDurationMinutes: 45, requiresVenueCheck: true }
  ]
};

const WESTERN_CHRISTIAN: WeddingTradition = {
  key: 'western_christian',
  label: 'Western / Christian',
  description: 'Rehearsal dinner, first look, processional ceremony, cocktail hour, and reception.',
  functions: [
    { phaseCode: 'rehearsal_dinner', phaseLabel: 'Rehearsal Dinner', title: 'Rehearsal Dinner', offsetMinutes: -1200, defaultDurationMinutes: 90, requiresVenueCheck: false },
    { phaseCode: 'first_look', phaseLabel: 'First Look', title: 'First Look & Portraits', offsetMinutes: -120, defaultDurationMinutes: 45, requiresVenueCheck: false },
    { phaseCode: 'ceremony', phaseLabel: 'Ceremony', title: 'Ceremony Processional Begins', offsetMinutes: -45, defaultDurationMinutes: 30, requiresVenueCheck: false },
    { phaseCode: 'cocktail_hour', phaseLabel: 'Cocktail Hour', title: 'Cocktail Hour Opens', offsetMinutes: 0, defaultDurationMinutes: 60, requiresVenueCheck: true },
    { phaseCode: 'reception', phaseLabel: 'Reception', title: 'Reception Grand Entrance', offsetMinutes: 75, defaultDurationMinutes: 45, requiresVenueCheck: true }
  ]
};

const EAST_ASIAN: WeddingTradition = {
  key: 'east_asian',
  label: 'East Asian',
  description: 'Tea ceremony, wedding ceremony, cocktail reception, and a banquet grand entrance.',
  functions: [
    { phaseCode: 'tea_ceremony', phaseLabel: 'Tea Ceremony', title: 'Tea Ceremony', offsetMinutes: -180, defaultDurationMinutes: 45, requiresVenueCheck: false },
    { phaseCode: 'ceremony', phaseLabel: 'Ceremony', title: 'Wedding Ceremony Begins', offsetMinutes: -45, defaultDurationMinutes: 30, requiresVenueCheck: false },
    { phaseCode: 'cocktail_hour', phaseLabel: 'Cocktail Reception', title: 'Cocktail Reception Opens', offsetMinutes: 0, defaultDurationMinutes: 60, requiresVenueCheck: true },
    { phaseCode: 'reception', phaseLabel: 'Reception', title: 'Banquet Grand Entrance', offsetMinutes: 75, defaultDurationMinutes: 45, requiresVenueCheck: true }
  ]
};

const SECULAR: WeddingTradition = {
  key: 'secular',
  label: 'Secular / Other',
  description: 'A culture-neutral baseline: setup, first look, ceremony, cocktail hour, and reception.',
  functions: [
    { phaseCode: 'setup_complete', phaseLabel: 'Setup', title: 'Venue Setup Complete', offsetMinutes: -240, defaultDurationMinutes: 60, requiresVenueCheck: false },
    { phaseCode: 'first_look', phaseLabel: 'First Look', title: 'First Look & Portraits', offsetMinutes: -120, defaultDurationMinutes: 45, requiresVenueCheck: false },
    { phaseCode: 'ceremony', phaseLabel: 'Ceremony', title: 'Ceremony Begins', offsetMinutes: -45, defaultDurationMinutes: 30, requiresVenueCheck: false },
    { phaseCode: 'cocktail_hour', phaseLabel: 'Cocktail Hour', title: 'Cocktail Hour Opens', offsetMinutes: 0, defaultDurationMinutes: 60, requiresVenueCheck: true },
    { phaseCode: 'reception', phaseLabel: 'Reception', title: 'Reception Grand Entrance', offsetMinutes: 75, defaultDurationMinutes: 45, requiresVenueCheck: true }
  ]
};

const TRADITIONS: WeddingTradition[] = [SOUTH_ASIAN, JEWISH, WESTERN_CHRISTIAN, EAST_ASIAN, SECULAR];

export function listWeddingTraditions(): WeddingTradition[] {
  return TRADITIONS;
}

export function getWeddingTradition(key: string | null | undefined): WeddingTradition {
  const found = TRADITIONS.find((tradition) => tradition.key === key);
  if (found) {
    return found;
  }

  return TRADITIONS.find((tradition) => tradition.key === DEFAULT_TRADITION_KEY) ?? SOUTH_ASIAN;
}

export function isWeddingTraditionKey(key: string | null | undefined): boolean {
  return TRADITIONS.some((tradition) => tradition.key === key);
}

// Flattened phase-code -> display label across every tradition, for grouping
// headers in the UI. The canonical `ceremony`/`reception` codes resolve to the
// generic group label; the culture-specific title still lives on each item.
const PHASE_LABELS: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const tradition of TRADITIONS) {
    for (const fn of tradition.functions) {
      if (!map[fn.phaseCode]) {
        map[fn.phaseCode] = fn.phaseLabel;
      }
    }
  }
  return map;
})();

export function getPhaseLabel(phaseCode: string): string {
  if (PHASE_LABELS[phaseCode]) {
    return PHASE_LABELS[phaseCode];
  }

  return phaseCode.replace(/[_-]+/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}
