import { round2, slugify } from "./jsonExport.js";

export function buildMarkdownExport(state, scoreResult, gaps) {
  const lines = [];

  lines.push(`# DoR Gatekeeper Assessment — ${state.feature_name}`);
  lines.push("");
  lines.push(`- **Assessment ID:** ${state.assessment_id}`);
  lines.push(`- **Date:** ${state.assessment_date}`);
  lines.push(`- **Overall Score:** ${round2(scoreResult.overallScore)}/100`);
  lines.push(`- **Gate Decision:** ${scoreResult.gateDecision}`);
  lines.push("");

  lines.push("## Pillar Scores");
  lines.push("");
  for (const p of scoreResult.pillarScores) {
    lines.push(`- **${p.name}:** ${round2(p.score)}/100`);
  }
  lines.push("");

  lines.push("## Gap Analysis Breakdown");
  lines.push("");
  if (gaps.length === 0) {
    lines.push("No gaps identified — all criteria satisfied.");
  } else {
    for (const gap of gaps) {
      const tag = gap.category_tag === "Other" ? gap.category_tag_freetext : gap.category_tag;
      lines.push(`- **[${gap.severity_gov}] ${gap.description}** _(${gap.pillar_name} · ${tag})_`);
    }
  }
  lines.push("");

  lines.push("## Architecture Action Items");
  lines.push("");
  if (gaps.length === 0) {
    lines.push("No action items — all criteria satisfied.");
  } else {
    gaps.forEach((gap, i) => {
      lines.push(`${i + 1}. ${gap.remediation}`);
    });
  }
  lines.push("");

  return lines.join("\n");
}

export function exportFilenameMd(featureName, assessmentId) {
  return `${slugify(featureName)}_${assessmentId}_dor_export.md`;
}
