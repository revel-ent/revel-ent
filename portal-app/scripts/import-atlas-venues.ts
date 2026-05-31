import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { createClient } from '@supabase/supabase-js';

type VenueSource = 'partner_provided' | 'inferred' | 'marketing';
type DataConfidence = 'measured' | 'venue_doc' | 'sales_claim' | 'estimated';
type YesNoUnknown = 'yes' | 'no' | 'unknown';
type VerificationStatus = 'unverified' | 'partially_verified' | 'vendor_verified';

interface FieldSource {
  confidence: DataConfidence;
  note?: string;
  url?: string;
  verifiedOn?: string;
}

interface VenueSourceLink {
  label: string;
  url: string;
  lastChecked?: string;
  sourceType?: string;
}

interface DiagramAsset {
  id: string;
  type: string;
  guestCountUsed?: number;
  url: string;
  notes?: string;
  source?: string;
  uploadedOn?: string;
}

interface ExternalVenue {
  id: string;
  name: string;
  room: string;
  address: string;
  source: VenueSource;
  provenance?: Record<string, FieldSource>;
  floorPlanType?: 'none' | 'pdf' | 'image' | 'link';
  floorPlanUrl?: string;
  floorPlanNotes?: string;
  floorPlanLastVerified?: string;
  l: number;
  w: number;
  h: number;
  marketingCap: number;
  totalAmps: number;
  hasThreePhase: boolean;
  hasCamlocks: boolean;
  generatorRequiredForBand: boolean;
  loadingDock: boolean;
  smallestDoorWidth: number;
  pushDistanceFt: number;
  elevatorDimensions: string;
  riggingAllowed: boolean;
  maxRiggingLoad: number;
  maxDecibels: number;
  curfewTime: string;
  hazeAllowed: boolean;
  coldSparksAllowed: boolean;
  openFlameAllowed: boolean;
  catering: boolean;
  baraat: string;
  flooringType?: 'carpet' | 'marble' | 'wood' | 'concrete' | 'tile' | 'unknown';
  drainageAvailable?: YesNoUnknown;
  waterSourceNearby?: YesNoUnknown;
  nearestDrainNotes?: string;
  outdoorSpaceAvailable?: YesNoUnknown;
  outdoorCeremonyCapable?: YesNoUnknown;
  outdoorCapacityMin?: number;
  outdoorCapacityMax?: number;
  tentingAllowed?: YesNoUnknown;
  outdoorNotes?: string;
  outdoorCurfewDifferent?: YesNoUnknown;
  outdoorCurfewNotes?: string;
  comfortableRangeMin?: number;
  comfortableRangeMax?: number;
  capacityNotes?: string;
  venueSources?: VenueSourceLink[];
  diagramAssets?: DiagramAsset[];
  venueVerification?: VerificationStatus;
  lastVerified?: string;
}

interface NormalizedVenueRow {
  atlas_record_id: string;
  atlas_slug: string;
  name: string;
  room_name: string;
  city: string | null;
  state: string | null;
  address: string;
  length_ft: number;
  width_ft: number;
  height_ft: number;
  marketed_capacity: number;
  comfortable_range_min: number | null;
  comfortable_range_max: number | null;
  source_confidence: DataConfidence;
  verification_status: VerificationStatus;
  last_verified_on: string | null;
  provenance: Record<string, unknown>;
  source_links: VenueSourceLink[];
  diagram_assets: DiagramAsset[];
}

interface NormalizedConstraintRow {
  atlas_record_id: string;
  category: string;
  key: string;
  value_text: string | null;
  value_number: number | null;
  value_boolean: boolean | null;
  unit: string | null;
  notes: string | null;
  source_confidence: DataConfidence | null;
  source_reference: string | null;
  reviewed_on: string | null;
}

interface VenueConstraintUpsertRow {
  venue_id: string;
  category: string;
  key: string;
  value_text: string | null;
  value_number: number | null;
  value_boolean: boolean | null;
  unit: string | null;
  notes: string | null;
  source_confidence: DataConfidence | null;
  source_reference: string | null;
  reviewed_on: string | null;
}

const ATLAS_REPO_DIR = process.env.ATLAS_CAPACITY_ENGINE_DIR ?? 'C:/Users/17065/Projects/atlas-capacity-engine';
const SNAPSHOT_PATH = path.resolve('data/atlas-sync/atlas-venues.snapshot.json');
const SQL_PATH = path.resolve('data/atlas-sync/atlas-venues.upsert.sql');

function parseArgs() {
  const args = new Set(process.argv.slice(2));
  return {
    writeJson: args.has('--write-json'),
    writeSql: args.has('--write-sql'),
    apply: args.has('--apply')
  };
}

function mapSourceConfidence(source: VenueSource, provenance?: Record<string, FieldSource>): DataConfidence {
  const confidences = Object.values(provenance ?? {}).map((entry) => entry.confidence);

  if (confidences.includes('measured')) {
    return 'measured';
  }

  if (confidences.includes('venue_doc')) {
    return 'venue_doc';
  }

  if (source === 'partner_provided') {
    return 'measured';
  }

  if (source === 'marketing') {
    return 'sales_claim';
  }

  return 'estimated';
}

function parseCityState(address: string): { city: string | null; state: string | null } {
  const segments = address.split(',').map((segment) => segment.trim()).filter(Boolean);
  const stateSegment = segments.length >= 1 ? segments[segments.length - 1] : null;
  const stateMatch = stateSegment?.match(/\b([A-Z]{2})\b/);
  let city: string | null = null;

  if (segments.length >= 3) {
    city = segments[segments.length - 2];
  } else if (segments.length === 2) {
    city = stateMatch ? segments[0] : segments[1];
  } else if (segments.length === 1) {
    city = null;
  }

  return {
    city,
    state: stateMatch?.[1] ?? null
  };
}

function buildDiagramAssets(venue: ExternalVenue): DiagramAsset[] {
  const assets = [...(venue.diagramAssets ?? [])];

  if (venue.floorPlanUrl) {
    assets.unshift({
      id: `${venue.id}-floor-plan`,
      type: 'other',
      url: venue.floorPlanUrl,
      notes: venue.floorPlanNotes,
      uploadedOn: venue.floorPlanLastVerified
    });
  }

  return assets;
}

function buildVenueRow(venue: ExternalVenue): NormalizedVenueRow {
  const { city, state } = parseCityState(venue.address);

  return {
    atlas_record_id: venue.id,
    atlas_slug: venue.id,
    name: venue.name,
    room_name: venue.room,
    city,
    state,
    address: venue.address,
    length_ft: venue.l,
    width_ft: venue.w,
    height_ft: venue.h,
    marketed_capacity: venue.marketingCap,
    comfortable_range_min: venue.comfortableRangeMin ?? null,
    comfortable_range_max: venue.comfortableRangeMax ?? null,
    source_confidence: mapSourceConfidence(venue.source, venue.provenance),
    verification_status: venue.venueVerification ?? 'unverified',
    last_verified_on: venue.lastVerified ?? null,
    provenance: {
      source: venue.source,
      fieldSources: venue.provenance ?? {},
      floorPlanType: venue.floorPlanType ?? null,
      floorPlanNotes: venue.floorPlanNotes ?? null,
      floorPlanLastVerified: venue.floorPlanLastVerified ?? null,
      capacityNotes: venue.capacityNotes ?? null
    },
    source_links: venue.venueSources ?? [],
    diagram_assets: buildDiagramAssets(venue)
  };
}

function buildConstraintRows(venue: ExternalVenue): NormalizedConstraintRow[] {
  const rows: NormalizedConstraintRow[] = [];

  function pushConstraint(params: {
    category: string;
    key: string;
    valueText?: string | null;
    valueNumber?: number | null;
    valueBoolean?: boolean | null;
    unit?: string | null;
    notes?: string | null;
    provenanceKey?: string;
  }) {
    const source = params.provenanceKey ? venue.provenance?.[params.provenanceKey] : undefined;
    rows.push({
      atlas_record_id: venue.id,
      category: params.category,
      key: params.key,
      value_text: params.valueText ?? null,
      value_number: params.valueNumber ?? null,
      value_boolean: params.valueBoolean ?? null,
      unit: params.unit ?? null,
      notes: params.notes ?? null,
      source_confidence: source?.confidence ?? null,
      source_reference: source?.url ?? source?.note ?? null,
      reviewed_on: source?.verifiedOn ?? venue.lastVerified ?? null
    });
  }

  pushConstraint({ category: 'power', key: 'total_amps', valueNumber: venue.totalAmps, unit: 'amps', provenanceKey: 'totalAmps' });
  pushConstraint({ category: 'power', key: 'has_three_phase', valueBoolean: venue.hasThreePhase, provenanceKey: 'hasThreePhase' });
  pushConstraint({ category: 'power', key: 'has_camlocks', valueBoolean: venue.hasCamlocks, provenanceKey: 'hasCamlocks' });
  pushConstraint({ category: 'power', key: 'generator_required_for_band', valueBoolean: venue.generatorRequiredForBand, provenanceKey: 'generatorRequiredForBand' });
  pushConstraint({ category: 'access', key: 'loading_dock', valueBoolean: venue.loadingDock, provenanceKey: 'loadingDock' });
  pushConstraint({ category: 'access', key: 'smallest_door_width', valueNumber: venue.smallestDoorWidth, unit: 'inches', provenanceKey: 'smallestDoorWidth' });
  pushConstraint({ category: 'access', key: 'push_distance', valueNumber: venue.pushDistanceFt, unit: 'ft', provenanceKey: 'pushDistanceFt' });
  pushConstraint({ category: 'access', key: 'elevator_dimensions', valueText: venue.elevatorDimensions, provenanceKey: 'elevatorDimensions' });
  pushConstraint({ category: 'rigging', key: 'rigging_allowed', valueBoolean: venue.riggingAllowed, provenanceKey: 'riggingAllowed' });
  pushConstraint({ category: 'rigging', key: 'max_rigging_load', valueNumber: venue.maxRiggingLoad, unit: 'lb', provenanceKey: 'maxRiggingLoad' });
  pushConstraint({ category: 'sound', key: 'max_decibels', valueNumber: venue.maxDecibels, unit: 'dB', provenanceKey: 'maxDecibels' });
  pushConstraint({ category: 'policy', key: 'curfew_time', valueText: venue.curfewTime, provenanceKey: 'curfewTime' });
  pushConstraint({ category: 'policy', key: 'haze_allowed', valueBoolean: venue.hazeAllowed, provenanceKey: 'hazeAllowed' });
  pushConstraint({ category: 'policy', key: 'cold_sparks_allowed', valueBoolean: venue.coldSparksAllowed, provenanceKey: 'coldSparksAllowed' });
  pushConstraint({ category: 'policy', key: 'open_flame_allowed', valueBoolean: venue.openFlameAllowed, provenanceKey: 'openFlameAllowed' });
  pushConstraint({ category: 'policy', key: 'outside_catering_allowed', valueBoolean: venue.catering, provenanceKey: 'catering' });
  pushConstraint({ category: 'logistics', key: 'baraat_policy', valueText: venue.baraat, provenanceKey: 'baraat' });
  pushConstraint({ category: 'layout', key: 'flooring_type', valueText: venue.flooringType ?? null });
  pushConstraint({ category: 'layout', key: 'drainage_available', valueText: venue.drainageAvailable ?? null });
  pushConstraint({ category: 'layout', key: 'water_source_nearby', valueText: venue.waterSourceNearby ?? null });
  pushConstraint({ category: 'layout', key: 'nearest_drain_notes', valueText: venue.nearestDrainNotes ?? null });
  pushConstraint({ category: 'outdoor', key: 'space_available', valueText: venue.outdoorSpaceAvailable ?? null });
  pushConstraint({ category: 'outdoor', key: 'ceremony_capable', valueText: venue.outdoorCeremonyCapable ?? null });
  pushConstraint({ category: 'outdoor', key: 'capacity_min', valueNumber: venue.outdoorCapacityMin ?? null, unit: 'guests' });
  pushConstraint({ category: 'outdoor', key: 'capacity_max', valueNumber: venue.outdoorCapacityMax ?? null, unit: 'guests' });
  pushConstraint({ category: 'outdoor', key: 'tenting_allowed', valueText: venue.tentingAllowed ?? null });
  pushConstraint({ category: 'outdoor', key: 'notes', valueText: venue.outdoorNotes ?? null });
  pushConstraint({ category: 'outdoor', key: 'curfew_different', valueText: venue.outdoorCurfewDifferent ?? null });
  pushConstraint({ category: 'outdoor', key: 'curfew_notes', valueText: venue.outdoorCurfewNotes ?? null });
  pushConstraint({ category: 'capacity', key: 'marketing_capacity', valueNumber: venue.marketingCap, unit: 'guests', provenanceKey: 'marketingCap' });
  pushConstraint({ category: 'capacity', key: 'comfortable_range_min', valueNumber: venue.comfortableRangeMin ?? null, unit: 'guests' });
  pushConstraint({ category: 'capacity', key: 'comfortable_range_max', valueNumber: venue.comfortableRangeMax ?? null, unit: 'guests' });
  pushConstraint({ category: 'capacity', key: 'capacity_notes', valueText: venue.capacityNotes ?? null });

  return rows;
}

function sqlValue(value: unknown): string {
  if (value === null || value === undefined) {
    return 'null';
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return `'${JSON.stringify(value).slice(1, -1).replace(/'/g, "''")}'`;
}

function sqlJson(value: unknown): string {
  return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
}

function buildSql(rows: { venues: NormalizedVenueRow[]; constraints: NormalizedConstraintRow[] }): string {
  const venueInserts = rows.venues
    .map(
      (venue) => `(
  ${sqlValue(venue.atlas_record_id)},
  ${sqlValue(venue.atlas_slug)},
  ${sqlValue(venue.name)},
  ${sqlValue(venue.room_name)},
  ${sqlValue(venue.city)},
  ${sqlValue(venue.state)},
  ${sqlValue(venue.address)},
  ${sqlValue(venue.length_ft)},
  ${sqlValue(venue.width_ft)},
  ${sqlValue(venue.height_ft)},
  ${sqlValue(venue.marketed_capacity)},
  ${sqlValue(venue.comfortable_range_min)},
  ${sqlValue(venue.comfortable_range_max)},
  ${sqlValue(venue.source_confidence)},
  ${sqlValue(venue.verification_status)},
  ${sqlValue(venue.last_verified_on)},
  ${sqlJson(venue.provenance)},
  ${sqlJson(venue.source_links)},
  ${sqlJson(venue.diagram_assets)}
)`
    )
    .join(',\n');

  const constraintStatements = rows.constraints
    .map(
      (constraint) => `insert into venue_constraints (
  venue_id,
  category,
  key,
  value_text,
  value_number,
  value_boolean,
  unit,
  notes,
  source_confidence,
  source_reference,
  reviewed_on
)
select
  v.venue_id,
  ${sqlValue(constraint.category)},
  ${sqlValue(constraint.key)},
  ${sqlValue(constraint.value_text)},
  ${sqlValue(constraint.value_number)},
  ${sqlValue(constraint.value_boolean)},
  ${sqlValue(constraint.unit)},
  ${sqlValue(constraint.notes)},
  ${sqlValue(constraint.source_confidence)},
  ${sqlValue(constraint.source_reference)},
  ${sqlValue(constraint.reviewed_on)}
from venues v
where v.atlas_record_id = ${sqlValue(constraint.atlas_record_id)}
on conflict (venue_id, category, key) do update
set
  value_text = excluded.value_text,
  value_number = excluded.value_number,
  value_boolean = excluded.value_boolean,
  unit = excluded.unit,
  notes = excluded.notes,
  source_confidence = excluded.source_confidence,
  source_reference = excluded.source_reference,
  reviewed_on = excluded.reviewed_on,
  updated_at = now();`
    )
    .join('\n\n');

  return `-- Generated by scripts/import-atlas-venues.ts\n\ninsert into venues (\n  atlas_record_id,\n  atlas_slug,\n  name,\n  room_name,\n  city,\n  state,\n  address,\n  length_ft,\n  width_ft,\n  height_ft,\n  marketed_capacity,\n  comfortable_range_min,\n  comfortable_range_max,\n  source_confidence,\n  verification_status,\n  last_verified_on,\n  provenance,\n  source_links,\n  diagram_assets\n)\nvalues\n${venueInserts}\non conflict (atlas_record_id) do update\nset\n  atlas_slug = excluded.atlas_slug,\n  name = excluded.name,\n  room_name = excluded.room_name,\n  city = excluded.city,\n  state = excluded.state,\n  address = excluded.address,\n  length_ft = excluded.length_ft,\n  width_ft = excluded.width_ft,\n  height_ft = excluded.height_ft,\n  marketed_capacity = excluded.marketed_capacity,\n  comfortable_range_min = excluded.comfortable_range_min,\n  comfortable_range_max = excluded.comfortable_range_max,\n  source_confidence = excluded.source_confidence,\n  verification_status = excluded.verification_status,\n  last_verified_on = excluded.last_verified_on,\n  provenance = excluded.provenance,\n  source_links = excluded.source_links,\n  diagram_assets = excluded.diagram_assets,\n  updated_at = now();\n\n${constraintStatements}\n`;
}

async function loadAtlasVenues(): Promise<ExternalVenue[]> {
  const modulePath = path.join(ATLAS_REPO_DIR, 'src/lib/venues/venue_presets.ts');
  const imported = await import(pathToFileURL(modulePath).href);
  const venues = (imported.VENUE_PRESETS ?? []) as ExternalVenue[];

  return venues.filter((venue) => venue.id !== 'custom');
}

async function writeOutput(filePath: string, content: string) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, content, 'utf8');
}

async function applyToSupabase(rows: { venues: NormalizedVenueRow[]; constraints: NormalizedConstraintRow[] }) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set to use --apply.');
  }

  const client = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const { error: venueError } = await client.from('venues').upsert(rows.venues, { onConflict: 'atlas_record_id' });

  if (venueError) {
    throw venueError;
  }

  const { data: venueRecords, error: venueLookupError } = await client
    .from('venues')
    .select('venue_id, atlas_record_id')
    .in('atlas_record_id', rows.venues.map((row) => row.atlas_record_id));

  if (venueLookupError) {
    throw venueLookupError;
  }

  const venueIdByAtlasRecord = new Map((venueRecords ?? []).map((record) => [record.atlas_record_id as string, record.venue_id as string]));
  const constraintPayload: VenueConstraintUpsertRow[] = rows.constraints
    .map((constraint) => {
      const venueId = venueIdByAtlasRecord.get(constraint.atlas_record_id);

      if (!venueId) {
        return null;
      }

      return {
        venue_id: venueId,
        category: constraint.category,
        key: constraint.key,
        value_text: constraint.value_text,
        value_number: constraint.value_number,
        value_boolean: constraint.value_boolean,
        unit: constraint.unit,
        notes: constraint.notes,
        source_confidence: constraint.source_confidence,
        source_reference: constraint.source_reference,
        reviewed_on: constraint.reviewed_on
      };
    })
    .filter((row): row is VenueConstraintUpsertRow => row !== null);

  const { error: constraintError } = await client.from('venue_constraints').upsert(constraintPayload, {
    onConflict: 'venue_id,category,key'
  });

  if (constraintError) {
    throw constraintError;
  }
}

async function main() {
  const args = parseArgs();
  const externalVenues = await loadAtlasVenues();
  const venues = externalVenues.map(buildVenueRow);
  const constraints = externalVenues.flatMap(buildConstraintRows);
  const payload = { generatedAt: new Date().toISOString(), sourceRepo: ATLAS_REPO_DIR, venueCount: venues.length, constraintCount: constraints.length, venues, constraints };

  if (args.writeJson) {
    await writeOutput(SNAPSHOT_PATH, `${JSON.stringify(payload, null, 2)}\n`);
    console.log(`Wrote Atlas venue snapshot to ${SNAPSHOT_PATH}`);
  }

  if (args.writeSql) {
    await writeOutput(SQL_PATH, buildSql({ venues, constraints }));
    console.log(`Wrote Atlas upsert SQL to ${SQL_PATH}`);
  }

  if (args.apply) {
    await applyToSupabase({ venues, constraints });
    console.log(`Applied ${venues.length} venues and ${constraints.length} constraints to Supabase.`);
  }

  if (!args.writeJson && !args.writeSql && !args.apply) {
    console.log(JSON.stringify({ venueCount: venues.length, constraintCount: constraints.length }, null, 2));
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});