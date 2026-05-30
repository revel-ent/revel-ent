import { NextResponse } from 'next/server';

import { answerGuestQuestion } from '@/lib/mock-ops';
import { getSession } from '@/lib/session';

export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!session.eventId) {
    return NextResponse.json({ error: 'Missing event context' }, { status: 400 });
  }

  if (!['admin', 'guest', 'couple', 'planner'].includes(session.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const question = String(body.question || '').trim();

  if (!question) {
    return NextResponse.json({ error: 'Question is required' }, { status: 400 });
  }

  return NextResponse.json({
    eventId: session.eventId,
    question,
    answer: answerGuestQuestion(question)
  });
}
