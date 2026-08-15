// category_tag -> edge-case test prompt, used by jiraExport.js's "Edge Cases" section.
// Same lookup-table pattern as interventionMap.js (dor-recovery-console) — a specific
// prompt per tag where one is well understood, generic fallback otherwise, never blocks
// on an unmapped tag.
export const EDGE_CASE_MAP = {
  PII: "Test with malformed/injected PII to confirm redaction and masking hold under adversarial input.",
  Fallback: "Force the upstream dependency to fail mid-request and confirm graceful degradation, not a cascading failure.",
  RateLimit: "Burst requests past the configured limit and confirm throttling/backoff behaves as designed, not silent drops.",
  Consent: "Test the withdraw-consent path mid-flow and confirm downstream processing actually stops.",
  HITL: "Test the human-review queue under reviewer unavailability/timeout — confirm the fallback doesn't silently auto-approve.",
  Lineage: "Test that a record's full lineage is reconstructable after a partial pipeline failure.",
  NFR: "Test the boundary/threshold condition explicitly, not just the happy path.",
  Safety: "Test the safety interlock/failsafe path directly, not just the nominal operating case.",
  AssetLifecycle: "Test behaviour when asset condition data is missing or stale at the point of decision.",
  SupplyChain: "Test the single-point-of-failure vendor/supplier scenario explicitly.",
  Probity: "Test the conflict-of-interest disclosure path with a deliberately borderline case.",
  Other: "Define and test at least one adversarial or boundary case specific to this gap.",
};

export const DEFAULT_EDGE_CASE = "Define and test at least one adversarial or boundary case specific to this gap.";

export function edgeCaseFor(categoryTag) {
  return EDGE_CASE_MAP[categoryTag] ?? DEFAULT_EDGE_CASE;
}
