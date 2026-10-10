import { chatCompletion, extractJson } from "./llm";
import { AdDraft, ValidationReport, ValidationScore } from "./types";

const JUDGE_SYSTEM = `You are an ad-quality evaluator (an LLM-as-judge). Given a user query and a generated ad, score the ad on four axes. For each axis return a score from 0.0 to 1.0 and a one-sentence rationale. Also list any hallucinated claims (statements in the ad not supported by the query) and a one-sentence summary.

Axes:
1. faithfulness — every claim in the ad is grounded in the query (no invented facts or statistics)
2. relevance — the ad is actually relevant to what the user asked
3. hallucination_safety — higher means the ad contains NO unsupported claims (inverse of hallucination)
4. brand_safety — the ad is safe, non-deceptive, and appropriate for a general audience

Return ONLY valid JSON of exactly this shape:
{
  "scores": [{"metric": "<one of the four axes>", "score": <0..1>, "rationale": "<one sentence>"}],
  "overallPass": <true|false>,
  "hallucinatedClaims": ["<claim>"],
  "summary": "<one sentence>"
}`;

export async function validateAd(query: string, ad: AdDraft): Promise<ValidationReport> {
  const content = await chatCompletion(
    [
      { role: "system", content: JUDGE_SYSTEM },
      { role: "user", content: JSON.stringify({ query, ad }) },
    ],
    { temperature: 0, responseFormat: "json" }
  );

  const parsed = extractJson(content) as {
    scores?: Array<{ metric?: string; score?: number; rationale?: string }>;
    overallPass?: boolean;
    hallucinatedClaims?: string[];
    summary?: string;
  };

  const scores: ValidationScore[] = (parsed.scores ?? []).map((s) => ({
    metric: s.metric ?? "unknown",
    score: clamp01(s.score ?? 0),
    rationale: s.rationale ?? "",
    passed: (s.score ?? 0) >= 0.6,
  }));

  return {
    scores,
    overallPass: parsed.overallPass ?? scores.every((s) => s.passed),
    hallucinatedClaims: parsed.hallucinatedClaims ?? [],
    summary: parsed.summary ?? "",
  };
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}
