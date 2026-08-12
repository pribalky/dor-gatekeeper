import { assertEqual, assertClose, assertTrue } from "./assert.js";
import { scoreAssessment, gateDecision } from "../js/engine/scoring.js";
import { PILLARS, SAMPLES } from "../js/config/criteria.js";

const allItemIds = PILLARS.flatMap((p) => p.items.map((i) => i.id));

function answerAll(value) {
  const answers = {};
  for (const id of allItemIds) answers[id] = value;
  return answers;
}

const allYesResult = scoreAssessment(answerAll("yes"));
assertClose(allYesResult.overallScore, 100, 0.01, "all-yes answers score 100 overall");
assertEqual(allYesResult.gateDecision, "APPROVED", "all-yes answers gate to APPROVED");

const allNoResult = scoreAssessment(answerAll("no"));
assertClose(allNoResult.overallScore, 0, 0.01, "all-no answers score 0 overall");
assertEqual(allNoResult.gateDecision, "BLOCKED", "all-no answers gate to BLOCKED");

const allPartialResult = scoreAssessment(answerAll("partial"));
assertClose(allPartialResult.overallScore, 50, 0.01, "all-partial answers score 50 overall");
assertEqual(allPartialResult.gateDecision, "BLOCKED", "50 overall gates to BLOCKED");

// Threshold boundaries — PRD §3.2: 85-100 APPROVED, 65-84 CONDITIONAL, <65 BLOCKED
assertEqual(gateDecision(100), "APPROVED", "score of 100 is APPROVED");
assertEqual(gateDecision(85), "APPROVED", "score of exactly 85 is APPROVED");
assertEqual(gateDecision(84.99), "CONDITIONAL", "score just under 85 is CONDITIONAL");
assertEqual(gateDecision(65), "CONDITIONAL", "score of exactly 65 is CONDITIONAL");
assertEqual(gateDecision(64.99), "BLOCKED", "score just under 65 is BLOCKED");
assertEqual(gateDecision(0), "BLOCKED", "score of 0 is BLOCKED");

const totalWeight = PILLARS.reduce((sum, p) => sum + p.weight, 0);
assertClose(totalWeight, 1.0, 0.0001, "pillar weights sum to 1.0");

// The same 4 sample fixtures powering the "load sample" UI dropdown are asserted
// here against the scoring engine, so the on-screen examples are provably correct.
const expectedGate = {
  best: "APPROVED",
  good: "APPROVED",
  intentionally_off: "CONDITIONAL",
  very_bad: "BLOCKED",
};

for (const sample of SAMPLES) {
  const answered = allItemIds.every((id) => Boolean(sample.answers[id]));
  assertTrue(answered, `sample "${sample.id}" answers all ${allItemIds.length} checklist items`);

  const result = scoreAssessment(sample.answers);
  assertEqual(
    result.gateDecision,
    expectedGate[sample.id],
    `sample "${sample.id}" gates to ${expectedGate[sample.id]} (scored ${result.overallScore})`
  );
}
