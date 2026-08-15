import { assertEqual, assertTrue } from "./assert.js";
import { HAZARD_RULES } from "../js/config/aiHazardRules.js";
import { evaluateHazards, deriveFeasibilityVerdict } from "../js/engine/aiFeasibility.js";
import { routeAiDecision } from "../js/engine/aiRouting.js";
import { buildAiFeasibilityAdr, exportFilenameAiFeasibilityAdr } from "../js/export/aiFeasibilityAdr.js";

const BASE_INPUTS = { determinism: "high", complexity: "high", dataSensitivity: "public", integrationTarget: "legacy-batch", latencyCostBudget: "bounded" };

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
assertEqual(HAZARD_RULES.length, 4, "sanity: 4 hazard rules are defined");

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

// A clean configuration still produces all 4 sections, degrading gracefully.
const cleanRouting = routeAiDecision("high", "low");
const cleanAdr = buildAiFeasibilityAdr({ ...BASE_INPUTS, featureName: "Clean Feature" }, cleanRouting, [], "PROCEED");
assertTrue(cleanAdr.includes("No hazards were flagged"), "a clean configuration's ADR Context says so explicitly");

assertEqual(
  exportFilenameAiFeasibilityAdr("Customer Support Chatbot", "abc-123"),
  "customer-support-chatbot_abc-123_ai_feasibility_adr.md",
  "AI feasibility ADR filename is slugified feature name + assessment_id"
);
