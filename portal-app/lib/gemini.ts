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
