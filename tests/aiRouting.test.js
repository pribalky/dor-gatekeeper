import { assertEqual, assertTrue } from "./assert.js";
import { routeAiDecision } from "../js/engine/aiRouting.js";

const highLow = routeAiDecision("high", "low");
assertEqual(highLow.quadrant, "No AI / Deterministic", "high determinism + low complexity routes to No AI / Deterministic");
assertEqual(highLow.hitlRequired, false, "No AI / Deterministic quadrant does not require HITL");

const highHigh = routeAiDecision("high", "high");
assertEqual(highHigh.quadrant, "Standard Script", "high determinism + high complexity routes to Standard Script");
assertEqual(highHigh.hitlRequired, false, "Standard Script quadrant does not require HITL");

const lowLow = routeAiDecision("low", "low");
assertEqual(lowLow.quadrant, "AI-Assisted / HITL", "low determinism + low complexity routes to AI-Assisted / HITL");
assertEqual(lowLow.hitlRequired, true, "AI-Assisted / HITL quadrant requires HITL");

const lowHigh = routeAiDecision("low", "high");
assertEqual(lowHigh.quadrant, "Pure AI Flow", "low determinism + high complexity routes to Pure AI Flow");
assertEqual(lowHigh.hitlRequired, true, "Pure AI Flow quadrant requires HITL");

for (const result of [highLow, highHigh, lowLow, lowHigh]) {
  assertTrue(Boolean(result.label), "every quadrant has a label");
  assertTrue(Boolean(result.guidance), "every quadrant has guidance text");
}

let threw = false;
try {
  routeAiDecision("medium", "low");
} catch {
  threw = true;
}
assertTrue(threw, "an unrecognised determinism/complexity combination throws rather than silently defaulting");
