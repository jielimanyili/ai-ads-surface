export interface AdDraft {
  headline: string;
  body: string;
  callToAction: string;
}

export interface ValidationScore {
  metric: string;
  score: number; // 0..1
  rationale: string;
  passed: boolean;
}

export interface ValidationReport {
  scores: ValidationScore[];
  overallPass: boolean;
  hallucinatedClaims: string[];
  summary: string;
}

export interface PipelineResult {
  query: string;
  ad: AdDraft;
  validation: ValidationReport;
}
