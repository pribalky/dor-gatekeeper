import { assertEqual, assertClose, assertTrue } from "./assert.js";
import { scoreAssessment, gateDecision } from "../js/engine/scoring.js";
import { FRAMEWORKS } from "../js/config/criteria.js";

// Threshold boundaries — PRD §3.2: 85-100 APPROVED, 65-84 CONDITIONAL, <65 BLOCKED
assertEqual(gateDecision(100), "APPROVED", "score of 100 is APPROVED");
assertEqual(gateDecision(85), "APPROVED", "score of exactly 85 is APPROVED");
assertEqual(gateDecision(84.99), "CONDITIONAL", "score just under 85 is CONDITIONAL");
assertEqual(gateDecision(65), "CONDITIONAL", "score of exactly 65 is CONDITIONAL");
assertEqual(gateDecision(64.99), "BLOCKED", "score just under 65 is BLOCKED");
assertEqual(gateDecision(0), "BLOCKED", "score of 0 is BLOCKED");

// Every framework shares the same 5-pillar shape and weight discipline, even though
// content (items, weights, category_tag usage) differs per sector.
const expectedGateByFramework = {
  baseline: { best: "APPROVED", good: "APPROVED", intentionally_off: "CONDITIONAL", very_bad: "BLOCKED" },
  water: { good: "APPROVED" },
  energy: { good: "APPROVED" },
};

for (const framework of FRAMEWORKS) {
  const allItemIds = framework.pillars.flatMap((p) => p.items.map((i) => i.id));

  const answerAll = (value) => {
    const answers = {};
    for (const id of allItemIds) answers[id] = value;
    return answers;
  };

  const allYesResult = scoreAssessment(framework.pillars, answerAll("yes"));
  assertClose(allYesResult.overallScore, 100, 0.01, `[${framework.id}] all-yes answers score 100 overall`);
  assertEqual(allYesResult.gateDecision, "APPROVED", `[${framework.id}] all-yes answers gate to APPROVED`);

  const allNoResult = scoreAssessment(framework.pillars, answerAll("no"));
  assertClose(allNoResult.overallScore, 0, 0.01, `[${framework.id}] all-no answers score 0 overall`);
  assertEqual(allNoResult.gateDecision, "BLOCKED", `[${framework.id}] all-no answers gate to BLOCKED`);

  const totalWeight = framework.pillars.reduce((sum, p) => sum + p.weight, 0);
  assertClose(totalWeight, 1.0, 0.0001, `[${framework.id}] pillar weights sum to 1.0`);

  assertEqual(framework.pillars.length, 5, `[${framework.id}] has exactly 5 pillars`);
  for (const pillar of framework.pillars) {
    assertEqual(pillar.items.length, 5, `[${framework.id}] pillar "${pillar.name}" has exactly 5 items`);
  }

  const expectedGate = expectedGateByFramework[framework.id];
  for (const sample of framework.samples) {
    const answered = allItemIds.every((id) => Boolean(sample.answers[id]));
    assertTrue(answered, `[${framework.id}] sample "${sample.id}" answers all ${allItemIds.length} checklist items`);

    const result = scoreAssessment(framework.pillars, sample.answers);
    assertEqual(
      result.gateDecision,
      expectedGate[sample.id],
      `[${framework.id}] sample "${sample.id}" gates to ${expectedGate[sample.id]} (scored ${result.overallScore})`
    );
  }
}
