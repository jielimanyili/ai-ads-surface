import { runPipeline } from "./orchestrator";
import { writeFileSync, mkdirSync } from "fs";
import path from "path";

async function main() {
  const query =
    process.argv.slice(2).join(" ").trim() || "best running shoes for marathon training";
  console.log(`\nQuery: ${query}\n`);

  const result = await runPipeline(query);
  console.log(JSON.stringify(result, null, 2));

  const outDir = path.resolve(__dirname, "..", "..", "data");
  mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, "last-result.json");
  writeFileSync(outFile, JSON.stringify(result, null, 2));
  console.log(`\nWrote ${outFile}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
