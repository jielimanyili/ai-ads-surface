import { validateAd } from "./validation-agent";
import { ValidationReport } from "./types";
import { readFileSync, writeFileSync } from "fs";
import path from "path";

type Label = "good" | "hallucinated" | "off_brand";

interface GoldenAd {
  headline: string;
  body: string;
  callToAction: string;
}

interface GoldenExample {
  id: string;
  query: string;
  ad: GoldenAd;
  label: Label;
}

interface GoldenSet {
  description: string;
  examples: GoldenExample[];
}

interface Row {
  example: GoldenExample;
  flagged: boolean;
  report: ValidationReport;
}

const HALLUCINATION_THRESHOLD = 0.6;

/** The validator "flags" a hallucination if it lists claims or scores hallucination_safety low. */
function isHallucinationFlagged(report: ValidationReport): boolean {
  const safety = report.scores.find((s) => s.metric === "hallucination_safety");
  return report.hallucinatedClaims.length > 0 || (safety !== undefined && safety.score < HALLUCINATION_THRESHOLD);
}

async function main() {
  const dataDir = path.resolve(__dirname, "..", "..", "data");
  const set = JSON.parse(readFileSync(path.join(dataDir, "golden-set.json"), "utf-8")) as GoldenSet;

  const rows: Row[] = [];
  for (const example of set.examples) {
    const report = await validateAd(example.query, example.ad);
    rows.push({ example, flagged: isHallucinationFlagged(report), report });
  }

  // Hallucination detection (binary; positive = "hallucinated"). Evaluated over
  // good + hallucinated only — off_brand examples are relevance/brand failures,
  // not hallucinations, so they're measured separately below.
  const rel = rows.filter((r) => r.example.label !== "off_brand");
  const tp = rel.filter((r) => r.example.label === "hallucinated" && r.flagged).length;
  const fp = rel.filter((r) => r.example.label === "good" && r.flagged).length;
  const fn = rel.filter((r) => r.example.label === "hallucinated" && !r.flagged).length;
  const tn = rel.filter((r) => r.example.label === "good" && !r.flagged).length;

  const precision = tp + fp === 0 ? 0 : tp / (tp + fp);
  const recall = tp + fn === 0 ? 0 : tp / (tp + fn);
  const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
  const accuracy = (tp + tn) / Math.max(1, tp + tn + fp + fn);

  // Overall pass/fail agreement: good => pass; hallucinated/off_brand => fail.
  const passAgree = rows.filter((r) => r.report.overallPass === (r.example.label === "good")).length;

  const report = [
    "# Evaluation Report — Validation Agent (LLM-as-judge)",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Hallucination detection (binary; positive = `hallucinated`)",
    "",
    "Evaluated over the `good` + `hallucinated` examples (`off_brand` excluded — those are relevance/brand failures, not hallucinations).",
    "",
    "| Metric | Value |",
    "|---|---|",
    `| True positives (hallucinated & flagged) | ${tp} |`,
    `| False positives (good but flagged) | ${fp} |`,
    `| False negatives (hallucinated but missed) | ${fn} |`,
    `| True negatives (good & not flagged) | ${tn} |`,
    `| **Precision** | **${precision.toFixed(2)}** |`,
    `| **Recall** | **${recall.toFixed(2)}** |`,
    `| **F1** | **${f1.toFixed(2)}** |`,
    `| Accuracy | ${accuracy.toFixed(2)} |`,
    "",
    "## Overall pass/fail agreement",
    "",
    `- Correct pass/fail verdicts: **${passAgree} / ${rows.length}**`,
    "",
    "## Per-example results",
    "",
    "| id | label | hallucination_flagged | overallPass | note |",
    "|---|---|---|---|---|",
    ...rows.map((r) => {
      const note =
        r.example.label === "hallucinated"
          ? r.flagged
            ? "caught"
            : "MISSED"
          : r.example.label === "good"
            ? r.flagged
              ? "false positive"
              : "ok"
            : r.report.overallPass
              ? "off_brand PASSED (should fail)"
              : "off_brand failed ✓";
      return `| ${r.example.id} | ${r.example.label} | ${r.flagged} | ${r.report.overallPass} | ${note} |`;
    }),
    "",
  ].join("\n");

  writeFileSync(path.join(dataDir, "eval-report.md"), report);
  console.log(report);
  console.log(`\nWrote ${path.join(dataDir, "eval-report.md")}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
