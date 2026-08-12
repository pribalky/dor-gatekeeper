// Pillar/criteria config — the single source of truth for weights, checklist items,
// and sample assessments (used by both the UI "load sample" dropdown and the test suite).

export const GATE_THRESHOLDS = { APPROVED: 85, CONDITIONAL: 65 };

export const ANSWER_POINTS = { yes: 20, partial: 10, no: 0 };

export const PILLARS = [
  {
    id: "architecture",
    name: "Architectural & Data Lineage Feasibility",
    weight: 0.20,
    items: [
      { id: "P1-1", label: "Integration pattern documented & validated", severity_gov: "Med", category_tag: "Lineage", remediation: "Document the integration pattern (sync/async, event-driven, batch) and have it validated by the architecture review board." },
      { id: "P1-2", label: "Data schema maturity confirmed / versioned", severity_gov: "Med", category_tag: "Lineage", remediation: "Confirm the schema is versioned and stable enough for this integration; define a versioning policy if missing." },
      { id: "P1-3", label: "State management & data retention policy defined", severity_gov: "High", category_tag: "Lineage", remediation: "Define where state is held, for how long, and the retention/deletion policy before build starts." },
      { id: "P1-4", label: "End-to-end data lineage / traceability mapped", severity_gov: "Med", category_tag: "Lineage", remediation: "Map the full data lineage from source to sink so downstream consumers can trace provenance." },
      { id: "P1-5", label: "Schema change / rollback strategy defined", severity_gov: "Low", category_tag: "NFR", remediation: "Define how schema changes are rolled out and rolled back without breaking consumers." },
    ],
  },
  {
    id: "responsible-ai",
    name: "Responsible AI & Safety Assurance",
    weight: 0.25,
    items: [
      { id: "P2-1", label: "Output determinism / reproducibility documented", severity_gov: "Med", category_tag: "NFR", remediation: "Document expected output variability and reproducibility guarantees for identical input." },
      { id: "P2-2", label: "Prompt injection & jailbreak testing performed (OWASP LLM01)", severity_gov: "High", category_tag: "Other", category_tag_freetext: "Prompt Injection / Jailbreak Resistance (OWASP LLM01)", remediation: "Run adversarial prompt-injection / jailbreak test cases against the model before sign-off." },
      { id: "P2-3", label: "PII / data leakage safeguards validated (OWASP LLM06)", severity_gov: "High", category_tag: "PII", remediation: "Validate PII redaction/leakage safeguards on both inputs and outputs (OWASP LLM06)." },
      { id: "P2-4", label: "HITL fallback defined for critical/high-risk decisions", severity_gov: "High", category_tag: "HITL", remediation: "Define a human-in-the-loop fallback path for any critical or high-risk automated decision." },
      { id: "P2-5", label: "Model output monitoring & drift detection in place", severity_gov: "Low", category_tag: "NFR", remediation: "Stand up monitoring for output quality/drift over time, with an alert threshold." },
    ],
  },
  {
    id: "governance",
    name: "Data Governance & Regulatory Compliance",
    weight: 0.25,
    items: [
      { id: "P3-1", label: "GDPR / data residency requirements confirmed", severity_gov: "High", category_tag: "PII", remediation: "Confirm data residency and GDPR applicability with the compliance team before build." },
      { id: "P3-2", label: "Audit trail completeness (who/what/when)", severity_gov: "Med", category_tag: "Lineage", remediation: "Ensure every state-changing action is logged with actor, action, and timestamp." },
      { id: "P3-3", label: "Consent management mechanism defined", severity_gov: "High", category_tag: "Consent", remediation: "Define how user consent is captured, stored, and honoured across the data flow." },
      { id: "P3-4", label: "Data retention & deletion policy documented", severity_gov: "Med", category_tag: "PII", remediation: "Document retention periods and the deletion mechanism for personal data." },
      { id: "P3-5", label: "Third-party / subprocessor data flows reviewed", severity_gov: "Med", category_tag: "Consent", remediation: "Review and document any data flows to third-party subprocessors and their legal basis." },
    ],
  },
  {
    id: "operational",
    name: "Operational Readiness & Resilience",
    weight: 0.15,
    items: [
      { id: "P4-1", label: "Fallback / circuit-breaker behaviour defined", severity_gov: "High", category_tag: "Fallback", remediation: "Define circuit-breaker behaviour and a safe fallback for upstream failures." },
      { id: "P4-2", label: "Rate limiting & token budgeting configured", severity_gov: "Med", category_tag: "RateLimit", remediation: "Configure rate limits and token/cost budgets with alerting on breach." },
      { id: "P4-3", label: "SLAs / SLOs defined and agreed", severity_gov: "Med", category_tag: "Fallback", remediation: "Agree SLAs/SLOs with stakeholders and document them alongside the feature." },
      { id: "P4-4", label: "Error handling & graceful degradation tested", severity_gov: "Med", category_tag: "Fallback", remediation: "Test that failures degrade gracefully rather than cascading or crashing." },
      { id: "P4-5", label: "Monitoring / alerting on operational thresholds", severity_gov: "Low", category_tag: "RateLimit", remediation: "Stand up alerting on latency, error rate, and cost thresholds." },
    ],
  },
  {
    id: "dor-completeness",
    name: "Definition of Ready Completeness",
    weight: 0.15,
    items: [
      { id: "P5-1", label: "Acceptance criteria are testable & specific", severity_gov: "Med", category_tag: "NFR", remediation: "Rewrite acceptance criteria so each is objectively testable." },
      { id: "P5-2", label: "Test data available and representative", severity_gov: "Med", category_tag: "NFR", remediation: "Source or synthesize test data that represents real production variety." },
      { id: "P5-3", label: "NFR sign-off obtained (perf/security/etc.)", severity_gov: "High", category_tag: "NFR", remediation: "Obtain explicit NFR sign-off from performance/security stakeholders." },
      { id: "P5-4", label: "Dependencies identified and unblocked", severity_gov: "Low", category_tag: "NFR", remediation: "List all upstream dependencies and confirm none are blocking." },
      { id: "P5-5", label: "Story sized / estimated by team", severity_gov: "Low", category_tag: "NFR", remediation: "Have the delivery team size/estimate the story before commitment." },
    ],
  },
];

// Sample assessments spanning the full gate range, in varying degrees of readiness.
// These are the exact fixtures the "Load sample" dropdown offers AND that the test
// suite asserts against — one definition, two consumers, so the UI examples are
// always provably correct against the scoring engine.
export const SAMPLES = [
  {
    id: "best",
    label: "Best — fully ready",
    feature_name: "Sample: Fully Ready Feature",
    answers: {
      "P1-1": "yes", "P1-2": "yes", "P1-3": "yes", "P1-4": "yes", "P1-5": "yes",
      "P2-1": "yes", "P2-2": "yes", "P2-3": "yes", "P2-4": "yes", "P2-5": "yes",
      "P3-1": "yes", "P3-2": "yes", "P3-3": "yes", "P3-4": "yes", "P3-5": "yes",
      "P4-1": "yes", "P4-2": "yes", "P4-3": "yes", "P4-4": "yes", "P4-5": "yes",
      "P5-1": "yes", "P5-2": "yes", "P5-3": "yes", "P5-4": "yes", "P5-5": "yes",
    },
  },
  {
    id: "good",
    label: "Good — minor gaps only",
    feature_name: "Sample: Minor Gaps Feature",
    answers: {
      "P1-1": "yes", "P1-2": "yes", "P1-3": "yes", "P1-4": "yes", "P1-5": "partial",
      "P2-1": "yes", "P2-2": "yes", "P2-3": "yes", "P2-4": "yes", "P2-5": "yes",
      "P3-1": "yes", "P3-2": "yes", "P3-3": "yes", "P3-4": "yes", "P3-5": "yes",
      "P4-1": "yes", "P4-2": "yes", "P4-3": "yes", "P4-4": "yes", "P4-5": "yes",
      "P5-1": "yes", "P5-2": "yes", "P5-3": "yes", "P5-4": "yes", "P5-5": "partial",
    },
  },
  {
    id: "intentionally_off",
    label: "Intentionally Off — borderline / conditional",
    feature_name: "Sample: Borderline Feature",
    answers: {
      "P1-1": "yes", "P1-2": "yes", "P1-3": "partial", "P1-4": "yes", "P1-5": "no",
      "P2-1": "yes", "P2-2": "no", "P2-3": "partial", "P2-4": "yes", "P2-5": "yes",
      "P3-1": "partial", "P3-2": "yes", "P3-3": "no", "P3-4": "yes", "P3-5": "yes",
      "P4-1": "yes", "P4-2": "yes", "P4-3": "yes", "P4-4": "partial", "P4-5": "yes",
      "P5-1": "yes", "P5-2": "partial", "P5-3": "yes", "P5-4": "yes", "P5-5": "yes",
    },
  },
  {
    id: "very_bad",
    label: "Very Bad — not ready",
    feature_name: "Sample: Not Ready Feature",
    answers: {
      "P1-1": "no", "P1-2": "no", "P1-3": "partial", "P1-4": "no", "P1-5": "no",
      "P2-1": "no", "P2-2": "no", "P2-3": "no", "P2-4": "partial", "P2-5": "no",
      "P3-1": "no", "P3-2": "partial", "P3-3": "no", "P3-4": "no", "P3-5": "no",
      "P4-1": "no", "P4-2": "no", "P4-3": "partial", "P4-4": "no", "P4-5": "no",
      "P5-1": "partial", "P5-2": "no", "P5-3": "no", "P5-4": "no", "P5-5": "no",
    },
  },
];
