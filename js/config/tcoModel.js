// FinOps / Token Economics reference bands, one entry per model tier. These are
// illustrative order-of-magnitude reference bands, not real provider pricing —
// verify against your provider's current published pricing before using this in a
// real business case. Same "authored, clearly illustrative" discipline as
// dor-recovery-console's costModel.js (see DECISIONS.md). Deliberately generic tier
// names, never named commercial models/vendors — real pricing goes stale within
// months and this static app has no mechanism to keep it current.
export const MODEL_TIER_TCO = {
  "deterministic-na": {
    label: "Deterministic / N/A",
    illustrativeCostPer1kTokensUsd: { low: 0, high: 0 },
    illustrativeLatencyBand: "Single-digit ms — no model inference in the loop",
    whenToUse: "The decision logic is fully specified; no LLM call is involved.",
  },
  lightweight: {
    label: "Lightweight / Low-Latency",
    illustrativeCostPer1kTokensUsd: { low: 0.0001, high: 0.002 },
    illustrativeLatencyBand: "~100-500ms",
    whenToUse: "High-volume, low-complexity tasks (classification, extraction, short drafting) where cost/latency dominate the decision.",
  },
  "mid-tier": {
    label: "Mid-Tier",
    illustrativeCostPer1kTokensUsd: { low: 0.002, high: 0.02 },
    illustrativeLatencyBand: "~0.5-2s",
    whenToUse: "General-purpose reasoning or generation where quality matters more than raw throughput, but a frontier model isn't justified.",
  },
  "frontier-reasoning": {
    label: "Frontier / Reasoning",
    illustrativeCostPer1kTokensUsd: { low: 0.01, high: 0.15 },
    illustrativeLatencyBand: "~2-30s (multi-step reasoning can run longer)",
    whenToUse: "Complex, high-stakes reasoning where correctness matters more than cost or a bounded-latency budget — pair with a hard timeout and fallback if a latency budget is bounded.",
  },
};

export function tcoForTier(tier) {
  return MODEL_TIER_TCO[tier] ?? null;
}
