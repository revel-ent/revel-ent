import { NextResponse } from 'next/server';

import { requireEventRoleContext } from '@/lib/event-context';
import { getSupabaseAdminClient } from '@/lib/supabase-server';

function normalizeEmbedUrl(rawUrl: string): string {
  const url = rawUrl.trim();

  // Google Drive: /file/d/{id}/view → /file/d/{id}/preview
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([^/?#]+)/);
  if (driveMatch) {
    return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
  }

  // Google Drive folder/open: /open?id={id} or /drive/folders/{id}
  const driveOpenMatch = url.match(/drive\.google\.com\/(?:open\?id=|drive\/folders\/)([^/?#&]+)/);
  if (driveOpenMatch) {
    return `https://drive.google.com/file/d/${driveOpenMatch[1]}/preview`;
  }

  // Canva: /design/{id}/view → /design/{id}/view?embed
  if (url.includes('canva.com/design/')) {
    const base = url.replace(/[?#].*$/, '').replace(/\/(edit|present|view)$/, '');
    return `${base}/view?embed`;
  }

  // Google Slides: /presentation/d/{id}/edit → /presentation/d/{id}/embed
  const slidesMatch = url.match(/docs\.google\.com\/presentation\/d\/([^/?#]+)/);
  if (slidesMatch) {
    return `https://docs.google.com/presentation/d/${slidesMatch[1]}/embed?start=false&loop=false&delayms=3000`;
  }

  return url;
}

export async function POST(request: Request) {
  const { context, response: errResponse } = await requireEventRoleContext({
    allowedRoles: ['admin', 'planner', 'decorator'],
    requireEventId: true
  });
  if (errResponse) return errResponse;

  const body = (await request.json()) as { url?: unknown };
  const rawUrl = typeof body.url === 'string' ? body.url.trim() : '';
  if (!rawUrl) {
    return NextResponse.json({ error: 'url is required' }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }

  const embedUrl = normalizeEmbedUrl(rawUrl);

  const { data: event } = await supabase
    .from('events')
    .select('atlas_entitlement_snapshot')
    .eq('event_id', context!.eventId)
    .maybeSingle();

  const existing = (event?.atlas_entitlement_snapshot as Record<string, unknown> | null) ?? {};
  const updated = { ...existing, mood_board_url: embedUrl };

  const { error } = await supabase
    .from('events')
    .update({ atlas_entitlement_snapshot: updated })
    .eq('event_id', context!.eventId);

  if (error) {
    return NextResponse.json({ error: 'Failed to save mood board URL' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, embedUrl });
}
