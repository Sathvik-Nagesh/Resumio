import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL_NAME = "gemini-2.0-flash";

export function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }
  return new GoogleGenerativeAI(apiKey);
}

export async function runGeminiPrompt(prompt: string) {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 8192,
    }
  });

  const result = await model.generateContent(prompt);

  if (!result.response) {
    throw new Error("Gemini returned no response");
  }

  const text = result.response.text();

  if (!text || text.trim().length === 0) {
    throw new Error("Gemini returned empty response");
  }

  return text;
}

export function extractGeminiJson<T = unknown>(text: string): T {
  // Remove common Markdown code-fence wrappers (e.g. ```json\n ... ```)
  // This removes the opening fence with optional language and a following newline,
  // as well as any closing ``` occurrences.
  const sanitized = text
    .trim()
    .replace(/```(?:[a-zA-Z0-9+\-]*)?\n/gi, "")
    .replace(/```/g, "");

  const objRegex = /\{[\s\S]*\}/;
  const arrRegex = /\[[\s\S]*\]/;

  const objIndex = sanitized.search(objRegex);
  const arrIndex = sanitized.search(arrRegex);

  if (objIndex === -1 && arrIndex === -1) {
    throw new Error("Gemini response did not contain a JSON object or array");
  }

  let jsonString: string;
  if (objIndex !== -1 && (arrIndex === -1 || objIndex <= arrIndex)) {
    const m = sanitized.match(objRegex);
    jsonString = m ? m[0] : "";
  } else {
    const m = sanitized.match(arrRegex);
    jsonString = m ? m[0] : "";
  }

  if (!jsonString) {
    throw new Error("Failed to locate JSON content in Gemini response");
  }

  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    throw new Error(`Failed to parse Gemini JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function runGeminiPromptAsJson<T>(prompt: string): Promise<T> {
  const raw = await runGeminiPrompt(prompt);
  return extractGeminiJson<T>(raw);
}
