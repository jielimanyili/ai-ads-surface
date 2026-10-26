# AI-Native Ads Surface — Agentic Ad Generation with an LLM Validation Layer

A demo of an **AI-native ads surface**: a user query flows through an **agent orchestrator** to an **ad-generation agent**, then a **validation agent (LLM-as-judge)** scores the ad's quality before it reaches the **Angular** surface. The validation layer is the point of this project — it demonstrates **evaluation methodology and data quality** for Generative AI output.

> **Honest framing:** self-contained demo with synthetic, mock ad data. It is **not** production GenAI evaluation infrastructure. The validation agent and golden-set evaluation are hands-on, project-level evidence.

## Live demo

**https://ai-ads-surface.vercel.app** — static Vercel deploy. The Evaluation Dashboard is the default view and fully static (no backend / API key); the "Generate & Validate" view needs the agents backend.

## Architecture

```
              ┌───────────────┐
    query ──▶ │ Orchestrator  │
              └──────┬────────┘
                     │ 1. generate
                     ▼
              ┌──────────────┐     2. validate     ┌─────────────────────┐
              │   Ad Agent   │ ──────────────────▶ │  Validation Agent    │
              │  (LLM call)  │                     │  (LLM-as-judge)      │
              └──────────────┘                     │  · faithfulness      │
                                                   │  · relevance         │
                                                   │  · hallucination     │
                                                   │  · brand safety      │
                                                   └──────────┬───────────┘
                                                              │ scores + flags
                                                              ▼
                                                 ┌─────────────────────────┐
                                                 │   Angular surface        │
                                                 │  (ad, validation, eval)  │
                                                 └─────────────────────────┘
```

## Evaluation methodology (the core claim)

The validation agent is an **LLM-as-judge**: a second model call that scores the ad agent's output on four axes (0–1):

| Metric | Question it answers |
|---|---|
| **faithfulness** | Is every claim in the ad grounded in the query (no invented facts)? |
| **relevance** | Is the ad actually relevant to what the user asked? |
| **hallucination_safety** | Does the ad avoid unsupported claims? (higher = safer) |
| **brand_safety** | Is the ad safe, non-deceptive, and appropriate? |

Each score carries a one-sentence rationale; the judge also returns an overall pass/fail and a list of hallucinated claims.

**Measuring the evaluator (Phase 2):** `data/golden-set.json` is a hand-labeled set of (query, ad) examples tagged `good | hallucinated | off_brand`. `npm run eval` runs the validation agent against it and writes `data/eval-report.md`, reporting the validator's **precision/recall/F1** at detecting hallucinations plus its overall pass/fail agreement — i.e., we evaluate the evaluator. That's what turns "I built a validator" into "I measured my validator's accuracy."

The frontend's **Evaluation Dashboard** visualizes those results — KPI cards (precision/recall/F1/accuracy), a hallucination-detection chart, a metrics chart, and the per-example golden-set table — so the evaluation is visible, not just reported.

## Stack
- **Agents:** Node.js + TypeScript (Express), OpenAI-compatible chat completions (any provider via `.env`).
- **Frontend:** Angular 22 (standalone) + Chart.js (evaluation dashboard).
- **Data:** `data/golden-set.json` (Phase 2).

## Run it

```bash
# 1. Configure
cp .env.example .env          # fill in OPENAI_API_KEY

# 2. Install + start the agents (POST /generate on :4000)
npm run install:agents
npm run dev:agents

# 3. (optional) run the pipeline once from the CLI
npm run pipeline -- "best running shoes for marathon training"

# 4. Evaluate the validator against the golden set (Phase 2) → data/eval-report.md
npm run eval

# 5. Start the Angular surface (http://localhost:4200)
npm run install:frontend
npm run dev:frontend
```

The CLI prints a full JSON result (ad + validation scores + hallucinated claims) and writes it to `data/last-result.json`.

## Repo layout
- `agents/` — orchestrator, ad agent, validation agent, LLM client (OpenAI-compatible).
- `frontend/` — Angular 22 surface (generate/validate + evaluation dashboard).
- `data/golden-set.json` — labeled evaluation examples (Phase 2).
- `docs/architecture.md` — system design, evaluation methodology, and key decisions.

## Deploy (static, Vercel)

The frontend is deployed as a **static site** to Vercel — the Evaluation Dashboard works out of the box; the generate flow needs the agents backend.

**Production:** https://ai-ads-surface.vercel.app

```bash
cd frontend
npx vercel --prod   # redeploy from the same source
```

- `frontend/vercel.json` — build command + output dir (`dist/ai-ads-surface/browser`) + SPA rewrite.
- The **Evaluation Dashboard** is the default view and is fully static (no backend / API key).
- The **Generate & Validate** view needs the agents backend — set `apiUrl` in `frontend/src/environments/environment.prod.ts` once the backend is deployed.
