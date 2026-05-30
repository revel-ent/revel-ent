import { findAtlasVenueById, type AtlasVenueSeed } from '@/lib/atlas-venues';

export interface TimelineTemplateRow {
  phase_code: string;
  title: string;
  offset_minutes: number;
  default_duration_minutes: number | null;
  requires_venue_check: boolean;
}

export interface GeneratedTimelineItem {
  phaseCode: string;
  title: string;
  scheduledStartIso: string;
  scheduledEndIso: string;
  escalationHint: string | null;
  atlasPrompt: {
    venueId: string;
    venueName: string;
    requiresVenueCheck: boolean;
    note: string;
  };
}

export interface TimelineGenerationResult {
  venue: AtlasVenueSeed;
  weddingDate: string;
  items: GeneratedTimelineItem[];
  warnings: string[];
  templateSource: 'database' | 'fallback';
}

const FALLBACK_TEMPLATE: TimelineTemplateRow[] = [
  { phase_code: 'mehndi', title: 'Mehndi Setup Complete', offset_minutes: -1560, default_duration_minutes: 60, requires_venue_check: false },
  { phase_code: 'haldi', title: 'Haldi Family Assembly', offset_minutes: -840, default_duration_minutes: 45, requires_venue_check: false },
  { phase_code: 'sangeet', title: 'Sangeet Production Check', offset_minutes: -300, default_duration_minutes: 30, requires_venue_check: true },
  { phase_code: 'baraat', title: 'Baraat Staging Ready', offset_minutes: -90, default_duration_minutes: 20, requires_venue_check: true },
  { phase_code: 'ceremony', title: 'Ceremony Guest Seating Open', offset_minutes: -45, default_duration_minutes: 30, requires_venue_check: false },
  { phase_code: 'reception', title: 'Reception Room Reset Complete', offset_minutes: 90, default_duration_minutes: 45, requires_venue_check: true }
];

function parseWeddingDate(dateInput?: string): Date {
  if (!dateInput) {
    const fallback = new Date();
    fallback.setHours(17, 0, 0, 0);
    return fallback;
  }

  const candidate = new Date(dateInput);

  if (Number.isNaN(candidate.getTime())) {
    const fallback = new Date();
    fallback.setHours(17, 0, 0, 0);
    return fallback;
  }

  candidate.setHours(17, 0, 0, 0);
  return candidate;
}

function minutesFromDate(base: Date, minutes: number): Date {
  return new Date(base.getTime() + minutes * 60_000);
}

function deriveEscalationHint(phaseCode: string, venue: AtlasVenueSeed): string | null {
  if (phaseCode === 'baraat') {
    return 'Confirm procession route and staging access with venue contact before go-live.';
  }

  if (phaseCode === 'reception' && venue.noiseCurfewHour) {
    return `Noise controls tighten at ${venue.noiseCurfewHour}:00. Keep speeches and production cues aligned.`;
  }

  return null;
}

export function buildGeneratedTimeline(params: {
  venue: AtlasVenueSeed;
  weddingDate?: string;
  templates: TimelineTemplateRow[];
}): TimelineGenerationResult {
  const { venue, weddingDate, templates } = params;
  const anchorDate = parseWeddingDate(weddingDate);
  const warnings: string[] = [];

  const items = templates
    .sort((a, b) => a.offset_minutes - b.offset_minutes)
    .map((template) => {
      const start = minutesFromDate(anchorDate, template.offset_minutes);
      const duration = template.default_duration_minutes ?? 30;
      const end = minutesFromDate(start, duration);

      if (template.phase_code === 'reception' && venue.noiseCurfewHour) {
        const curfew = new Date(start);
        curfew.setHours(venue.noiseCurfewHour, 0, 0, 0);

        if (end.getTime() > curfew.getTime()) {
          warnings.push(
            `Reception block overlaps ${venue.noiseCurfewHour}:00 venue noise curfew. Advance high-volume segments earlier.`
          );
        }
      }

      return {
        phaseCode: template.phase_code,
        title: template.title,
        scheduledStartIso: start.toISOString(),
        scheduledEndIso: end.toISOString(),
        escalationHint: deriveEscalationHint(template.phase_code, venue),
        atlasPrompt: {
          venueId: venue.id,
          venueName: venue.name,
          requiresVenueCheck: template.requires_venue_check,
          note: venue.constraintsSummary
        }
      };
    });

  return {
    venue,
    weddingDate: anchorDate.toISOString(),
    items,
    warnings,
    templateSource: templates === FALLBACK_TEMPLATE ? 'fallback' : 'database'
  };
}

export async function loadTimelineTemplates(fetcher: () => Promise<TimelineTemplateRow[] | null>): Promise<{
  templates: TimelineTemplateRow[];
  source: 'database' | 'fallback';
}> {
  const fromDb = await fetcher();

  if (fromDb && fromDb.length > 0) {
    return { templates: fromDb, source: 'database' };
  }

  return { templates: FALLBACK_TEMPLATE, source: 'fallback' };
}

export async function generateTimelineFromVenue(params: {
  venueId: string;
  weddingDate?: string;
  fetchTemplates: () => Promise<TimelineTemplateRow[] | null>;
}): Promise<TimelineGenerationResult | null> {
  const venue = findAtlasVenueById(params.venueId);

  if (!venue) {
    return null;
  }

  const loaded = await loadTimelineTemplates(params.fetchTemplates);
  const generated = buildGeneratedTimeline({
    venue,
    weddingDate: params.weddingDate,
    templates: loaded.templates
  });

  return {
    ...generated,
    templateSource: loaded.source
  };
}
