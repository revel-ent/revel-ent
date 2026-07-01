import type { Role } from '@/lib/auth';
import { buildBaseCanonicalTimeline, getTimelineProjectionForRole } from '@/lib/canonical-timeline';
import { getTaskProjectionForActor } from '@/lib/canonical-tasks';
import { getClientPlanForEvent } from '@/lib/client-plans';
import { getEventRecord } from '@/lib/event-context';
import { geminiChat, isGeminiConfigured, type ChatTurn } from '@/lib/gemini';
import type { DomainKey, DomainScope } from '@/lib/role-scoped-adapters';

export interface AssistantMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AssistantGroundingInput {
  eventId: string;
  role: Role;
  userId: string;
  domainScopes: Record<DomainKey, DomainScope>;
}

export interface AssistantAnswer {
  reply: string;
  source: 'gemini' | 'fallback';
  grounded: boolean;
}

// Only these roles see contract value and payment milestones in their grounding.
const PLAN_VISIBLE_ROLES: Role[] = ['admin', 'planner', 'couple'];

const TIMELINE_LIMIT = 20;
const TASK_LIMIT = 15;
const MILESTONE_LIMIT = 12;
const TODO_LIMIT = 10;

function formatDateTime(iso: string): string {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

function formatDate(iso: string): string {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatMoney(amount: number): string {
  if (!Number.isFinite(amount)) {
    return '$0';
  }

  return `$${Math.round(amount).toLocaleString('en-US')}`;
}

/**
 * Assemble a compact, role-scoped block of THIS event's real data for the model
 * to ground on. Honors the caller's domain scopes — a vendor never receives the
 * payment plan; a guest never reaches this code path. Culture-neutral: it emits
 * whatever phases/functions the event actually contains, never an assumed set.
 */
export async function buildAssistantGrounding(input: AssistantGroundingInput): Promise<string> {
  const { eventId, role, userId, domainScopes } = input;
  const sections: string[] = [];

  const event = await getEventRecord(eventId);

  if (event) {
    sections.push(
      [
        'EVENT',
        `- Name: ${event.title}`,
        `- City: ${event.city}`,
        `- Venue: ${event.venueName}`,
        `- Estimated guests: ${event.guestCountEstimate}`
      ].join('\n')
    );
  }

  if (domainScopes.timeline?.access !== 'none') {
    const projected = getTimelineProjectionForRole(buildBaseCanonicalTimeline(eventId), role).slice(0, TIMELINE_LIMIT);

    if (projected.length > 0) {
      // Omit wall-clock times — they are generated relative to "now", not anchored to the actual
      // event date, so showing them would give couples misleading timestamps months before their event.
      const lines = projected.map(
        (item) => `- [${item.phase}] ${item.title} (${item.status}, owner: ${item.ownerLabel})`
      );
      sections.push(`TIMELINE SEQUENCE (${projected.length} steps visible to this role — exact times confirmed closer to the date)\n${lines.join('\n')}`);
    }
  }

  if (domainScopes.tasks?.access !== 'none') {
    const projection = getTaskProjectionForActor({ eventId, actorUserId: userId, actorRole: role });
    const tasks = projection.tasks.slice(0, TASK_LIMIT);

    if (tasks.length > 0) {
      const lines = tasks.map(
        (task) =>
          `- [${task.priority}] ${task.title} — ${task.status}${
            task.dueAtIso ? ` (due ${formatDate(task.dueAtIso)})` : ''
          }`
      );
      sections.push(
        `TASKS (${projection.summary.openTasks} open of ${projection.summary.totalTasks})\n${lines.join('\n')}`
      );
    }
  }

  if (PLAN_VISIBLE_ROLES.includes(role)) {
    const plan = await getClientPlanForEvent(eventId);

    if (plan) {
      const milestones = plan.paymentMilestones
        .slice(0, MILESTONE_LIMIT)
        .map(
          (milestone) =>
            `- ${milestone.label}: ${formatMoney(milestone.amount)} (${milestone.status}${
              milestone.dueDate ? `, due ${formatDate(milestone.dueDate)}` : ''
            })`
        );

      const todos = plan.planningTodos
        .filter((todo) => todo.status !== 'completed')
        .slice(0, TODO_LIMIT)
        .map((todo) => `- ${todo.title} (${todo.status})`);

      const planLines = [
        `- Total contract value: ${formatMoney(plan.totalContractValue)}`,
        milestones.length ? `Payment milestones:\n${milestones.join('\n')}` : '',
        todos.length ? `Open planning to-dos:\n${todos.join('\n')}` : ''
      ].filter(Boolean);

      sections.push(`PLAN & PAYMENTS\n${planLines.join('\n')}`);
    }
  }

  if (sections.length === 0) {
    return 'No event data is available yet for this user.';
  }

  return sections.join('\n\n');
}

function buildSystemInstruction(role: string, grounding: string): string {
  return [
    'You are Atlas, the AI assistant built into a wedding planning platform.',
    `You are helping a user whose role is "${role}". Match your scope and depth to that role.`,
    'You serve weddings of EVERY culture and tradition. Never assume a default culture or a standard set of functions. Use only the functions, rituals, vendors, and vocabulary that appear in this event\'s data — if the data says "sangeet", say sangeet; if it says "rehearsal dinner", say that. Never introduce a ritual or event the couple did not include.',
    'Ground every answer in the EVENT FACTS below. If the answer is not present in the facts, say you do not have that detail yet and point the user to the relevant area of the portal (timeline, tasks, or payments). Never invent dates, amounts, names, vendors, or venues.',
    'Be concise and practical: short paragraphs or tight bullet lists. When you cite a time, task, status, or amount, take it verbatim from the facts.',
    '',
    'EVENT FACTS:',
    grounding
  ].join('\n');
}

function buildFallbackReply(grounding: string, hasQuestion: boolean): string {
  const intro = hasQuestion
    ? 'The AI assistant is in preview mode (no AI key configured), so here is a direct readout of your event data instead of a written answer:'
    : 'Here is a snapshot of your event:';

  return `${intro}\n\n${grounding}\n\nEnable the AI assistant (set GEMINI_API_KEY) for conversational answers.`;
}

/**
 * Answer a wedding-planning question grounded in pre-assembled event facts.
 * Falls back to a deterministic, still-grounded readout when no AI key is
 * configured or the model call fails — matching the platform's simulation-mode
 * pattern. Never throws.
 */
export async function answerWeddingQuestion(params: {
  grounding: string;
  role: Role;
  messages: AssistantMessage[];
}): Promise<AssistantAnswer> {
  const { grounding, role, messages } = params;
  const hasUserQuestion = messages.some((message) => message.role === 'user' && message.content.trim());

  if (!isGeminiConfigured()) {
    return { reply: buildFallbackReply(grounding, hasUserQuestion), source: 'fallback', grounded: true };
  }

  const system = buildSystemInstruction(role, grounding);
  const turns: ChatTurn[] = messages
    .filter((message) => message.content.trim())
    .map((message) => ({ role: message.role === 'assistant' ? 'model' : 'user', text: message.content }));

  try {
    const reply = await geminiChat(turns, system);

    if (reply && reply.trim()) {
      return { reply: reply.trim(), source: 'gemini', grounded: true };
    }
  } catch {
    // Fall through to the deterministic fallback below.
  }

  return { reply: buildFallbackReply(grounding, hasUserQuestion), source: 'fallback', grounded: true };
}
