import { slugify } from "./jsonExport.js";

const DETERMINISM_LABEL = { high: "Deterministic", low: "Probabilistic / LLM" };
const COMPLEXITY_LABEL = { high: "High", low: "Low" };
const SENSITIVITY_LABEL = { public: "Public", internal: "Internal", regulated: "Regulated (PII / Core Banking / Health)" };
const INTEGRATION_LABEL = {
  "legacy-batch": "Legacy Monolith / Batch",
  "event-driven-api": "Event-Driven API",
  "external-llm-api": "External Third-Party LLM API",
};
const LATENCY_LABEL = { bounded: "Bounded (e.g. <200ms / capped spend)", unbounded: "Unbounded / best-effort" };

// Standard ADR sections, populated from the AI Governance & Feasibility Router's
// intake, the routed quadrant (routeAiDecision — reused, not re-derived), and every
// triggered hazard flag (evaluateHazards). Independent of the checklist/assessment
// state except for feature_name/assessment_id, reused only for filename consistency.
export function buildAiFeasibilityAdr(inputs, routing, hazards, verdict) {
  const lines = [];

  lines.push(`# ADR: AI Feasibility — ${inputs.featureName || "Untitled"}`);
  lines.push("");
  lines.push(`## Status`);
  lines.push("");
  lines.push(`Proposed — Feasibility verdict: **${verdict}**.`);
  lines.push("");

  lines.push(`## Context`);
  lines.push("");
  lines.push(`- **Model Type:** ${DETERMINISM_LABEL[inputs.determinism]}`);
  lines.push(`- **Process Complexity:** ${COMPLEXITY_LABEL[inputs.complexity]}`);
  lines.push(`- **Data Sensitivity:** ${SENSITIVITY_LABEL[inputs.dataSensitivity]}`);
  lines.push(`- **Integration Target:** ${INTEGRATION_LABEL[inputs.integrationTarget]}`);
  lines.push(`- **Latency & Cost Budget:** ${LATENCY_LABEL[inputs.latencyCostBudget]}`);
  lines.push(`- **Routed Governance Quadrant:** ${routing.label}`);
  lines.push("");
  if (hazards.length > 0) {
    lines.push("The following hazards were flagged against this configuration:");
    lines.push("");
    hazards.forEach((h, i) => {
      lines.push(`${i + 1}. **[${h.severity}] ${h.flag}** — ${h.guidance}`);
    });
  } else {
    lines.push("No hazards were flagged against this configuration.");
  }
  lines.push("");

  lines.push(`## Decision`);
  lines.push("");
  lines.push(routing.guidance);
  if (routing.hitlRequired) {
    lines.push("");
    lines.push("A human-in-the-loop review gate is required before this decision takes effect.");
  }
  lines.push("");

  lines.push(`## Consequences`);
  lines.push("");
  if (verdict === "RECONSIDER APPROACH") {
    lines.push("- At least one High-severity hazard is unresolved. Do not proceed with this design as configured — address the flagged hazard(s) above first, or choose a different architectural approach.");
  } else if (verdict === "PROCEED WITH CONDITIONS") {
    lines.push("- This design may proceed, but only once the Med-severity hazards above (and/or the HITL gate, if flagged) are addressed and tracked.");
  } else {
    lines.push("- No blocking hazards identified for this configuration. Re-evaluate if any of the 5 inputs above change.");
  }
  lines.push("");

  return lines.join("\n");
}

export function exportFilenameAiFeasibilityAdr(featureName, assessmentId) {
  return `${slugify(featureName)}_${assessmentId}_ai_feasibility_adr.md`;
}
