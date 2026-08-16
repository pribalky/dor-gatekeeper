export function round2(n) {
  return Math.round(n * 100) / 100;
}

// Turns a feature name into a filesystem-safe, human-scannable slug for filenames.
export function slugify(text) {
  const slug = (text || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return slug || "untitled";
}

// Builds the App 2 handoff contract exactly per PRD §4: only gap_id, description,
// severity_gov, category_tag (+ category_tag_freetext when Other) cross the boundary —
// internal fields like `remediation` and `answer` are App 1 UI concerns and stay behind.
// `schemaVersion` is per-framework: "1.0" for the baseline (existing category_tag
// enum only), "1.1" for presets that use the extended enum (Safety/AssetLifecycle/
// SupplyChain) — see DECISIONS.md.
export function buildJsonExport(pillars, schemaVersion, state, scoreResult, gaps) {
  const exportPillars = pillars.map((pillar, idx) => ({
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
    schema_version: schemaVersion,
    assessment_id: state.assessment_id,
    assessment_date: state.assessment_date,
    feature_name: state.feature_name,
    overall_score: round2(scoreResult.overallScore),
    gate_decision: scoreResult.gateDecision,
    pillars: exportPillars,
  };
}

// Feature name first (what a user recognizes in a downloads folder), assessment_id
// second (the stable identifier App 2 keys off) — see DECISIONS.md #16.
export function exportFilenameJson(featureName, assessmentId) {
  return `${slugify(featureName)}_${assessmentId}_dor_export.json`;
}

// Same JSON shape/content as exportFilenameJson — the "baseline" designation is
// filename-only, a State Sync Bridge snapshot recognizable on dor-recovery-console's
// side (see DECISIONS.md). No new export logic; buildJsonExport is reused as-is.
export function exportFilenameBaseline(featureName, assessmentId) {
  return `${slugify(featureName)}_${assessmentId}_dor_baseline.json`;
}
