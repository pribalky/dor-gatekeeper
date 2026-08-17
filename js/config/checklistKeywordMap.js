// category_tag -> representative keywords a pasted ticket's text might use if it
// already addresses that concern. Same lookup-table pattern as edgeCaseMap.js.
// Deliberately conservative: only presence is checked, never absence — a keyword
// missing from the text is not treated as evidence the concern is unaddressed.
export const CHECKLIST_KEYWORD_MAP = {
  PII: ["pii", "personal data", "personally identifiable", "gdpr", "redact", "mask"],
  Fallback: ["fallback", "circuit breaker", "graceful degradation", "retry", "failover"],
  RateLimit: ["rate limit", "throttl", "backoff", "quota"],
  Consent: ["consent", "opt-in", "opt-out", "withdraw consent"],
  HITL: ["human-in-the-loop", "human in the loop", "hitl", "manual review", "reviewer approval"],
  Lineage: ["lineage", "traceability", "provenance", "audit trail"],
  NFR: ["nfr", "non-functional", "sla", "slo", "acceptance criteria"],
  Safety: ["safety interlock", "failsafe", "safety case", "interlock"],
  AssetLifecycle: ["asset condition", "asset lifecycle", "maintenance schedule"],
  SupplyChain: ["supplier", "vendor", "single point of failure", "supply chain"],
  Probity: ["conflict of interest", "probity", "disclosure"],
  Other: [],
};

export function keywordsFor(categoryTag) {
  return CHECKLIST_KEYWORD_MAP[categoryTag] ?? [];
}
