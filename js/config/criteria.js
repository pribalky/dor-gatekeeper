// Framework config — the single source of truth for pillars, weights, checklist
// items, and sample assessments. A "framework" is a selectable preset (sector/
// domain) sharing the same 5-pillar taxonomy, scoring engine, and export contract;
// only the *content* (pillar weights, items, category_tag usage) differs per preset.

export const GATE_THRESHOLDS = { APPROVED: 85, CONDITIONAL: 65 };

export const ANSWER_POINTS = { yes: 20, partial: 10, no: 0 };

// --- Baseline: Financial Services / Enterprise Tech Governance -------------------
// Same 25 checklist items as the original software/AI DoR Gatekeeper, remapped onto
// the 5 unified transformation pillars (2 narrowly AI-specific items dropped, 2 new
// People & Capability items added to keep every pillar at 5 items) — see DECISIONS.md.
const BASELINE_PILLARS = [
  {
    id: "people-capability",
    name: "People & Capability",
    weight: 0.15,
    items: [
      { id: "PPL-1", label: "HITL fallback defined for critical/high-risk decisions", severity_gov: "High", category_tag: "HITL", remediation: "Define a human-in-the-loop fallback path for any critical or high-risk automated decision." },
      { id: "PPL-2", label: "Story sized / estimated by team", severity_gov: "Low", category_tag: "NFR", remediation: "Have the delivery team size/estimate the story before commitment." },
      { id: "PPL-3", label: "NFR sign-off obtained (perf/security/etc.)", severity_gov: "High", category_tag: "NFR", remediation: "Obtain explicit NFR sign-off from performance/security stakeholders." },
      { id: "PPL-4", label: "Team training / role readiness confirmed for new capability", severity_gov: "Low", category_tag: "NFR", remediation: "Confirm the delivery team has the training/role readiness needed before build starts." },
      { id: "PPL-5", label: "RACI / ownership model defined for the initiative", severity_gov: "Med", category_tag: "NFR", remediation: "Define a RACI so accountability for delivery and outcomes is explicit, not assumed." },
    ],
  },
  {
    id: "process-workflow",
    name: "Process & Workflow",
    weight: 0.20,
    items: [
      { id: "PROC-1", label: "Acceptance criteria are testable & specific", severity_gov: "Med", category_tag: "NFR", remediation: "Rewrite acceptance criteria so each is objectively testable." },
      { id: "PROC-2", label: "Test data available and representative", severity_gov: "Med", category_tag: "NFR", remediation: "Source or synthesize test data that represents real production variety." },
      { id: "PROC-3", label: "SLAs / SLOs defined and agreed", severity_gov: "Med", category_tag: "Fallback", remediation: "Agree SLAs/SLOs with stakeholders and document them alongside the feature." },
      { id: "PROC-4", label: "Error handling & graceful degradation tested", severity_gov: "Med", category_tag: "Fallback", remediation: "Test that failures degrade gracefully rather than cascading or crashing." },
      { id: "PROC-5", label: "Dependencies identified and unblocked", severity_gov: "Low", category_tag: "NFR", remediation: "List all upstream dependencies and confirm none are blocking." },
    ],
  },
  {
    id: "data-integration",
    name: "Data & Integration",
    weight: 0.20,
    items: [
      { id: "DATA-1", label: "Integration pattern documented & validated", severity_gov: "Med", category_tag: "Lineage", remediation: "Document the integration pattern (sync/async, event-driven, batch) and have it validated by the architecture review board." },
      { id: "DATA-2", label: "Data schema maturity confirmed / versioned", severity_gov: "Med", category_tag: "Lineage", remediation: "Confirm the schema is versioned and stable enough for this integration; define a versioning policy if missing." },
      { id: "DATA-3", label: "End-to-end data lineage / traceability mapped", severity_gov: "Med", category_tag: "Lineage", remediation: "Map the full data lineage from source to sink so downstream consumers can trace provenance." },
      { id: "DATA-4", label: "PII / data leakage safeguards validated", severity_gov: "High", category_tag: "PII", remediation: "Validate PII redaction/leakage safeguards on both inputs and outputs." },
      { id: "DATA-5", label: "Audit trail completeness (who/what/when)", severity_gov: "Med", category_tag: "Lineage", remediation: "Ensure every state-changing action is logged with actor, action, and timestamp." },
    ],
  },
  {
    id: "technology-infrastructure",
    name: "Technology & Infrastructure",
    weight: 0.20,
    items: [
      { id: "TECH-1", label: "State management & data retention policy defined", severity_gov: "High", category_tag: "Lineage", remediation: "Define where state is held, for how long, and the retention/deletion policy before build starts." },
      { id: "TECH-2", label: "Schema change / rollback strategy defined", severity_gov: "Low", category_tag: "NFR", remediation: "Define how schema changes are rolled out and rolled back without breaking consumers." },
      { id: "TECH-3", label: "Fallback / circuit-breaker behaviour defined", severity_gov: "High", category_tag: "Fallback", remediation: "Define circuit-breaker behaviour and a safe fallback for upstream failures." },
      { id: "TECH-4", label: "Rate limiting & token budgeting configured", severity_gov: "Med", category_tag: "RateLimit", remediation: "Configure rate limits and token/cost budgets with alerting on breach." },
      { id: "TECH-5", label: "Monitoring / alerting on operational thresholds", severity_gov: "Low", category_tag: "RateLimit", remediation: "Stand up alerting on latency, error rate, and cost thresholds." },
    ],
  },
  {
    id: "governance-compliance",
    name: "Governance & Compliance",
    weight: 0.25,
    items: [
      { id: "GOV-1", label: "GDPR / data residency requirements confirmed", severity_gov: "High", category_tag: "PII", remediation: "Confirm data residency and GDPR applicability with the compliance team before build. For Tier 1 banking, also confirm alignment with BCBS 239 risk-data aggregation and reporting principles." },
      { id: "GOV-2", label: "Consent management mechanism defined", severity_gov: "High", category_tag: "Consent", remediation: "Define how user consent is captured, stored, and honoured across the data flow." },
      { id: "GOV-3", label: "Data retention & deletion policy documented", severity_gov: "Med", category_tag: "PII", remediation: "Document retention periods and the deletion mechanism for personal data." },
      { id: "GOV-4", label: "Third-party / subprocessor data flows reviewed", severity_gov: "Med", category_tag: "Consent", remediation: "Review and document any data flows to third-party subprocessors and their legal basis." },
      { id: "GOV-5", label: "Prompt injection & jailbreak testing performed (OWASP LLM01)", severity_gov: "High", category_tag: "Other", category_tag_freetext: "Prompt Injection / Jailbreak Resistance (OWASP LLM01)", remediation: "Run adversarial prompt-injection / jailbreak test cases against the model before sign-off, and confirm output handling meets OWASP LLM06 (sensitive information disclosure) risk bounds." },
    ],
  },
];

// --- Regulated Infrastructure / Water Asset Transformation -----------------------
const WATER_PILLARS = [
  {
    id: "people-capability",
    name: "People & Capability",
    weight: 0.15,
    items: [
      { id: "PPL-1", label: "Asset management competency / certified roles in place", severity_gov: "Med", category_tag: "NFR", remediation: "Confirm certified asset-management roles are staffed before programme mobilisation." },
      { id: "PPL-2", label: "Field workforce safety training current", severity_gov: "High", category_tag: "Safety", remediation: "Refresh and evidence field workforce safety training/certifications before site works begin." },
      { id: "PPL-3", label: "Capital delivery team capacity confirmed for programme", severity_gov: "Med", category_tag: "NFR", remediation: "Confirm delivery team capacity is sized to the capital programme's schedule." },
      { id: "PPL-4", label: "Community/stakeholder engagement plan resourced", severity_gov: "High", category_tag: "Consent", remediation: "Resource and schedule the statutory community/stakeholder engagement plan." },
      { id: "PPL-5", label: "Succession / knowledge-transfer plan for critical asset SMEs", severity_gov: "Low", category_tag: "NFR", remediation: "Document a knowledge-transfer plan for critical asset subject-matter experts." },
    ],
  },
  {
    id: "process-workflow",
    name: "Process & Workflow",
    weight: 0.15,
    items: [
      { id: "PROC-1", label: "Asset condition assessment methodology defined", severity_gov: "Med", category_tag: "AssetLifecycle", remediation: "Define and document the asset condition assessment methodology before survey work starts." },
      { id: "PROC-2", label: "Capital delivery governance gate process defined", severity_gov: "Med", category_tag: "NFR", remediation: "Define stage-gate governance checkpoints for the capital delivery programme." },
      { id: "PROC-3", label: "Change control process for regulated works defined", severity_gov: "High", category_tag: "NFR", remediation: "Define a change control process that satisfies regulator expectations for works variation." },
      { id: "PROC-4", label: "Incident/outage response runbook tested", severity_gov: "High", category_tag: "Safety", remediation: "Test the incident/outage response runbook with the operations team before go-live." },
      { id: "PROC-5", label: "Maintenance scheduling & work order process integrated", severity_gov: "Med", category_tag: "AssetLifecycle", remediation: "Integrate the new capability with existing maintenance scheduling / work order processes." },
    ],
  },
  {
    id: "data-integration",
    name: "Data & Integration",
    weight: 0.15,
    items: [
      { id: "DATA-1", label: "Asset register / GIS data integration validated", severity_gov: "Med", category_tag: "Lineage", remediation: "Validate the asset register / GIS integration against the source-of-truth data." },
      { id: "DATA-2", label: "SCADA/OT-to-IT data integration pattern documented", severity_gov: "High", category_tag: "Lineage", remediation: "Document the OT-to-IT integration pattern and have it validated by architecture and OT security." },
      { id: "DATA-3", label: "Regulatory reporting data pipeline automated & auditable", severity_gov: "Med", category_tag: "Lineage", remediation: "Automate the regulatory reporting pipeline and ensure it is fully auditable." },
      { id: "DATA-4", label: "Real-time sensor/telemetry data quality validated", severity_gov: "Med", category_tag: "AssetLifecycle", remediation: "Validate sensor/telemetry data quality (completeness, calibration) before it drives decisions." },
      { id: "DATA-5", label: "Data residency / sovereign hosting requirements confirmed", severity_gov: "High", category_tag: "PII", remediation: "Confirm data residency and sovereign hosting requirements with the regulator/compliance team." },
    ],
  },
  {
    id: "technology-infrastructure",
    name: "Technology & Infrastructure",
    weight: 0.25,
    items: [
      { id: "TECH-1", label: "OT/ICS cybersecurity controls validated", severity_gov: "High", category_tag: "Safety", remediation: "Validate OT/ICS cybersecurity controls against the relevant critical-infrastructure standard." },
      { id: "TECH-2", label: "SCADA system resilience / failover tested", severity_gov: "High", category_tag: "Fallback", remediation: "Test SCADA failover and resilience under simulated failure conditions." },
      { id: "TECH-3", label: "Legacy system interoperability risk assessed", severity_gov: "Med", category_tag: "Lineage", remediation: "Assess and document interoperability risk with legacy asset/SCADA systems." },
      { id: "TECH-4", label: "Capacity planning for asset monitoring systems complete", severity_gov: "Med", category_tag: "RateLimit", remediation: "Complete capacity planning for asset monitoring systems against expected sensor volume growth." },
      { id: "TECH-5", label: "Disaster recovery plan for critical infrastructure systems tested", severity_gov: "High", category_tag: "Fallback", remediation: "Test the disaster recovery plan for critical infrastructure control systems." },
    ],
  },
  {
    id: "governance-compliance",
    name: "Governance & Compliance",
    weight: 0.30,
    items: [
      { id: "GOV-1", label: "Economic/environmental regulator compliance requirements confirmed", severity_gov: "High", category_tag: "Other", category_tag_freetext: "Regulatory Compliance (Economic/Environmental Regulator)", remediation: "Confirm economic and environmental regulator compliance requirements with the regulatory affairs team." },
      { id: "GOV-2", label: "Statutory consultation / community consent obtained", severity_gov: "High", category_tag: "Consent", remediation: "Complete statutory consultation and evidence community consent before works proceed." },
      { id: "GOV-3", label: "Asset safety case / failure-mode assessment complete", severity_gov: "High", category_tag: "Safety", remediation: "Complete the asset safety case / failure-mode assessment and have it independently reviewed." },
      { id: "GOV-4", label: "Environmental impact & discharge compliance documented", severity_gov: "Med", category_tag: "Other", category_tag_freetext: "Environmental Compliance", remediation: "Document environmental impact assessment and discharge compliance evidence." },
      { id: "GOV-5", label: "Data retention & audit trail for regulatory reporting confirmed", severity_gov: "Med", category_tag: "Lineage", remediation: "Confirm data retention and audit-trail completeness for regulatory reporting obligations." },
    ],
  },
];

// --- Energy Grid Operating Model --------------------------------------------------
const ENERGY_PILLARS = [
  {
    id: "people-capability",
    name: "People & Capability",
    weight: 0.20,
    items: [
      { id: "PPL-1", label: "Grid operations workforce capability mapped against future skills needs", severity_gov: "High", category_tag: "NFR", remediation: "Map current grid operations capability against the skills the future operating model requires." },
      { id: "PPL-2", label: "Cross-agency liaison roles & escalation contacts defined", severity_gov: "Med", category_tag: "NFR", remediation: "Define named liaison roles and escalation contacts across every partner agency." },
      { id: "PPL-3", label: "Control room operator certification current", severity_gov: "High", category_tag: "Safety", remediation: "Confirm control room operator certifications are current before cutover." },
      { id: "PPL-4", label: "Change management plan for new operating model resourced", severity_gov: "Med", category_tag: "NFR", remediation: "Resource a change management plan covering communications, training, and adoption support." },
      { id: "PPL-5", label: "Knowledge transfer plan for retiring SME workforce", severity_gov: "Low", category_tag: "NFR", remediation: "Document a knowledge-transfer plan ahead of critical SME retirements." },
    ],
  },
  {
    id: "process-workflow",
    name: "Process & Workflow",
    weight: 0.20,
    items: [
      { id: "PROC-1", label: "Cross-agency governance / decision rights (RACI) defined", severity_gov: "High", category_tag: "NFR", remediation: "Define a cross-agency RACI so decision rights are unambiguous during joint operations." },
      { id: "PROC-2", label: "Outage & emergency response coordination process tested", severity_gov: "High", category_tag: "Safety", remediation: "Test the outage/emergency response coordination process with all partner agencies." },
      { id: "PROC-3", label: "Grid balancing / dispatch workflow documented", severity_gov: "Med", category_tag: "AssetLifecycle", remediation: "Document the grid balancing / dispatch workflow and validate it against operational reality." },
      { id: "PROC-4", label: "Change control process for grid-connected assets defined", severity_gov: "Med", category_tag: "NFR", remediation: "Define a change control process for any new grid-connected asset or system." },
      { id: "PROC-5", label: "Vendor/contractor onboarding process for field works defined", severity_gov: "Low", category_tag: "SupplyChain", remediation: "Define a standard vendor/contractor onboarding process for field works." },
    ],
  },
  {
    id: "data-integration",
    name: "Data & Integration",
    weight: 0.15,
    items: [
      { id: "DATA-1", label: "SCADA/EMS-to-enterprise data integration pattern documented", severity_gov: "High", category_tag: "Lineage", remediation: "Document the SCADA/EMS-to-enterprise integration pattern and validate with OT security." },
      { id: "DATA-2", label: "Smart meter / AMI data pipeline validated", severity_gov: "Med", category_tag: "Lineage", remediation: "Validate the smart meter / AMI data pipeline end to end for completeness and latency." },
      { id: "DATA-3", label: "Cross-agency data sharing agreement & interoperability confirmed", severity_gov: "High", category_tag: "Consent", remediation: "Confirm the cross-agency data sharing agreement and technical interoperability are both in place." },
      { id: "DATA-4", label: "Real-time grid telemetry data quality validated", severity_gov: "Med", category_tag: "AssetLifecycle", remediation: "Validate real-time grid telemetry data quality before it drives dispatch decisions." },
      { id: "DATA-5", label: "Master data management for grid asset register confirmed", severity_gov: "Med", category_tag: "Lineage", remediation: "Confirm master data management ownership and quality controls for the grid asset register." },
    ],
  },
  {
    id: "technology-infrastructure",
    name: "Technology & Infrastructure",
    weight: 0.20,
    items: [
      { id: "TECH-1", label: "OT/ICS cybersecurity controls for grid systems validated", severity_gov: "High", category_tag: "Safety", remediation: "Validate OT/ICS cybersecurity controls for grid control systems against the relevant standard." },
      { id: "TECH-2", label: "Grid control system failover / redundancy tested", severity_gov: "High", category_tag: "Fallback", remediation: "Test grid control system failover and redundancy under simulated failure conditions." },
      { id: "TECH-3", label: "Capacity planning for renewable integration completed", severity_gov: "Med", category_tag: "RateLimit", remediation: "Complete capacity planning for renewable generation integration against forecast growth." },
      { id: "TECH-4", label: "Legacy SCADA interoperability risk assessed", severity_gov: "Med", category_tag: "Lineage", remediation: "Assess and document interoperability risk with legacy SCADA/EMS systems." },
      { id: "TECH-5", label: "Disaster recovery plan for grid control systems tested", severity_gov: "High", category_tag: "Fallback", remediation: "Test the disaster recovery plan for grid control systems end to end." },
    ],
  },
  {
    id: "governance-compliance",
    name: "Governance & Compliance",
    weight: 0.25,
    items: [
      { id: "GOV-1", label: "Energy regulator compliance requirements confirmed", severity_gov: "High", category_tag: "Other", category_tag_freetext: "Regulatory Compliance (Energy Regulator)", remediation: "Confirm energy regulator compliance requirements with the regulatory affairs team." },
      { id: "GOV-2", label: "Cross-agency governance charter / MOU in place", severity_gov: "High", category_tag: "Other", category_tag_freetext: "Cross-Agency Governance Charter", remediation: "Put a cross-agency governance charter / MOU in place before joint operations begin." },
      { id: "GOV-3", label: "Grid resilience / critical infrastructure safety case complete", severity_gov: "High", category_tag: "Safety", remediation: "Complete the grid resilience / critical infrastructure safety case and have it independently reviewed." },
      { id: "GOV-4", label: "Supply chain security & vendor risk assessment for grid equipment complete", severity_gov: "Med", category_tag: "SupplyChain", remediation: "Complete a supply chain security and vendor risk assessment for critical grid equipment." },
      { id: "GOV-5", label: "Data retention & audit trail for regulatory reporting confirmed", severity_gov: "Med", category_tag: "Lineage", remediation: "Confirm data retention and audit-trail completeness for regulatory reporting obligations." },
    ],
  },
];

// --- Public Sector ------------------------------------------------------------------
const PUBLIC_SECTOR_PILLARS = [
  {
    id: "people-capability",
    name: "People & Capability",
    weight: 0.20,
    items: [
      { id: "PPL-1", label: "Public service workforce capability mapped against programme needs", severity_gov: "Med", category_tag: "NFR", remediation: "Map current public service workforce capability against what the programme requires." },
      { id: "PPL-2", label: "Machinery-of-government change impact on roles assessed", severity_gov: "Med", category_tag: "NFR", remediation: "Assess and document the impact of any machinery-of-government change on affected roles." },
      { id: "PPL-3", label: "Accountable officer sign-off obtained", severity_gov: "High", category_tag: "NFR", remediation: "Obtain explicit sign-off from the accountable officer before proceeding." },
      { id: "PPL-4", label: "Change management & citizen-facing staff training resourced", severity_gov: "Med", category_tag: "NFR", remediation: "Resource a change management plan covering citizen-facing staff training." },
      { id: "PPL-5", label: "Knowledge transfer plan for outgoing contractors/consultants", severity_gov: "Low", category_tag: "NFR", remediation: "Document a knowledge-transfer plan ahead of any contractor/consultant off-boarding." },
    ],
  },
  {
    id: "process-workflow",
    name: "Process & Workflow",
    weight: 0.20,
    items: [
      { id: "PROC-1", label: "Procurement process complies with public sector procurement rules", severity_gov: "High", category_tag: "Probity", remediation: "Have procurement counsel confirm the process complies with public sector procurement rules before proceeding." },
      { id: "PROC-2", label: "Business case / budget approval (gateway review) process defined", severity_gov: "High", category_tag: "NFR", remediation: "Define the business case and gateway review process required for budget approval." },
      { id: "PROC-3", label: "Freedom of Information (FOI) / public records process integrated", severity_gov: "Med", category_tag: "Other", category_tag_freetext: "FOI / Public Records Compliance", remediation: "Integrate FOI / public records handling into the process before go-live." },
      { id: "PROC-4", label: "Change control process for ministerial-facing systems defined", severity_gov: "Med", category_tag: "NFR", remediation: "Define a change control process for any ministerial-facing system or report." },
      { id: "PROC-5", label: "Citizen complaints / service feedback process integrated", severity_gov: "Low", category_tag: "NFR", remediation: "Integrate a citizen complaints / service feedback process before launch." },
    ],
  },
  {
    id: "data-integration",
    name: "Data & Integration",
    weight: 0.15,
    items: [
      { id: "DATA-1", label: "Cross-department data sharing agreement confirmed", severity_gov: "High", category_tag: "Consent", remediation: "Confirm the cross-department data sharing agreement is in place and current." },
      { id: "DATA-2", label: "Citizen data privacy & PII safeguards validated", severity_gov: "High", category_tag: "PII", remediation: "Validate PII/privacy safeguards for citizen data on both inputs and outputs. Where health/clinical data is involved, confirm the safeguards also meet the sector's clinical data privacy standard (e.g. HIPAA-equivalent)." },
      { id: "DATA-3", label: "Legacy government system integration pattern documented", severity_gov: "Med", category_tag: "Lineage", remediation: "Document the legacy government system integration pattern and have it validated." },
      { id: "DATA-4", label: "Data quality for public reporting/statistics validated", severity_gov: "Med", category_tag: "Lineage", remediation: "Validate data quality feeding any public reporting or official statistics." },
      { id: "DATA-5", label: "Audit trail for ministerial/parliamentary reporting confirmed", severity_gov: "Med", category_tag: "Lineage", remediation: "Confirm the audit trail is complete for ministerial/parliamentary reporting obligations." },
    ],
  },
  {
    id: "technology-infrastructure",
    name: "Technology & Infrastructure",
    weight: 0.15,
    items: [
      { id: "TECH-1", label: "Accessibility compliance (e.g. WCAG) for citizen-facing services validated", severity_gov: "High", category_tag: "Other", category_tag_freetext: "Accessibility Compliance", remediation: "Validate citizen-facing services against the required accessibility standard (e.g. WCAG)." },
      { id: "TECH-2", label: "Legacy system interoperability risk assessed", severity_gov: "Med", category_tag: "Lineage", remediation: "Assess and document interoperability risk with legacy government systems." },
      { id: "TECH-3", label: "Fallback / continuity-of-service plan defined", severity_gov: "High", category_tag: "Fallback", remediation: "Define a fallback / continuity-of-service plan for critical citizen services." },
      { id: "TECH-4", label: "Capacity planning for peak citizen demand completed", severity_gov: "Med", category_tag: "RateLimit", remediation: "Complete capacity planning for peak citizen demand periods." },
      { id: "TECH-5", label: "Disaster recovery plan for critical citizen services tested", severity_gov: "High", category_tag: "Fallback", remediation: "Test the disaster recovery plan for critical citizen-facing services." },
    ],
  },
  {
    id: "governance-compliance",
    name: "Governance & Compliance",
    weight: 0.30,
    items: [
      { id: "GOV-1", label: "Probity / conflict-of-interest declarations completed", severity_gov: "High", category_tag: "Probity", remediation: "Collect and review probity / conflict-of-interest declarations from all relevant parties." },
      { id: "GOV-2", label: "Political/ministerial risk assessment documented", severity_gov: "High", category_tag: "NFR", remediation: "Document a political/ministerial risk assessment and route it through the appropriate sign-off." },
      { id: "GOV-3", label: "Budget & appropriations compliance confirmed", severity_gov: "High", category_tag: "NFR", remediation: "Confirm the programme's spend is compliant with its budget and appropriations authority." },
      { id: "GOV-4", label: "Public records retention & audit trail confirmed", severity_gov: "Med", category_tag: "Lineage", remediation: "Confirm public records retention and audit-trail completeness for the programme." },
      { id: "GOV-5", label: "Public/media disclosure and transparency plan defined", severity_gov: "Med", category_tag: "Consent", remediation: "Define a public/media disclosure and transparency plan ahead of launch." },
    ],
  },
];

const PUBLIC_SECTOR_SAMPLES = [
  {
    id: "good",
    label: "Good — minor gaps only",
    feature_name: "Sample: Citizen Services Digital Uplift",
    answers: {
      "PPL-1": "yes", "PPL-2": "yes", "PPL-3": "yes", "PPL-4": "yes", "PPL-5": "partial",
      "PROC-1": "yes", "PROC-2": "yes", "PROC-3": "yes", "PROC-4": "yes", "PROC-5": "partial",
      "DATA-1": "yes", "DATA-2": "yes", "DATA-3": "yes", "DATA-4": "yes", "DATA-5": "yes",
      "TECH-1": "yes", "TECH-2": "yes", "TECH-3": "yes", "TECH-4": "yes", "TECH-5": "yes",
      "GOV-1": "yes", "GOV-2": "yes", "GOV-3": "yes", "GOV-4": "yes", "GOV-5": "yes",
    },
  },
];

// --- Sample assessments ------------------------------------------------------------
// Baseline keeps its full 4-tier treatment (Best/Good/Intentionally Off/Very Bad).
// Water and Energy get 1 representative "Good" sample each — see DECISIONS.md for why
// the depth is asymmetric. All samples are asserted against in tests/scoring.test.js.
const BASELINE_SAMPLES = [
  {
    id: "best",
    label: "Best — fully ready",
    feature_name: "Sample: Fully Ready Feature",
    answers: {
      "PPL-1": "yes", "PPL-2": "yes", "PPL-3": "yes", "PPL-4": "yes", "PPL-5": "yes",
      "PROC-1": "yes", "PROC-2": "yes", "PROC-3": "yes", "PROC-4": "yes", "PROC-5": "yes",
      "DATA-1": "yes", "DATA-2": "yes", "DATA-3": "yes", "DATA-4": "yes", "DATA-5": "yes",
      "TECH-1": "yes", "TECH-2": "yes", "TECH-3": "yes", "TECH-4": "yes", "TECH-5": "yes",
      "GOV-1": "yes", "GOV-2": "yes", "GOV-3": "yes", "GOV-4": "yes", "GOV-5": "yes",
    },
  },
  {
    id: "good",
    label: "Good — minor gaps only",
    feature_name: "Sample: Minor Gaps Feature",
    answers: {
      "PPL-1": "yes", "PPL-2": "partial", "PPL-3": "yes", "PPL-4": "yes", "PPL-5": "yes",
      "PROC-1": "yes", "PROC-2": "yes", "PROC-3": "yes", "PROC-4": "yes", "PROC-5": "yes",
      "DATA-1": "yes", "DATA-2": "yes", "DATA-3": "yes", "DATA-4": "yes", "DATA-5": "yes",
      "TECH-1": "yes", "TECH-2": "partial", "TECH-3": "yes", "TECH-4": "yes", "TECH-5": "yes",
      "GOV-1": "yes", "GOV-2": "yes", "GOV-3": "yes", "GOV-4": "yes", "GOV-5": "yes",
    },
  },
  {
    id: "intentionally_off",
    label: "Intentionally Off — borderline / conditional",
    feature_name: "Sample: Borderline Feature",
    answers: {
      "PPL-1": "yes", "PPL-2": "yes", "PPL-3": "yes", "PPL-4": "yes", "PPL-5": "yes",
      "PROC-1": "yes", "PROC-2": "partial", "PROC-3": "yes", "PROC-4": "partial", "PROC-5": "yes",
      "DATA-1": "yes", "DATA-2": "yes", "DATA-3": "yes", "DATA-4": "partial", "DATA-5": "yes",
      "TECH-1": "partial", "TECH-2": "no", "TECH-3": "yes", "TECH-4": "yes", "TECH-5": "yes",
      "GOV-1": "partial", "GOV-2": "no", "GOV-3": "yes", "GOV-4": "yes", "GOV-5": "no",
    },
  },
  {
    id: "very_bad",
    label: "Very Bad — not ready",
    feature_name: "Sample: Not Ready Feature",
    answers: {
      "PPL-1": "partial", "PPL-2": "no", "PPL-3": "no", "PPL-4": "no", "PPL-5": "no",
      "PROC-1": "partial", "PROC-2": "no", "PROC-3": "partial", "PROC-4": "no", "PROC-5": "no",
      "DATA-1": "no", "DATA-2": "no", "DATA-3": "no", "DATA-4": "no", "DATA-5": "partial",
      "TECH-1": "partial", "TECH-2": "no", "TECH-3": "no", "TECH-4": "no", "TECH-5": "no",
      "GOV-1": "no", "GOV-2": "no", "GOV-3": "no", "GOV-4": "no", "GOV-5": "no",
    },
  },
];

const WATER_SAMPLES = [
  {
    id: "good",
    label: "Good — minor gaps only",
    feature_name: "Sample: Regional Water Network Upgrade",
    answers: {
      "PPL-1": "yes", "PPL-2": "yes", "PPL-3": "yes", "PPL-4": "yes", "PPL-5": "partial",
      "PROC-1": "yes", "PROC-2": "yes", "PROC-3": "yes", "PROC-4": "yes", "PROC-5": "yes",
      "DATA-1": "partial", "DATA-2": "yes", "DATA-3": "yes", "DATA-4": "yes", "DATA-5": "yes",
      "TECH-1": "yes", "TECH-2": "yes", "TECH-3": "yes", "TECH-4": "yes", "TECH-5": "yes",
      "GOV-1": "yes", "GOV-2": "yes", "GOV-3": "yes", "GOV-4": "yes", "GOV-5": "yes",
    },
  },
];

const ENERGY_SAMPLES = [
  {
    id: "good",
    label: "Good — minor gaps only",
    feature_name: "Sample: Regional Grid Modernisation Programme",
    answers: {
      "PPL-1": "yes", "PPL-2": "yes", "PPL-3": "yes", "PPL-4": "yes", "PPL-5": "partial",
      "PROC-1": "yes", "PROC-2": "yes", "PROC-3": "yes", "PROC-4": "yes", "PROC-5": "partial",
      "DATA-1": "yes", "DATA-2": "yes", "DATA-3": "yes", "DATA-4": "yes", "DATA-5": "yes",
      "TECH-1": "yes", "TECH-2": "yes", "TECH-3": "yes", "TECH-4": "yes", "TECH-5": "yes",
      "GOV-1": "yes", "GOV-2": "yes", "GOV-3": "yes", "GOV-4": "yes", "GOV-5": "yes",
    },
  },
];

export const FRAMEWORKS = [
  {
    id: "baseline",
    label: "Financial Services (Tier 1 Banking, baseline)",
    schemaVersion: "1.0",
    pillars: BASELINE_PILLARS,
    samples: BASELINE_SAMPLES,
  },
  {
    id: "water",
    label: "Regulated Infrastructure & Utilities — Water Asset Transformation",
    schemaVersion: "1.1",
    pillars: WATER_PILLARS,
    samples: WATER_SAMPLES,
  },
  {
    id: "energy",
    label: "Regulated Infrastructure & Utilities — Energy Grid Operating Model",
    schemaVersion: "1.1",
    pillars: ENERGY_PILLARS,
    samples: ENERGY_SAMPLES,
  },
  {
    id: "public-sector",
    label: "Public Sector / Healthcare",
    schemaVersion: "1.2",
    pillars: PUBLIC_SECTOR_PILLARS,
    samples: PUBLIC_SECTOR_SAMPLES,
  },
];

export const DEFAULT_FRAMEWORK_ID = "baseline";
