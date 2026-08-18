// Declarative hazard rules for the AI Governance & Feasibility Router. Each rule is
// pure data — a `match` object checked by simple equality against the current intake
// selections, never inline if/else — so new rules are additive and independently
// testable, matching the lookup-table discipline used elsewhere in this repo
// (edgeCaseMap.js, interventionMap.js in the companion app). A `match` key absent
// from a rule means "don't care" for that field.
export const HAZARD_RULES = [
  {
    id: "regulated-data-external-llm",
    match: { dataSensitivity: "regulated", integrationTarget: "external-llm-api" },
    severity: "High",
    flag: "Data Leakage Risk (OWASP LLM06)",
    guidance: "Sending regulated/PII data to a third-party LLM API is a leakage risk. Require an on-prem/private VPC endpoint or a data-minimization layer before any external call.",
  },
  {
    id: "regulated-data-probabilistic-model",
    match: { dataSensitivity: "regulated", determinism: "low" },
    severity: "High",
    flag: "Hallucination Hazard",
    guidance: "A regulated/high-accuracy requirement is incompatible with a probabilistic model. Re-route to a deterministic rule engine, or add a verifying human-in-the-loop gate before any output is acted on.",
  },
  {
    id: "bounded-latency-external-llm",
    match: { latencyCostBudget: "bounded", integrationTarget: "external-llm-api" },
    severity: "Med",
    flag: "Latency Risk",
    guidance: "An external LLM call rarely holds a tight bounded-latency budget. Require a fallback path and a hard timeout.",
  },
  {
    id: "unbounded-cost-budget",
    match: { latencyCostBudget: "unbounded" },
    severity: "Med",
    flag: "Unbounded Cost Risk",
    guidance: "No token/spend ceiling is implied by an unbounded budget. Require a hard cost cap and a circuit breaker before this reaches production traffic.",
  },
  // MCP & Agentic Security, and Agent Orchestration below — a declaration + flag, not
  // runtime interception or real static/dynamic analysis (DECISIONS.md #28 defers
  // that — it needs a backend this static app deliberately doesn't have). This app has
  // no way to observe an actual tool call or execution graph; it asks the assessor to
  // declare the design's tool access and orchestration shape and flags the standard
  // hazard when they combine.
  {
    id: "agentic-mutating-mcp-tool-access",
    match: { agenticToolAccess: "read-write-mcp" },
    severity: "High",
    flag: "Confused Deputy / Tool Poisoning Hazard (MCP)",
    guidance: "Mutating tool calls (writing to or changing an external API/database via MCP) require a human-in-the-loop approval gate before execution, and tool responses must be validated before being chained into further actions — a poisoned or malicious tool response should never cascade unchecked.",
  },
  {
    id: "agentic-readonly-mcp-tool-access-low-determinism",
    match: { agenticToolAccess: "read-only-mcp", determinism: "low" },
    severity: "Med",
    flag: "Unvalidated Tool Output Risk",
    guidance: "An LLM agent consuming external data via MCP, even read-only, should validate/sanitize tool responses before using them in downstream decisions — an untrusted or malformed response can still mislead a low-determinism model.",
  },
  // Agent Orchestration — same declaration-not-interception discipline as the two MCP
  // rules above. This app has no way to observe an actual agent's execution graph; it
  // asks the assessor to declare the orchestration shape and flags the standard hazard
  // when that shape is combined with mutating (read-write) tool access.
  {
    id: "agentic-recursive-chaining-mutating",
    match: { agenticToolAccess: "read-write-mcp", agentOrchestration: "recursive-tool-chaining" },
    severity: "High",
    flag: "Recursive Tool Execution Hazard",
    guidance: "Recursive tool chaining with mutating access means each hop compounds what one poisoned or malicious tool response can reach. Require a hard step/depth ceiling and a kill-switch that can halt the chain mid-execution.",
  },
  {
    id: "agentic-multi-agent-mutating",
    match: { agenticToolAccess: "read-write-mcp", agentOrchestration: "multi-agent-orchestration" },
    severity: "High",
    flag: "Multi-Agent Blast-Radius Hazard",
    guidance: "Multiple agents with mutating access widens the blast radius of any single compromised or misbehaving agent. Require least-privilege credential scoping per agent and one accountable human-in-the-loop approval point spanning all agents — never per-agent approval that can be individually bypassed.",
  },
  // FinOps — the one place the Model Tier input changes the verdict rather than just
  // informing the reference table below it.
  {
    id: "frontier-reasoning-bounded-latency",
    match: { aiModelTier: "frontier-reasoning", latencyCostBudget: "bounded" },
    severity: "Med",
    flag: "Latency/Cost Tier Mismatch",
    guidance: "A frontier/reasoning-tier model rarely holds a tight bounded-latency budget, and its per-token cost is the highest of any tier. Route to a lighter model tier, or relax the latency/cost budget and add a hard timeout.",
  },
];
