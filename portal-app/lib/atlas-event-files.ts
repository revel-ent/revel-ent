export type AtlasFileDomain =
  | 'contracts'
  | 'transcripts'
  | 'emails'
  | 'vendor_documents'
  | 'guest_assets'
  | 'timelines'
  | 'financial'
  | 'media';

export interface AtlasFileFolder {
  key: AtlasFileDomain;
  label: string;
  piiRisk: 'low' | 'medium' | 'high';
}

export const ATLAS_FILE_DOMAINS: AtlasFileDomain[] = [
  'contracts',
  'transcripts',
  'emails',
  'vendor_documents',
  'guest_assets',
  'timelines',
  'financial',
  'media'
];

export const ATLAS_EVENT_FOLDERS: AtlasFileFolder[] = [
  { key: 'contracts', label: 'Signed Agreements', piiRisk: 'high' },
  { key: 'transcripts', label: 'Meeting Transcripts', piiRisk: 'medium' },
  { key: 'emails', label: 'Email Threads', piiRisk: 'medium' },
  { key: 'vendor_documents', label: 'Vendor Deliverables', piiRisk: 'medium' },
  { key: 'guest_assets', label: 'Guest Assets and PDFs', piiRisk: 'low' },
  { key: 'timelines', label: 'Run-of-Show and Timelines', piiRisk: 'low' },
  { key: 'financial', label: 'Invoices and Payment Artifacts', piiRisk: 'high' },
  { key: 'media', label: 'Photos, Video, Social Assets', piiRisk: 'low' }
];

function sanitizeFilename(filename: string): string {
  return filename
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .slice(0, 180);
}

export function buildAtlasEventFilePath(params: {
  eventId: string;
  domain: AtlasFileDomain;
  filename: string;
  uploadedAtIso?: string;
}): string {
  const uploadedAt = params.uploadedAtIso ? new Date(params.uploadedAtIso) : new Date();
  const year = String(uploadedAt.getUTCFullYear());
  const month = String(uploadedAt.getUTCMonth() + 1).padStart(2, '0');
  const safeFilename = sanitizeFilename(params.filename);

  // Storage pattern for object storage (Supabase S3-compatible bucket)
  // events/{event_id}/{domain}/{year}/{month}/{filename}
  return ['events', params.eventId, params.domain, year, month, safeFilename].join('/');
}

export function getAtlasEventFolderBlueprint(eventId: string): string[] {
  return ATLAS_EVENT_FOLDERS.map((folder) => `events/${eventId}/${folder.key}/`);
}
