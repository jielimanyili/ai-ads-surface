# Architecture — AI-Native Ads Surface

## 1. Overview

An **AI-native ads surface** is a demo system that turns a user query into a generated ad and, before that ad reaches the user, scores its quality with an **LLM-as-judge**. It demonstrates two things: (1) **agentic orchestration** — an orchestrator coordinating a generation agent and a validation agent — and (2) **evaluation methodology for Generative AI output** — the validation agent's own accuracy is measured against a hand-labeled golden set (precision/recall/F1).

## 2. Goals and non-goals

**Goals**
- Show a real query → ad → validation → surface flow end-to-end.
- Demonstrate LLM-as-judge evaluation with measurable metrics (not just pass/fail).
- Evaluate the evaluator (golden-set precision/recall) — the core of "evaluation methodology + data quality."

**Non-goals**
- Production GenAI evaluation infrastructure (no online serving, no drift monitoring).
- Real ad serving, bidding, or monetization logic.
- Training or fine-tuning any model.
- Multi-tenant, multi-broker, or at-scale concerns.

## 3. Component diagram

```
                     ┌──────────────────────────────────────────────┐
                     │            Angular surface (Angular 22)      │
                     │   query input → render ad + validation view  │
                     └───────────────────────▲──────────────────────┘
                                             │ HTTP POST /generate
┌────────────────────────────────────────────┴─────────────────────────────┐
│                            agents (Express)                              │
│                                                                          │
│  ┌───────────────┐  1.generate   ┌────────────┐  2.validate  ┌──────────────────────┐
│  │  Orchestrator │ ─────────────▶ │  Ad Agent  │ ────────────▶ │  Validation Agent    │
│  └───────────────┘               └─────┬──────┘               │  (LLM-as-judge)      │
│                                        │                       │  faithfulness         │
│                                        │                       │  relevance            │
│                                        │                       │  hallucination_safety │
│                                        │                       │  brand_safety         │
│                                        │                       └──────────┬───────────┘
│                                        │                                  │ scores + claims
│                                        │                                  ▼
│                          ┌─────────────┴───────────────┐        PipelineResult (JSON)
│                          │         LLM client          │
│                          │  OpenAI-compatible chat     │
│                          └─────────────┬───────────────┘
│                                        │ fetch /chat/completions
└────────────────────────────────────────┴─────────────▶ LLM provider (OpenAI / DeepSeek / …)
```

The offline evaluator reuses only the validation agent:

```
data/golden-set.json ──▶ evaluate.ts ──▶ data/eval-report.md
```

## 4. Components

- **Orchestrator** (`orchestrator.ts`) — the only top-level entry. Runs the two-agent sequence and returns a typed `PipelineResult`. Owns ordering and contracts; holds no business logic of its own.
- **Ad agent** (`ad-agent.ts`) — a single LLM call that turns a query into a structured `AdDraft` (headline / body / callToAction). Temperature 0.5 for creative variety.
- **Validation agent** (`validation-agent.ts`) — the evaluation core. A second LLM call at temperature 0 (deterministic) that scores the ad on four axes, returning a rationale per score, an overall pass/fail, and a list of hallucinated claims.
- **LLM client** (`llm.ts`) — a provider-agnostic wrapper over the OpenAI-compatible `/chat/completions` endpoint, with no SDK dependency. Configurable via `OPENAI_BASE_URL` / `OPENAI_MODEL` / `OPENAI_API_KEY`, so it works with OpenAI, DeepSeek, or any compatible gateway. `extractJson` tolerates markdown-fenced or prose-wrapped JSON.
- **Angular surface** (`frontend/`) — a standalone Angular 22 app: query input → `POST /generate` → renders the ad and the validation table.
- **Evaluator** (`evaluate.ts`) — runs the validation agent over `data/golden-set.json` and computes precision/recall/F1 plus pass/fail agreement, writing `data/eval-report.md`.

## 5. Data flow

1. Client POSTs `{ query }` to `/generate`.
2. Orchestrator calls the ad agent → `AdDraft`.
3. Orchestrator calls the validation agent → `ValidationReport`.
4. Server returns `{ query, ad, validation }` as JSON.
5. Angular renders the ad and the validation scores/claims.

`evaluate.ts` (offline) reuses step 3 against each golden-set example, replacing the ad agent with pre-written, human-labeled ads.

## 6. Evaluation design

The validation agent is an **LLM-as-judge**: a deterministic (temperature 0) second model call that scores the ad on four 0–1 axes — **faithfulness, relevance, hallucination_safety, brand_safety** — plus a rationale per score, an overall pass/fail, and hallucinated claims.

**Hallucination "flagged" rule:** the ad is flagged if the judge lists any hallucinated claim, or `hallucination_safety < 0.6`.

**Measuring the evaluator:** the golden set is labeled `good | hallucinated | off_brand`. Hallucination detection is treated as binary classification (positive = `hallucinated`) over `good` + `hallucinated` examples only; `off_brand` examples are measured separately via overall pass/fail (they are relevance/brand failures, not hallucinations). Reported: TP/FP/FN/TN, precision, recall, F1, accuracy, and pass/fail agreement.

**Why this matters:** measuring the validator (rather than just building it) is what converts "I built an AI validator" into defensible "evaluation methodology + data quality" evidence.

## 7. Key decisions & tradeoffs

- **Separate generation from validation.** Generation (creative, temp 0.5) and evaluation (deterministic, temp 0) are different roles with different sampling; coupling them would muddy both. A separate validation agent is independently reusable and independently evaluable.
- **LLM-as-judge over rule-based checks.** Open-ended ad text can't be scored by regex/exact-match; a judge LLM handles faithfulness/relevance/hallucination. Cost: judge variance — mitigated by temperature 0 and by measuring the judge against a golden set.
- **Four-axis scoring with rationales.** Scores without rationales are un-debuggable; the one-sentence rationale makes each verdict auditable.
- **Provider-agnostic LLM client.** An OpenAI-compatible endpoint plus an `extractJson` fallback keeps the demo portable (OpenAI/DeepSeek/local) and removes an SDK dependency.
- **Threshold 0.6.** Chosen as the pass boundary. The observed result (recall 1.0 / precision 0.57) is a deliberate, measurable safety-leaning tradeoff — tunable per product risk posture.

## 8. Honesty boundary

This is a **project-level demo** with synthetic data, not production GenAI evaluation infrastructure. It does not serve traffic, monitor drift, or manage data at scale. The claims it supports are "hands-on evaluation methodology and data quality," not "production ML eval."

## 9. Future work

- Tune the judge threshold/prompt to trade recall for precision.
- Add concurrency to `evaluate.ts` for larger golden sets.
- Persist golden-set labels and judge scores to a small store for repeatable reporting.
- Stream validation results to the UI (SSE) instead of a single response.
