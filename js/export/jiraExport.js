import { edgeCaseFor } from "../config/edgeCaseMap.js";
import { slugify } from "./jsonExport.js";

// The honest, static-compatible version of "auto-generates AC/edge-case/NFR tags
// directly inside Jira tickets": generate paste-ready content, let the user paste it
// in themselves, rather than writing to Jira's API (which needs OAuth/a backend).

export function buildJiraAcceptanceCriteria(gaps) {
  return gaps.map(
    (g) =>
      `GIVEN ${g.pillar_name}, WHEN addressing "${g.description}", THEN this must be satisfied before merge (severity: ${g.severity_gov}).`
  );
}

export function buildJiraEdgeCases(gaps) {
  return gaps.map((g) => `${g.description} — ${edgeCaseFor(g.category_tag)}`);
}

// Jira-label-safe: lowercase, hyphenated, prefixed so labels group together in a
// board's label filter regardless of which framework/category_tag they came from.
export function buildJiraLabels(gaps) {
  const tags = new Set(gaps.map((g) => g.category_tag));
  return [...tags].map((tag) => `nfr-${tag.toLowerCase()}`);
}

// Jira wiki markup (h3./* bullets) so the block pastes cleanly into a ticket's
// Description field on Jira Server/Data Center; Jira Cloud's editor also accepts
// plain text with markdown-like bullets as a reasonable degradation.
export function buildJiraCopyBlock(state, gaps) {
  const lines = [];

  lines.push(`h2. DoR Gap Summary — ${state.feature_name || "Untitled"}`);
  lines.push("");

  if (gaps.length === 0) {
    lines.push("No open gaps — all Definition of Ready criteria satisfied.");
    return lines.join("\n");
  }

  lines.push("h3. Acceptance Criteria");
  buildJiraAcceptanceCriteria(gaps).forEach((line) => lines.push(`* ${line}`));
  lines.push("");

  lines.push("h3. Edge Cases");
  buildJiraEdgeCases(gaps).forEach((line) => lines.push(`* ${line}`));
  lines.push("");

  lines.push("h3. Labels");
  lines.push(buildJiraLabels(gaps).join(", "));

  return lines.join("\n");
}

export function exportFilenameJiraTxt(featureName, assessmentId) {
  return `${slugify(featureName)}_${assessmentId}_jira_content.txt`;
}
