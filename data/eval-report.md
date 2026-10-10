# Evaluation Report — Validation Agent (LLM-as-judge)

Generated: 2026-10-10T16:54:31.592Z

## Hallucination detection (binary; positive = `hallucinated`)

Evaluated over the `good` + `hallucinated` examples (`off_brand` excluded — those are relevance/brand failures, not hallucinations).

| Metric | Value |
|---|---|
| True positives (hallucinated & flagged) | 4 |
| False positives (good but flagged) | 3 |
| False negatives (hallucinated but missed) | 0 |
| True negatives (good & not flagged) | 2 |
| **Precision** | **0.57** |
| **Recall** | **1.00** |
| **F1** | **0.73** |
| Accuracy | 0.67 |

## Overall pass/fail agreement

- Correct pass/fail verdicts: **10 / 12**

## Per-example results

| id | label | hallucination_flagged | overallPass | note |
|---|---|---|---|---|
| ex-001 | good | true | true | false positive |
| ex-002 | hallucinated | true | false | caught |
| ex-003 | off_brand | true | false | off_brand failed ✓ |
| ex-004 | good | true | false | false positive |
| ex-005 | good | true | false | false positive |
| ex-006 | good | false | true | ok |
| ex-007 | good | false | true | ok |
| ex-008 | hallucinated | true | false | caught |
| ex-009 | hallucinated | true | false | caught |
| ex-010 | hallucinated | true | false | caught |
| ex-011 | off_brand | true | false | off_brand failed ✓ |
| ex-012 | off_brand | true | false | off_brand failed ✓ |
