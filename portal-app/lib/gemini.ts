import { GoogleGenerativeAI } from '@google/generative-ai';

const MODEL = 'gemini-2.0-flash';

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

export async function geminiGenerateJson<T>(
  userPrompt: string,
  systemInstruction: string
): Promise<T | null> {
  if (!isGeminiConfigured()) {
    return null;
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

  const model = genAI.getGenerativeModel({
    model: MODEL,
    systemInstruction,
    generationConfig: { responseMimeType: 'application/json' }
  });

  const result = await model.generateContent(userPrompt);
  return JSON.parse(result.response.text()) as T;
}

export interface ChatTurn {
  role: 'user' | 'model';
  text: string;
}

/**
 * Multi-turn chat completion. `turns` is the full conversation; the LAST turn
 * must be the user's current message. Returns null when no key is configured
 * (callers fall back to a deterministic response). Never throws on a malformed
 * conversation — returns null instead.
 */
export async function geminiChat(turns: ChatTurn[], systemInstruction: string): Promise<string | null> {
  if (!isGeminiConfigured() || turns.length === 0) {
    return null;
  }

  const last = turns[turns.length - 1];

  if (last.role !== 'user') {
    return null;
  }

  // Gemini requires history to begin with a 'user' turn and alternate. Drop any
  // leading 'model' turns so a conversation that starts with an assistant
  // greeting still works.
  let history = turns.slice(0, -1).map((turn) => ({ role: turn.role, parts: [{ text: turn.text }] }));

  while (history.length > 0 && history[0].role !== 'user') {
    history = history.slice(1);
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
  const model = genAI.getGenerativeModel({ model: MODEL, systemInstruction });
  const chat = model.startChat({ history });
  const result = await chat.sendMessage(last.text);

  return result.response.text();
}
