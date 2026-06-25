import { NextResponse } from 'next/server';

import { answerWeddingQuestion, buildAssistantGrounding, type AssistantMessage } from '@/lib/ai-assistant';
import { requireEventRoleContext } from '@/lib/event-context';

export const runtime = 'nodejs';

// Guests and unassigned delegates do not get the planning assistant.
const ASSISTANT_ROLES = [
  'admin',
  'planner',
  'couple',
  'production',
  'dj_mc',
  'decorator',
  'vendor',
  'venue_coordinator'
];

const MAX_MESSAGE_CHARS = 4000;
const MAX_HISTORY = 12;

function sanitizeMessages(raw: unknown): AssistantMessage[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  const out: AssistantMessage[] = [];

  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') {
      continue;
    }

    const role = (entry as { role?: unknown }).role;
    const content = (entry as { content?: unknown }).content;

    if ((role === 'user' || role === 'assistant') && typeof content === 'string' && content.trim()) {
      out.push({ role, content: content.slice(0, MAX_MESSAGE_CHARS) });
    }
  }

  return out.slice(-MAX_HISTORY);
}

export async function POST(request: Request) {
  const { context, response } = await requireEventRoleContext({ requireEventId: true });

  if (response || !context) {
    return response ?? NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!ASSISTANT_ROLES.includes(context.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: { messages?: unknown };

  try {
    body = (await request.json()) as { messages?: unknown };
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const messages = sanitizeMessages(body.messages);

  if (messages.length === 0 || messages[messages.length - 1].role !== 'user') {
    return NextResponse.json({ error: 'A user message is required' }, { status: 400 });
  }

  const grounding = await buildAssistantGrounding({
    eventId: context.eventId,
    role: context.role,
    userId: context.userId,
    domainScopes: context.domainScopes
  });

  const answer = await answerWeddingQuestion({ grounding, role: context.role, messages });

  return NextResponse.json({
    reply: answer.reply,
    source: answer.source,
    role: context.role
  });
}
