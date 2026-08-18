import { assertEqual, assertTrue } from "./assert.js";
import { HAZARD_RULES } from "../js/config/aiHazardRules.js";
import {
  HAZARD_RULE_FRAMEWORK_MAP,
  OWASP_LLM_CATEGORIES,
  NIST_RMF_FUNCTIONS,
  frameworkForHazard,
  owaspCoverage,
} from "../js/config/owaspNistMap.js";

// Every hazard rule that exists today has a mapping — the map must not silently drift
// out of sync with aiHazardRules.js as new rules are added.
for (const rule of HAZARD_RULES) {
  assertTrue(Boolean(HAZARD_RULE_FRAMEWORK_MAP[rule.id]), `hazard rule "${rule.id}" has an OWASP/NIST mapping`);
}
assertEqual(Object.keys(HAZARD_RULE_FRAMEWORK_MAP).length, HAZARD_RULES.length, "the mapping has exactly one entry per hazard rule, no orphans");

assertEqual(OWASP_LLM_CATEGORIES.length, 10, "all 10 OWASP LLM Top 10 (2023) categories are listed");
assertEqual(NIST_RMF_FUNCTIONS, ["Govern", "Map", "Measure", "Manage"], "all 4 NIST AI RMF 1.0 functions are listed");

// Every OWASP/NIST id referenced by the map must be a real id from the static lists —
// catches a typo'd "LLM11" or "Assess" before it ships.
const validOwaspIds = new Set(OWASP_LLM_CATEGORIES.map((c) => c.id));
for (const [ruleId, mapping] of Object.entries(HAZARD_RULE_FRAMEWORK_MAP)) {
  for (const owaspId of mapping.owasp) {
    assertTrue(validOwaspIds.has(owaspId), `"${ruleId}"'s OWASP id "${owaspId}" is a real 2023 LLM Top 10 category`);
  }
  for (const nistFn of mapping.nist) {
    assertTrue(NIST_RMF_FUNCTIONS.includes(nistFn), `"${ruleId}"'s NIST function "${nistFn}" is a real AI RMF 1.0 function`);
  }
}

assertEqual(frameworkForHazard("regulated-data-external-llm"), { owasp: ["LLM06"], nist: ["Map", "Manage"] }, "frameworkForHazard returns the matching entry");
assertEqual(frameworkForHazard("not-a-real-rule"), null, "frameworkForHazard returns null for an unmapped id, never throws");

// Coverage is honest about gaps — LLM03 (Training Data Poisoning) is not touched by
// any rule in this static intake, and the coverage list must say so, not hide it.
const coverage = owaspCoverage();
assertEqual(coverage.length, 10, "owaspCoverage returns all 10 categories, covered or not");
const llm03 = coverage.find((c) => c.id === "LLM03");
assertEqual(llm03.covered, false, "LLM03 Training Data Poisoning is correctly shown as not covered by any rule here");
const llm04 = coverage.find((c) => c.id === "LLM04");
assertEqual(llm04.covered, true, "LLM04 Model Denial of Service is correctly shown as covered (latency/cost hazard rules)");
