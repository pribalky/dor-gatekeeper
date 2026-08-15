import { assertEqual, assertTrue } from "./assert.js";
import { deriveGaps } from "../js/engine/gaps.js";
import {
  buildJiraAcceptanceCriteria,
  buildJiraEdgeCases,
  buildJiraLabels,
  buildJiraCopyBlock,
  exportFilenameJiraTxt,
} from "../js/export/jiraExport.js";
import { FRAMEWORKS } from "../js/config/criteria.js";

const baseline = FRAMEWORKS.find((f) => f.id === "baseline");
const borderline = baseline.samples.find((s) => s.id === "intentionally_off");
const gaps = deriveGaps(baseline.pillars, borderline.answers);

assertTrue(gaps.length > 0, "the borderline sample has at least one gap to generate Jira content from");

const acceptanceCriteria = buildJiraAcceptanceCriteria(gaps);
assertEqual(acceptanceCriteria.length, gaps.length, "one acceptance criterion per gap");
assertTrue(acceptanceCriteria[0].startsWith("GIVEN"), "acceptance criteria use Gherkin-style GIVEN/WHEN/THEN phrasing");
assertTrue(acceptanceCriteria[0].includes(gaps[0].pillar_name), "acceptance criterion names the gap's pillar");
assertTrue(acceptanceCriteria[0].includes(gaps[0].severity_gov), "acceptance criterion names the gap's severity");

const edgeCases = buildJiraEdgeCases(gaps);
assertEqual(edgeCases.length, gaps.length, "one edge case per gap");
assertTrue(edgeCases.every((line) => line.length > 0), "every edge case line is non-empty");

const labels = buildJiraLabels(gaps);
const uniqueTags = new Set(gaps.map((g) => g.category_tag));
assertEqual(labels.length, uniqueTags.size, "one label per unique category_tag, not per gap");
assertTrue(labels.every((l) => l === l.toLowerCase() && !l.includes(" ")), "labels are lowercase and space-free");
assertTrue(labels.every((l) => l.startsWith("nfr-")), "labels are prefixed for board-level grouping");

const state = { feature_name: "Customer Support Chatbot" };
const block = buildJiraCopyBlock(state, gaps);
assertTrue(block.includes("h2. DoR Gap Summary"), "copy block includes the Jira wiki-markup heading");
assertTrue(block.includes("h3. Acceptance Criteria"), "copy block includes the Acceptance Criteria section");
assertTrue(block.includes("h3. Edge Cases"), "copy block includes the Edge Cases section");
assertTrue(block.includes("h3. Labels"), "copy block includes the Labels section");
assertTrue(block.includes(state.feature_name), "copy block includes the feature name");

// A fully-ready assessment (zero gaps) degrades gracefully instead of emitting empty sections.
const bestSample = baseline.samples.find((s) => s.id === "best");
const bestGaps = deriveGaps(baseline.pillars, bestSample.answers);
const bestBlock = buildJiraCopyBlock({ feature_name: bestSample.feature_name }, bestGaps);
assertTrue(bestBlock.includes("No open gaps"), "zero-gap assessment produces a graceful no-gaps message");

assertEqual(
  exportFilenameJiraTxt("Customer Support Chatbot", "abc-123"),
  "customer-support-chatbot_abc-123_jira_content.txt",
  "Jira content filename is slugified feature name + assessment_id"
);
