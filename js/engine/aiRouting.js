// AI Governance 2x2 router — PRD §5's 4 quadrants, keyed off Determinism (High/Low)
// and Process Complexity (High/Low). Pure, self-contained: no interaction with the
// checklist/scoring engine, since a routing decision here doesn't depend on any one
// assessment's answers.
const QUADRANTS = {
  "high-low": {
    quadrant: "No AI / Deterministic",
    label: "No AI / Deterministic",
    guidance: "Implement as a deterministic rule/script. AI adds risk and cost without benefit here — the logic is fully specified and the process is simple.",
    hitlRequired: false,
  },
  "high-high": {
    quadrant: "Standard Script",
    label: "Standard Script",
    guidance: "Implement as a deterministic workflow/orchestration (multiple deterministic steps). AI is not required for the decision logic itself, though it may assist with unstructured inputs feeding into it.",
    hitlRequired: false,
  },
  "low-low": {
    quadrant: "AI-Assisted / HITL",
    label: "AI-Assisted / HITL",
    guidance: "Use AI to propose, a human to decide. Low determinism means the AI's output isn't reliably verifiable by rule, so a human-in-the-loop review gate is required before the decision takes effect.",
    hitlRequired: true,
  },
  "low-high": {
    quadrant: "Pure AI Flow",
    label: "Pure AI Flow",
    guidance: "AI-driven end-to-end flow is viable, but low determinism plus high process complexity is the highest-risk quadrant — require staged rollout, strong monitoring/drift detection, and a documented rollback path in addition to HITL review.",
    hitlRequired: true,
  },
};

export function routeAiDecision(determinism, complexity) {
  const key = `${determinism}-${complexity}`;
  const result = QUADRANTS[key];
  if (!result) {
    throw new Error(`routeAiDecision: unrecognised determinism/complexity combination "${key}"`);
  }
  return result;
}
