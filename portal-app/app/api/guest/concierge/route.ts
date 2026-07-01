import { NextResponse } from 'next/server';

import { answerGuestQuestion } from '@/lib/mock-ops';
import { getEventRecord } from '@/lib/event-context';
import { geminiChat, isGeminiConfigured } from '@/lib/gemini';
import { getSession } from '@/lib/session';

export async function POST(request: Request) {
  const session = await getSession();

  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!session.eventId) return NextResponse.json({ error: 'Missing event context' }, { status: 400 });
  if (!['admin', 'guest', 'couple', 'planner'].includes(session.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const question = String(body.question || '').trim();
  if (!question) return NextResponse.json({ error: 'Question is required' }, { status: 400 });

  if (isGeminiConfigured()) {
    const event = await getEventRecord(session.eventId);

    const eventContext = event
      ? [
          event.title ? `Event: ${event.title}` : null,
          event.venueName ? `Venue: ${event.venueName}` : null,
          event.city ? `Location: ${event.city}` : null,
        ].filter(Boolean).join('\n')
      : 'A multi-day South Asian wedding celebration.';

    const systemInstruction = `You are Atlas Concierge, a helpful assistant for guests attending a premium South Asian wedding event managed by Revel Entertainment.

Event details:
${eventContext}

Answer the guest's question helpfully and concisely — two to four sentences maximum. Be warm and specific. If the question is about something you genuinely do not have information on (specific timings, seating, meal choices), say so honestly and suggest they check with their planner or the on-site team. Never invent specifics you don't have. Do not mention that you are an AI unless directly asked.`;

    const answer = await geminiChat(
      [{ role: 'user', text: question }],
      systemInstruction
    );

    if (answer) {
      return NextResponse.json({ eventId: session.eventId, question, answer, source: 'ai' });
    }
  }

  // Fallback: keyword-match FAQ when Gemini is not configured or fails.
  return NextResponse.json({
    eventId: session.eventId,
    question,
    answer: answerGuestQuestion(question),
    source: 'faq',
  });
}
