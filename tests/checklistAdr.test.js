import { assertEqual, assertTrue } from "./assert.js";
import { scoreAssessment } from "../js/engine/scoring.js";
import { deriveGaps } from "../js/engine/gaps.js";
import { buildChecklistAdr, exportFilenameChecklistAdr } from "../js/export/checklistAdr.js";
import { FRAMEWORKS } from "../js/config/criteria.js";

function makeState(sample) {
  return {
    assessment_id: "test-uuid-0000",
    assessment_date: "2026-01-01T00:00:00.000Z",
    feature_name: sample.feature_name,
    answers: sample.answers,
  };
}

const baseline = FRAMEWORKS.find((f) => f.id === "baseline");
const borderline = baseline.samples.find((s) => s.id === "intentionally_off");
const state = makeState(borderline);
const scoreResult = scoreAssessment(baseline.pillars, state.answers);
const gaps = deriveGaps(baseline.pillars, state.answers);
const adr = buildChecklistAdr(baseline, state, scoreResult, gaps);

assertTrue(adr.includes(`# ADR: ${state.feature_name}`), "ADR title includes the feature name");
assertTrue(adr.includes("## Status"), "ADR includes the Status section");
assertTrue(adr.includes("## Context"), "ADR includes the Context section");
assertTrue(adr.includes("## Decision"), "ADR includes the Decision section");
assertTrue(adr.includes("## Consequences"), "ADR includes the Consequences section");
assertTrue(adr.includes(scoreResult.gateDecision), "ADR Status section includes the gate decision");
assertTrue(adr.includes(baseline.label), "ADR Status section includes the framework label");
assertTrue(gaps.length > 0, "sanity: the borderline sample has open gaps");
assertTrue(adr.includes(gaps[0].description), "ADR Context section includes the first open gap's description");
assertTrue(adr.includes(gaps[0].remediation), "ADR Decision section includes the first gap's remediation");

// A fully-ready assessment still produces all 4 sections, degrading gracefully.
const bestSample = baseline.samples.find((s) => s.id === "best");
const bestState = makeState(bestSample);
const bestScore = scoreAssessment(baseline.pillars, bestState.answers);
const bestGaps = deriveGaps(baseline.pillars, bestState.answers);
const bestAdr = buildChecklistAdr(baseline, bestState, bestScore, bestGaps);
assertTrue(bestAdr.includes("No gaps were identified"), "a fully-ready assessment's ADR Context says so explicitly");
assertTrue(bestAdr.includes("Proceed — all Definition of Ready criteria are satisfied."), "a fully-ready assessment's ADR Decision says to proceed");
assertTrue(bestAdr.includes("The gate is APPROVED"), "a fully-ready assessment's ADR Consequences reflects the APPROVED gate");

assertEqual(
  exportFilenameChecklistAdr("Customer Support Chatbot", "abc-123"),
  "customer-support-chatbot_abc-123_dor_adr.md",
  "checklist ADR filename is slugified feature name + assessment_id"
);
