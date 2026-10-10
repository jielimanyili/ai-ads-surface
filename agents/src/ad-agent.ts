import { chatCompletion, extractJson } from "./llm";
import { AdDraft } from "./types";

const SYSTEM = `You are an ad-copy agent for an AI-native search surface. Given a user query, write a short, native-feeling ad that is relevant and useful — not spammy. Return ONLY JSON: {"headline":"...","body":"...","callToAction":"..."}`;

export async function generateAd(query: string): Promise<AdDraft> {
  const content = await chatCompletion(
    [
      { role: "system", content: SYSTEM },
      { role: "user", content: query },
    ],
    { responseFormat: "json", temperature: 0.5 }
  );
  const parsed = extractJson(content) as Partial<AdDraft>;
  return {
    headline: parsed.headline ?? "",
    body: parsed.body ?? "",
    callToAction: parsed.callToAction ?? "",
  };
}
