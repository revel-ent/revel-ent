import { NextResponse } from 'next/server';

import { requireEventRoleContext } from '@/lib/event-context';
import { generateEventTimeline } from '@/lib/timeline-generation';

interface GenerateBody {
  tradition?: unknown;
}

export async function POST(request: Request) {
  const { context, response } = await requireEventRoleContext({ allowedRoles: ['admin', 'planner'] });

  if (response || !context) {
    return response as NextResponse;
  }

  let body: GenerateBody = {};

  try {
    body = (await request.json()) as GenerateBody;
  } catch {
    // No body is fine — tradition is optional.
  }

  const tradition = typeof body.tradition === 'string' ? body.tradition.trim() : undefined;

  const outcome = await generateEventTimeline({ eventId: context.eventId, tradition });

  if (!outcome.ok) {
    return NextResponse.json({ error: outcome.error }, { status: outcome.status });
  }

  return NextResponse.json(
    {
      ...outcome.generation,
      eventId: outcome.eventId,
      resolvedTradition: outcome.resolvedTradition,
      existingTimelineCount: outcome.existingTimelineCount,
      conflicts: outcome.recalculated.conflicts,
      adjustments: outcome.recalculated.adjustments
    },
    { status: 200 }
  );
}
