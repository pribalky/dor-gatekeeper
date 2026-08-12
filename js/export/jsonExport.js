import { PILLARS } from "../config/criteria.js";

export const SCHEMA_VERSION = "1.0";

export function round2(n) {
  return Math.round(n * 100) / 100;
}

// Builds the App 2 handoff contract exactly per PRD §4: only gap_id, description,
// severity_gov, category_tag (+ category_tag_freetext when Other) cross the boundary —
// internal fields like `remediation` and `answer` are App 1 UI concerns and stay behind.
export function buildJsonExport(state, scoreResult, gaps) {
  const pillars = PILLARS.map((pillar, idx) => ({
    pillar_name: pillar.name,
    pillar_score: round2(scoreResult.pillarScores[idx].score),
    gaps: gaps
      .filter((g) => g.pillar_id === pillar.id)
      .map((g) => {
        const out = {
          gap_id: g.gap_id,
          description: g.description,
          severity_gov: g.severity_gov,
          category_tag: g.category_tag,
        };
        if (g.category_tag === "Other") out.category_tag_freetext = g.category_tag_freetext;
        return out;
      }),
  }));

  return {
    schema_version: SCHEMA_VERSION,
    assessment_id: state.assessment_id,
    assessment_date: state.assessment_date,
    feature_name: state.feature_name,
    overall_score: round2(scoreResult.overallScore),
    gate_decision: scoreResult.gateDecision,
    pillars,
  };
}

export function exportFilenameJson(assessmentId) {
  return `${assessmentId}_dor_export.json`;
}
