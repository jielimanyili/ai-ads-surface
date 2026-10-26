export type AdLabel = 'good' | 'hallucinated' | 'off_brand';

export interface EvalExample {
  id: string;
  query: string;
  label: AdLabel;
  hallucinationFlagged: boolean;
  overallPass: boolean;
  note: string;
}

export interface EvalMetrics {
  truePositive: number;
  falsePositive: number;
  falseNegative: number;
  trueNegative: number;
  precision: number;
  recall: number;
  f1: number;
  accuracy: number;
  agreement: number;
  agreementTotal: number;
}

/**
 * Real evaluation results (Phase 2) — transcribed from data/eval-report.md and
 * data/golden-set.json. The validation agent (LLM-as-judge) was measured against a
 * 12-example hand-labeled golden set for hallucination detection.
 */
export const evalMetrics: EvalMetrics = {
  truePositive: 4, // hallucinated & flagged
  falsePositive: 3, // good but flagged
  falseNegative: 0, // hallucinated but missed
  trueNegative: 2, // good & not flagged
  precision: 0.57,
  recall: 1.0,
  f1: 0.73,
  accuracy: 0.67,
  agreement: 10,
  agreementTotal: 12,
};

export const evalExamples: EvalExample[] = [
  { id: 'ex-001', query: 'best running shoes for marathon training', label: 'good', hallucinationFlagged: true, overallPass: true, note: 'false positive' },
  { id: 'ex-002', query: 'best running shoes for marathon training', label: 'hallucinated', hallucinationFlagged: true, overallPass: false, note: 'caught' },
  { id: 'ex-003', query: 'best running shoes for marathon training', label: 'off_brand', hallucinationFlagged: true, overallPass: false, note: 'off_brand failed ✓' },
  { id: 'ex-004', query: 'cheap flights to New York', label: 'good', hallucinationFlagged: true, overallPass: false, note: 'false positive' },
  { id: 'ex-005', query: 'best credit cards for travel rewards', label: 'good', hallucinationFlagged: true, overallPass: false, note: 'false positive' },
  { id: 'ex-006', query: 'how to fix a leaky faucet', label: 'good', hallucinationFlagged: false, overallPass: true, note: 'ok' },
  { id: 'ex-007', query: 'best laptops for video editing', label: 'good', hallucinationFlagged: false, overallPass: true, note: 'ok' },
  { id: 'ex-008', query: 'cheap flights to New York', label: 'hallucinated', hallucinationFlagged: true, overallPass: false, note: 'caught' },
  { id: 'ex-009', query: 'best credit cards for travel rewards', label: 'hallucinated', hallucinationFlagged: true, overallPass: false, note: 'caught' },
  { id: 'ex-010', query: 'best laptops for video editing', label: 'hallucinated', hallucinationFlagged: true, overallPass: false, note: 'caught' },
  { id: 'ex-011', query: 'best credit cards for travel rewards', label: 'off_brand', hallucinationFlagged: true, overallPass: false, note: 'off_brand failed ✓' },
  { id: 'ex-012', query: 'how to fix a leaky faucet', label: 'off_brand', hallucinationFlagged: true, overallPass: false, note: 'off_brand failed ✓' },
];
