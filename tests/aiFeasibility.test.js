import { assertEqual, assertTrue } from "./assert.js";
import { HAZARD_RULES } from "../js/config/aiHazardRules.js";
import { evaluateHazards, deriveFeasibilityVerdict } from "../js/engine/aiFeasibility.js";
import { routeAiDecision } from "../js/engine/aiRouting.js";
import {
  buildAiFeasibilityAdr,
  exportFilenameAiFeasibilityAdr,
  buildAiFeasibilityRego,
  exportFilenameAiFeasibilityRego,
} from "../js/export/aiFeasibilityAdr.js";

const BASE_INPUTS = {
  determinism: "high",
  complexity: "high",
  dataSensitivity: "public",
  integrationTarget: "legacy-batch",
  latencyCostBudget: "bounded",
  agenticToolAccess: "none",
  aiModelTier: "deterministic-na",
};

// Each rule triggers independently and doesn't fire on non-matching inputs.
// BASE_INPUTS' latencyCostBudget is "bounded", so regulated + external-llm-api
// legitimately co-triggers the latency-risk rule too — both hazards genuinely apply
// to that configuration simultaneously, not a test artifact.
assertEqual(
  evaluateHazards({ ...BASE_INPUTS, dataSensitivity: "regulated", integrationTarget: "external-llm-api" }).map((h) => h.id),
  ["regulated-data-external-llm", "bounded-latency-external-llm"],
  "regulated data + external LLM API triggers the data-leakage rule (and co-triggers the bounded-latency rule)"
);
assertEqual(
  evaluateHazards({ ...BASE_INPUTS, dataSensitivity: "regulated", determinism: "low" }).map((h) => h.id),
  ["regulated-data-probabilistic-model"],
  "regulated data + probabilistic model triggers the hallucination-hazard rule"
);
assertEqual(
  evaluateHazards({ ...BASE_INPUTS, latencyCostBudget: "bounded", integrationTarget: "external-llm-api" }).map((h) => h.id),
  ["bounded-latency-external-llm"],
  "bounded latency budget + external LLM API triggers the latency-risk rule"
);
assertEqual(
  evaluateHazards({ ...BASE_INPUTS, latencyCostBudget: "unbounded" }).map((h) => h.id),
  ["unbounded-cost-budget"],
  "unbounded latency/cost budget triggers the unbounded-cost rule"
);
assertEqual(evaluateHazards(BASE_INPUTS), [], "a clean, low-risk configuration triggers no hazards");
assertEqual(HAZARD_RULES.length, 7, "sanity: 7 hazard rules are defined");

// MCP & Agentic Security — declaration + flag, not runtime interception.
assertEqual(
  evaluateHazards({ ...BASE_INPUTS, agenticToolAccess: "read-write-mcp" }).map((h) => h.id),
  ["agentic-mutating-mcp-tool-access"],
  "read-write MCP tool access triggers the Confused Deputy / Tool Poisoning rule"
);
assertEqual(
  evaluateHazards({ ...BASE_INPUTS, agenticToolAccess: "read-only-mcp", determinism: "low" }).map((h) => h.id),
  ["agentic-readonly-mcp-tool-access-low-determinism"],
  "read-only MCP tool access + low determinism triggers the unvalidated-tool-output rule"
);
assertEqual(
  evaluateHazards({ ...BASE_INPUTS, agenticToolAccess: "read-only-mcp", determinism: "high" }),
  [],
  "read-only MCP tool access with high determinism (deterministic caller) triggers no hazard"
);
assertEqual(
  evaluateHazards({ ...BASE_INPUTS, agenticToolAccess: "none" }),
  [],
  "no agentic tool access triggers no MCP-related hazard"
);

// FinOps — Model Tier is the one input that changes the verdict, not just the
// reference table.
assertEqual(
  evaluateHazards({ ...BASE_INPUTS, aiModelTier: "frontier-reasoning", latencyCostBudget: "bounded" }).map((h) => h.id),
  ["frontier-reasoning-bounded-latency"],
  "frontier/reasoning tier + bounded latency/cost budget triggers the tier-mismatch rule"
);
assertEqual(
  evaluateHazards({ ...BASE_INPUTS, aiModelTier: "frontier-reasoning", latencyCostBudget: "unbounded" }).map((h) => h.id),
  ["unbounded-cost-budget"],
  "frontier/reasoning tier with an unbounded budget doesn't trigger the tier-mismatch rule (only the pre-existing unbounded-cost rule)"
);
assertEqual(
  evaluateHazards({ ...BASE_INPUTS, aiModelTier: "lightweight", latencyCostBudget: "bounded" }),
  [],
  "a lightweight tier with a bounded budget triggers no FinOps hazard"
);

// Two rules can co-trigger (regulated + external LLM + unbounded budget).
const stacked = evaluateHazards({ ...BASE_INPUTS, dataSensitivity: "regulated", integrationTarget: "external-llm-api", latencyCostBudget: "unbounded" });
assertEqual(stacked.length, 2, "a configuration matching 2 rules triggers both, not just the first");

// Verdict tiers.
assertEqual(deriveFeasibilityVerdict([], false), "PROCEED", "no hazards and no HITL requirement yields PROCEED");
assertEqual(
  deriveFeasibilityVerdict([{ severity: "Med", flag: "x", guidance: "x" }], false),
  "PROCEED WITH CONDITIONS",
  "a Med-severity hazard alone yields PROCEED WITH CONDITIONS"
);
assertEqual(deriveFeasibilityVerdict([], true), "PROCEED WITH CONDITIONS", "an HITL requirement alone (no hazards) yields PROCEED WITH CONDITIONS");
assertEqual(
  deriveFeasibilityVerdict([{ severity: "High", flag: "x", guidance: "x" }], false),
  "RECONSIDER APPROACH",
  "a High-severity hazard yields RECONSIDER APPROACH regardless of HITL"
);
assertEqual(
  deriveFeasibilityVerdict([{ severity: "Med", flag: "x", guidance: "x" }, { severity: "High", flag: "y", guidance: "y" }], false),
  "RECONSIDER APPROACH",
  "High severity wins over a co-occurring Med severity"
);

// ADR export content.
const routing = routeAiDecision("low", "high"); // Pure AI Flow, hitlRequired: true
const adrInputs = { ...BASE_INPUTS, determinism: "low", complexity: "high", dataSensitivity: "regulated", integrationTarget: "external-llm-api", featureName: "Customer Support Chatbot" };
const hazards = evaluateHazards(adrInputs);
const verdict = deriveFeasibilityVerdict(hazards, routing.hitlRequired);
const adr = buildAiFeasibilityAdr(adrInputs, routing, hazards, verdict);

assertTrue(adr.includes("# ADR: AI Feasibility — Customer Support Chatbot"), "ADR title includes the feature name");
assertTrue(adr.includes("## Status"), "ADR includes the Status section");
assertTrue(adr.includes("## Context"), "ADR includes the Context section");
assertTrue(adr.includes("## Decision"), "ADR includes the Decision section");
assertTrue(adr.includes("## Consequences"), "ADR includes the Consequences section");
assertTrue(adr.includes(verdict), "ADR Status section includes the verdict");
assertTrue(adr.includes("Data Leakage Risk"), "ADR Context section includes the triggered hazard flag text");
assertTrue(adr.includes(routing.guidance), "ADR Decision section includes the routed quadrant's guidance");
assertTrue(adr.includes("**Model Tier (FinOps):**"), "ADR Context section includes the Model Tier line");

// A clean configuration still produces all 4 sections, degrading gracefully.
const cleanRouting = routeAiDecision("high", "low");
const cleanAdr = buildAiFeasibilityAdr({ ...BASE_INPUTS, featureName: "Clean Feature" }, cleanRouting, [], "PROCEED");
assertTrue(cleanAdr.includes("No hazards were flagged"), "a clean configuration's ADR Context says so explicitly");

assertEqual(
  exportFilenameAiFeasibilityAdr("Customer Support Chatbot", "abc-123"),
  "customer-support-chatbot_abc-123_ai_feasibility_adr.md",
  "AI feasibility ADR filename is slugified feature name + assessment_id"
);

// Rego policy snippet — real, opa-eval-runnable, denies only on RECONSIDER APPROACH.
const reconsiderRego = buildAiFeasibilityRego(adrInputs, hazards, "RECONSIDER APPROACH");
assertTrue(reconsiderRego.includes("package dor.ai_feasibility"), "Rego snippet declares the dor.ai_feasibility package");
assertTrue(reconsiderRego.includes("import rego.v1"), "Rego snippet imports rego.v1");
assertTrue(reconsiderRego.includes('verdict := "RECONSIDER APPROACH"'), "Rego snippet embeds the verdict");
assertTrue(reconsiderRego.includes("deny contains msg if"), "Rego snippet declares a deny rule for RECONSIDER APPROACH");
assertTrue(reconsiderRego.includes("Data Leakage Risk"), "Rego snippet includes a deny rule per triggered High-severity hazard");

const proceedRego = buildAiFeasibilityRego(BASE_INPUTS, [], "PROCEED");
assertTrue(proceedRego.includes('verdict := "PROCEED"'), "a PROCEED verdict's Rego snippet still embeds the verdict");
assertEqual(
  (proceedRego.match(/deny contains msg if \{/g) || []).length,
  1,
  "a PROCEED verdict with no High-severity hazards still declares exactly the base deny rule (which never fires for PROCEED)"
);

assertEqual(
  exportFilenameAiFeasibilityRego("Customer Support Chatbot", "abc-123"),
  "customer-support-chatbot_abc-123_ai_feasibility_policy.rego",
  "AI feasibility Rego filename is slugified feature name + assessment_id"
);
