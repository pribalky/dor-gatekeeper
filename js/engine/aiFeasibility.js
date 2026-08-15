import { HAZARD_RULES } from "../config/aiHazardRules.js";

// Every key present in a rule's `match` must equal the same key in `inputs`;
// a key the rule doesn't mention is "don't care" and never blocks a match.
function matches(rule, inputs) {
  return Object.entries(rule.match).every(([key, value]) => inputs[key] === value);
}

export function evaluateHazards(inputs) {
  return HAZARD_RULES.filter((rule) => matches(rule, inputs));
}

// Categorical verdict, not an invented 0-100 score — same discipline as
// GATE_THRESHOLDS (engine/scoring.js) and classifyReworkTier (dor-recovery-console):
// any documented High-severity hazard blocks outright; a Med hazard or an HITL
// requirement from the routed quadrant downgrades to conditional; otherwise clear.
export function deriveFeasibilityVerdict(hazards, hitlRequired) {
  if (hazards.some((h) => h.severity === "High")) return "RECONSIDER APPROACH";
  if (hazards.some((h) => h.severity === "Med") || hitlRequired) return "PROCEED WITH CONDITIONS";
  return "PROCEED";
}
