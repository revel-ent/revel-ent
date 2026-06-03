import { NextResponse } from 'next/server';

import {
  MUSIC_GENRE_KEYS,
  getMusicProjectionForActor,
  submitMusicQuestionnaire,
  type MusicQuestionnaireInput
} from '@/lib/couple-domains';
import { requireEventRoleContext } from '@/lib/event-context';
import { canAccessDomain } from '@/lib/role-scoped-adapters';

interface MusicQuestionnaireBody {
  genreMix?: unknown;
  otherGenres?: unknown;
  danceOffNotes?: unknown;
  additionalNotes?: unknown;
}

function parseInput(body: MusicQuestionnaireBody): MusicQuestionnaireInput | null {
  if (!body.genreMix || typeof body.genreMix !== 'object') {
    return null;
  }

  const genreMix = {} as Record<(typeof MUSIC_GENRE_KEYS)[number], number>;
  for (const key of MUSIC_GENRE_KEYS) {
    const value = (body.genreMix as Record<string, unknown>)[key];
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return null;
    }
    genreMix[key] = value;
  }

  return {
    genreMix,
    otherGenres: typeof body.otherGenres === 'string' ? body.otherGenres : '',
    danceOffNotes: typeof body.danceOffNotes === 'string' ? body.danceOffNotes : '',
    additionalNotes: typeof body.additionalNotes === 'string' ? body.additionalNotes : ''
  };
}

export async function GET() {
  const { context, response } = await requireEventRoleContext();

  if (response || !context) {
    return response as NextResponse;
  }

  if (!canAccessDomain('music', context.role, 'read')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const projection = getMusicProjectionForActor({ eventId: context.eventId, actorRole: context.role });
  return NextResponse.json({
    eventId: context.eventId,
    role: context.role,
    source: 'simulation',
    domainScope: projection.domainScope,
    music: projection.music
  });
}

export async function POST(request: Request) {
  const { context, response } = await requireEventRoleContext({ allowedRoles: ['admin', 'couple', 'planner'] });

  if (response || !context) {
    return response as NextResponse;
  }

  let body: MusicQuestionnaireBody;
  try {
    body = (await request.json()) as MusicQuestionnaireBody;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const input = parseInput(body);
  if (!input) {
    return NextResponse.json({ error: 'invalid_music_questionnaire' }, { status: 400 });
  }

  try {
    const music = submitMusicQuestionnaire(context.eventId, input);
    return NextResponse.json({ mode: 'simulation', music }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'music_locked') {
      return NextResponse.json({ error: 'music_locked' }, { status: 409 });
    }

    if (error instanceof Error && error.message === 'genre_mix_total_invalid') {
      return NextResponse.json({ error: 'genre_mix_total_invalid' }, { status: 400 });
    }

    throw error;
  }
}