import type { CoordinationItem } from '@/lib/mock-ops';

export interface CoordinationSummaryInput {
  eventId: string;
  actorName: string;
  generatedAtIso?: string;
  customIntro?: string;
  items: CoordinationItem[];
}

export function buildCoordinationSummary(input: CoordinationSummaryInput): string {
  const generatedAtIso = input.generatedAtIso || new Date().toISOString();
  const generatedAt = new Date(generatedAtIso).toLocaleString();
  const statusCounts = input.items.reduce(
    (acc, item) => {
      acc[item.status] += 1;
      return acc;
    },
    {
      pending: 0,
      acknowledged: 0,
      executed: 0
    }
  );

  const lines: string[] = [];

  lines.push('REVEL Event Operations Update');
  lines.push(`Event: ${input.eventId}`);
  lines.push(`Prepared by: ${input.actorName}`);
  lines.push(`Generated: ${generatedAt}`);
  lines.push('');

  if (input.customIntro?.trim()) {
    lines.push(input.customIntro.trim());
    lines.push('');
  }

  lines.push('Current snapshot');
  lines.push(`- Pending: ${statusCounts.pending}`);
  lines.push(`- Acknowledged: ${statusCounts.acknowledged}`);
  lines.push(`- Executed: ${statusCounts.executed}`);
  lines.push('');
  lines.push('Latest coordination updates');

  if (input.items.length === 0) {
    lines.push('- No updates in the feed.');
  } else {
    input.items.forEach((item) => {
      const timestamp = new Date(item.timestamp).toLocaleString();
      lines.push(`- [${item.status.toUpperCase()}] ${timestamp} | ${item.owner}: ${item.update}`);
    });
  }

  lines.push('');
  lines.push('Reply to this message for urgent operational blockers.');

  return lines.join('\n');
}