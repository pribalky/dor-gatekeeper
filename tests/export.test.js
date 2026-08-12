import { assertEqual, assertTrue } from "./assert.js";
import { scoreAssessment } from "../js/engine/scoring.js";
import { deriveGaps } from "../js/engine/gaps.js";
import { buildJsonExport, SCHEMA_VERSION, exportFilenameJson, slugify } from "../js/export/jsonExport.js";
import { buildMarkdownExport, exportFilenameMd } from "../js/export/markdownExport.js";
import { PILLARS, SAMPLES } from "../js/config/criteria.js";

function makeState(sample) {
  return {
    assessment_id: "test-uuid-0000",
    assessment_date: "2026-01-01T00:00:00.000Z",
    feature_name: sample.feature_name,
    answers: sample.answers,
  };
}

const borderline = SAMPLES.find((s) => s.id === "intentionally_off");
const state = makeState(borderline);
const scoreResult = scoreAssessment(state.answers);
const gaps = deriveGaps(state.answers);
const json = buildJsonExport(state, scoreResult, gaps);

assertEqual(json.schema_version, SCHEMA_VERSION, "export carries schema_version 1.0");
assertEqual(json.assessment_id, state.assessment_id, "export carries assessment_id");
assertEqual(json.feature_name, state.feature_name, "export carries feature_name");
assertTrue(
  ["APPROVED", "CONDITIONAL", "BLOCKED"].includes(json.gate_decision),
  "gate_decision is a valid enum value"
);
assertEqual(json.pillars.length, PILLARS.length, "export has one entry per pillar");

const allExportedGaps = json.pillars.flatMap((p) => p.gaps);
assertTrue(allExportedGaps.length > 0, "the borderline sample produces at least one gap");

for (const gap of allExportedGaps) {
  if (gap.category_tag === "Other") {
    assertTrue(Boolean(gap.category_tag_freetext), `Other-tagged gap ${gap.gap_id} carries category_tag_freetext`);
  } else {
    assertTrue(gap.category_tag_freetext === undefined, `non-Other gap ${gap.gap_id} omits category_tag_freetext`);
  }
}

const gapIds = allExportedGaps.map((g) => g.gap_id);
assertEqual(new Set(gapIds).size, gapIds.length, "all gap_id values are unique within the export");

// A fully "yes" assessment exports zero gaps across every pillar.
const bestSample = SAMPLES.find((s) => s.id === "best");
const bestState = makeState(bestSample);
const bestScore = scoreAssessment(bestState.answers);
const bestGaps = deriveGaps(bestState.answers);
const bestJson = buildJsonExport(bestState, bestScore, bestGaps);
const bestExportedGaps = bestJson.pillars.flatMap((p) => p.gaps);
assertEqual(bestExportedGaps.length, 0, "the fully-ready sample exports zero gaps");
assertEqual(bestJson.gate_decision, "APPROVED", "the fully-ready sample exports gate_decision APPROVED");

const md = buildMarkdownExport(state, scoreResult, gaps);
assertTrue(md.includes(state.feature_name), "markdown export includes the feature name");
assertTrue(md.includes(scoreResult.gateDecision), "markdown export includes the gate decision");
assertTrue(md.includes("Gap Analysis Breakdown"), "markdown export includes the gap analysis section");
assertTrue(md.includes("Architecture Action Items"), "markdown export includes the action items section");

// Download filenames lead with the feature name so files are recognizable in a
// downloads folder, and still carry the assessment_id for stable tracking.
assertEqual(slugify("Customer Support Chatbot v2!"), "customer-support-chatbot-v2", "slugify lowercases and hyphenates");
assertEqual(slugify(""), "untitled", "slugify falls back to 'untitled' for an empty name");
assertEqual(
  exportFilenameJson("Customer Support Chatbot", "abc-123"),
  "customer-support-chatbot_abc-123_dor_export.json",
  "JSON filename leads with the slugified feature name, then assessment_id"
);
assertEqual(
  exportFilenameMd("Customer Support Chatbot", "abc-123"),
  "customer-support-chatbot_abc-123_dor_export.md",
  "Markdown filename leads with the slugified feature name, then assessment_id"
);
