import { assertEqual } from "./assert.js";
import { deriveEscalationLikelihood } from "../js/engine/escalationLikelihood.js";

function signal(pillar) {
  return { pillar_name: pillar, category_tag: "PII", severity_gov: "High", tier: "High", timestamp: "t" };
}
function gap(pillar) {
  return { gap_id: "GAP-x", pillar_name: pillar, item_id: "x", description: "d", severity_gov: "High", category_tag: "PII", answer: "no", remediation: "r" };
}

const hotSignals = Array(3).fill(signal("Governance & Compliance"));

assertEqual(deriveEscalationLikelihood([], []), null, "no signals at all produces no claim");

assertEqual(
  deriveEscalationLikelihood([gap("Data & Integration")], hotSignals),
  null,
  "gaps that don't touch a hot pillar produce no claim"
);

assertEqual(
  deriveEscalationLikelihood([gap("Governance & Compliance")], hotSignals),
  { tier: "Moderate", matchingGapCount: 1, matchingPillars: ["Governance & Compliance"] },
  "exactly 1 gap in a hot pillar is Moderate"
);

assertEqual(
  deriveEscalationLikelihood([gap("Governance & Compliance"), gap("Governance & Compliance")], hotSignals),
  { tier: "Elevated", matchingGapCount: 2, matchingPillars: ["Governance & Compliance"] },
  "2+ gaps in a hot pillar is Elevated"
);

assertEqual(
  deriveEscalationLikelihood([gap("Governance & Compliance")], [signal("Governance & Compliance"), signal("Governance & Compliance")]),
  null,
  "below the minOccurrences threshold (2 signals, default minimum 3), no pillar is hot, so no claim even with a matching gap"
);
