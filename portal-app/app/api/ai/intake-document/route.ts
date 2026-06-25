import { NextResponse } from 'next/server';

import { extractAtlasSignalsFromDocument } from '@/lib/ai';
import { ATLAS_FILE_DOMAINS, type AtlasFileDomain, buildAtlasEventFilePath } from '@/lib/atlas-event-files';
import { getSession } from '@/lib/session';
import { getSupabaseAdminClient } from '@/lib/supabase-server';
import { resolveSessionUserUuid } from '@/lib/user-identity';

export const runtime = 'nodejs';

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

function isTextLikeFile(file: File): boolean {
  const name = file.name.toLowerCase();
  if (file.type.startsWith('text/')) return true;
  return ['.txt', '.md', '.eml', '.csv', '.json'].some((suffix) => name.endsWith(suffix));
}

function parseDomain(raw: string): AtlasFileDomain | null {
  return (ATLAS_FILE_DOMAINS as string[]).includes(raw) ? (raw as AtlasFileDomain) : null;
}

export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!['admin', 'planner'].includes(session.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!session.eventId) {
    return NextResponse.json({ error: 'Missing event context' }, { status: 400 });
  }

  const formData = await request.formData();
  const fileValue = formData.get('file');
  const domainValue = String(formData.get('domain') || '').trim();
  const domain = parseDomain(domainValue);

  if (!(fileValue instanceof File)) {
    return NextResponse.json({ error: 'Missing file upload' }, { status: 400 });
  }

  if (!domain) {
    return NextResponse.json({ error: 'Invalid file domain' }, { status: 400 });
  }

  if (fileValue.size <= 0) {
    return NextResponse.json({ error: 'File is empty' }, { status: 400 });
  }

  if (fileValue.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: `File too large. Max upload size is ${Math.floor(MAX_UPLOAD_BYTES / 1024 / 1024)}MB.` },
      { status: 413 }
    );
  }

  const relativeStoragePath = buildAtlasEventFilePath({
    eventId: session.eventId,
    domain,
    filename: fileValue.name
  });

  const bytes = await fileValue.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json({ error: 'persistence_unavailable' }, { status: 503 });
  }

  const { error: uploadError } = await supabase.storage.from('atlas-intake').upload(relativeStoragePath, buffer, {
    upsert: true,
    contentType: fileValue.type || 'application/octet-stream'
  });

  if (uploadError) {
    return NextResponse.json({ error: 'upload_failed', details: uploadError.message }, { status: 500 });
  }

  const { data: signedData, error: signedUrlError } = await supabase.storage
    .from('atlas-intake')
    .createSignedUrl(relativeStoragePath, 60 * 60);

  if (signedUrlError) {
    return NextResponse.json({ error: 'signed_url_failed', details: signedUrlError.message }, { status: 500 });
  }

  const extracted = await extractAtlasSignalsFromDocument({
    sourceType: domain,
    content: isTextLikeFile(fileValue) ? buffer.toString('utf8') : ''
  });

  const actorUserId = resolveSessionUserUuid({ userId: session.userId, email: session.email });
  const now = new Date().toISOString();

  const { error: intakeInsertError } = await supabase.from('intake_documents').insert({
    event_id: session.eventId,
    uploaded_by_user_id: actorUserId,
    uploaded_by_email: session.email,
    actor_role: session.role,
    source: 'portal_intake_upload',
    domain,
    original_filename: fileValue.name,
    storage_bucket: 'atlas-intake',
    storage_path: relativeStoragePath,
    mime_type: fileValue.type || 'application/octet-stream',
    file_size_bytes: fileValue.size,
    extracted_signals: extracted,
    created_at: now,
    updated_at: now
  });

  if (intakeInsertError) {
    return NextResponse.json({ error: 'intake_insert_failed', details: intakeInsertError.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    eventId: session.eventId,
    storageBucket: 'atlas-intake',
    storageRelativePath: relativeStoragePath,
    signedUrl: signedData.signedUrl,
    extracted,
    nextBestActions: [
      'Review extracted dates and amounts, then approve milestone updates.',
      'Route actionable items into couple checklist and vendor coordination feed.',
      'Tag this document with confidence and source owner before publishing client-facing changes.'
    ]
  });
}
