// Maps each aiHazardRules.js rule id to the OWASP Top 10 for LLM Applications (2023
// edition) category and NIST AI RMF 1.0 (January 2023) function(s) it corresponds to.
// Checked once, by hand, against the published text of both standards before shipping
// — not a live or certified compliance feed, and not re-verified automatically if
// either standard is revised. A coverage reference, same posture as every other
// illustrative/declarative feature in this app: state plainly what's mapped and what
// isn't, never imply completeness.
//
// OWASP Top 10 for LLM Applications, 2023 edition (the same edition criteria.js's
// GOV-5 item already cites — LLM01/LLM06 — so this stays consistent with what's
// already shipped, not the 2025 revision's renumbering):
//   LLM01 Prompt Injection            LLM06 Sensitive Information Disclosure
//   LLM02 Insecure Output Handling    LLM07 Insecure Plugin Design
//   LLM03 Training Data Poisoning     LLM08 Excessive Agency
//   LLM04 Model Denial of Service     LLM09 Overreliance
//   LLM05 Supply Chain Vulnerabilities LLM10 Model Theft
//
// NIST AI RMF 1.0 core functions: Govern, Map, Measure, Manage.
export const HAZARD_RULE_FRAMEWORK_MAP = {
  "regulated-data-external-llm": { owasp: ["LLM06"], nist: ["Map", "Manage"] },
  "regulated-data-probabilistic-model": { owasp: ["LLM09"], nist: ["Measure", "Manage"] },
  "bounded-latency-external-llm": { owasp: ["LLM04"], nist: ["Manage"] },
  "unbounded-cost-budget": { owasp: ["LLM04"], nist: ["Manage"] },
  "agentic-mutating-mcp-tool-access": { owasp: ["LLM08"], nist: ["Govern", "Manage"] },
  "agentic-readonly-mcp-tool-access-low-determinism": { owasp: ["LLM02"], nist: ["Measure"] },
  "agentic-recursive-chaining-mutating": { owasp: ["LLM08"], nist: ["Govern", "Manage"] },
  "agentic-multi-agent-mutating": { owasp: ["LLM08"], nist: ["Govern", "Manage"] },
  "frontier-reasoning-bounded-latency": { owasp: ["LLM04"], nist: ["Manage"] },
};

export const OWASP_LLM_CATEGORIES = [
  { id: "LLM01", name: "Prompt Injection" },
  { id: "LLM02", name: "Insecure Output Handling" },
  { id: "LLM03", name: "Training Data Poisoning" },
  { id: "LLM04", name: "Model Denial of Service" },
  { id: "LLM05", name: "Supply Chain Vulnerabilities" },
  { id: "LLM06", name: "Sensitive Information Disclosure" },
  { id: "LLM07", name: "Insecure Plugin Design" },
  { id: "LLM08", name: "Excessive Agency" },
  { id: "LLM09", name: "Overreliance" },
  { id: "LLM10", name: "Model Theft" },
];

export const NIST_RMF_FUNCTIONS = ["Govern", "Map", "Measure", "Manage"];

// A hazard rule with no entry above is simply not mapped — returning null rather than
// guessing keeps the gap visible instead of silently misrepresenting coverage.
export function frameworkForHazard(hazardId) {
  return HAZARD_RULE_FRAMEWORK_MAP[hazardId] || null;
}

// Which OWASP LLM categories are touched by at least one hazard rule in this app today.
export function owaspCoverage() {
  const covered = new Set(Object.values(HAZARD_RULE_FRAMEWORK_MAP).flatMap((m) => m.owasp));
  return OWASP_LLM_CATEGORIES.map((cat) => ({ ...cat, covered: covered.has(cat.id) }));
}
