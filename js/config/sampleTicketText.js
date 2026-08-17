// feature_name -> example ticket description text for the Ticket-to-Checklist Assist
// demo. Keyed by feature_name (unique across every framework's samples) rather than
// sample id (which repeats — every framework has a "good" sample). Each entry is
// written to plausibly trigger a few of checklistKeywordMap.js's keywords against
// that sample's own checklist items, so picking a sample from the dropdown gives a
// working, non-trivial example rather than an empty textarea.
export const SAMPLE_TICKET_TEXT = {
  "Sample: Fully Ready Feature":
    "This story ships with a documented human-in-the-loop fallback for the high-risk decision path, explicit NFR sign-off from performance and security, PII redaction validated on both inputs and outputs, and a circuit-breaker defined for the upstream dependency.",

  "Sample: Minor Gaps Feature":
    "Acceptance criteria are written and testable. Still finalizing the non-functional sizing/estimation pass with the team before this is fully ready to build.",

  "Sample: Borderline Feature":
    "Adds graceful degradation for the payment gateway timeout case and documents data lineage/traceability for the new integration. GDPR applicability still needs confirming with compliance, and the consent opt-in flow for this feature hasn't been designed yet.",

  "Sample: Not Ready Feature":
    "Early draft: no human-in-the-loop fallback defined yet for the automated decision, PII/data leakage safeguards not validated, rate limiting not configured, consent capture undesigned, and the data lineage from source to sink isn't mapped.",

  "Sample: Regional Water Network Upgrade":
    "The capital delivery programme has agreed SLAs with the operations team, and the asset register / GIS data lineage integration has been validated against the source-of-truth register.",

  "Sample: Regional Grid Modernisation Programme":
    "Cross-agency acceptance criteria are documented, and the vendor/contractor onboarding process for field works with our supplier has been defined.",

  "Sample: Citizen Services Digital Uplift":
    "Acceptance criteria for the citizen-facing service are testable, and the SLA for the citizen complaints/feedback process has been agreed with the service desk.",
};

export function sampleTicketTextFor(featureName) {
  return SAMPLE_TICKET_TEXT[featureName] ?? "";
}
