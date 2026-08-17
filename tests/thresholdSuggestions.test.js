import { assertEqual } from "./assert.js";
import { deriveThresholdSuggestions } from "../js/engine/thresholdSuggestions.js";

function signal(pillar) {
  return { pillar_name: pillar, category_tag: "PII", severity_gov: "High", tier: "High", timestamp: "t" };
}

assertEqual(deriveThresholdSuggestions([]), [], "no signals produces no suggestions");

const belowThreshold = [signal("Governance & Compliance"), signal("Governance & Compliance")];
assertEqual(deriveThresholdSuggestions(belowThreshold), [], "2 occurrences (below the default minimum of 3) produces no suggestion");

const atThreshold = [signal("Governance & Compliance"), signal("Governance & Compliance"), signal("Governance & Compliance")];
assertEqual(
  deriveThresholdSuggestions(atThreshold),
  [{ pillar_name: "Governance & Compliance", count: 3 }],
  "exactly 3 occurrences meets the default minimum and produces a suggestion"
);

// Multiple pillars, sorted most-frequent first.
const mixed = [
  ...Array(3).fill(signal("Process & Workflow")),
  ...Array(5).fill(signal("Governance & Compliance")),
  ...Array(2).fill(signal("Data & Integration")), // below threshold, excluded
];
assertEqual(
  deriveThresholdSuggestions(mixed),
  [
    { pillar_name: "Governance & Compliance", count: 5 },
    { pillar_name: "Process & Workflow", count: 3 },
  ],
  "suggestions are sorted most-frequent first, and below-threshold pillars are excluded"
);

// Custom threshold.
assertEqual(
  deriveThresholdSuggestions([signal("A"), signal("A")], 2),
  [{ pillar_name: "A", count: 2 }],
  "a custom minOccurrences is respected"
);
