import { generateAd } from "./ad-agent";
import { validateAd } from "./validation-agent";
import { PipelineResult } from "./types";

/**
 * Agent orchestrator: query → ad agent (generate) → validation agent (judge).
 */
export async function runPipeline(query: string): Promise<PipelineResult> {
  const ad = await generateAd(query);
  const validation = await validateAd(query, ad);
  return { query, ad, validation };
}
