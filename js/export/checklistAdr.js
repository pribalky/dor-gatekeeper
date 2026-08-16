import { round2, slugify } from "./jsonExport.js";

// Standard ADR sections for the checklist-level assessment, reusing the same
// scoreResult/gaps data buildMarkdownExport already consumes — not a second
// computation. Paired 1-click with the existing OPA/Rego export (opaExport.js) via
// the "Export ADR + Policy Bundle" button, no new Rego logic needed here.
export function buildChecklistAdr(framework, state, scoreResult, gaps) {
  const lines = [];

  lines.push(`# ADR: ${state.feature_name}`);
  lines.push("");
  lines.push(`## Status`);
  lines.push("");
  lines.push(`Proposed — DoR gate decision: **${scoreResult.gateDecision}** (${round2(scoreResult.overallScore)}/100, ${framework.label}).`);
  lines.push("");

  lines.push(`## Context`);
  lines.push("");
  if (gaps.length === 0) {
    lines.push("No gaps were identified against the Definition of Ready criteria.");
  } else {
    lines.push("The following gaps against the Definition of Ready criteria remain open:");
    lines.push("");
    gaps.forEach((gap, i) => {
      const tag = gap.category_tag === "Other" ? gap.category_tag_freetext : gap.category_tag;
      lines.push(`${i + 1}. **[${gap.severity_gov}] ${gap.description}** _(${gap.pillar_name} · ${tag})_`);
    });
  }
  lines.push("");

  lines.push(`## Decision`);
  lines.push("");
  if (gaps.length === 0) {
    lines.push("Proceed — all Definition of Ready criteria are satisfied.");
  } else {
    gaps.forEach((gap, i) => lines.push(`${i + 1}. ${gap.remediation}`));
  }
  lines.push("");

  lines.push(`## Consequences`);
  lines.push("");
  if (scoreResult.gateDecision === "BLOCKED") {
    lines.push("- The gate is BLOCKED — do not proceed until the action items above are resolved and the score clears the conditional threshold.");
  } else if (scoreResult.gateDecision === "CONDITIONAL") {
    lines.push("- The gate is CONDITIONAL — this may proceed, but the open items above should be tracked and resolved, not silently dropped.");
  } else {
    lines.push("- The gate is APPROVED — no outstanding Definition of Ready action items.");
  }
  lines.push(`- Re-assessment is required if any checklist answer changes after this decision is recorded.`);
  lines.push("");

  return lines.join("\n");
}

export function exportFilenameChecklistAdr(featureName, assessmentId) {
  return `${slugify(featureName)}_${assessmentId}_dor_adr.md`;
}
