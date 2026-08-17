import { deriveThresholdSuggestions } from "./thresholdSuggestions.js";

// Pre-sprint escalation signal: reuses the same "hot pillar" derivation the
// threshold-suggestions banner already computes (pillars that have driven >=3 recent
// Medium/High rework-risk assessments in dor-recovery-console), then checks how many
// of *this* assessment's current gaps sit in one of those hot pillars. Categorical
// only — no invented score (DECISIONS.md #29's precedent) — and returns null rather
// than "Low" when there's nothing to say, so the UI can distinguish "no claim" from
// a real computed tier.
export function deriveEscalationLikelihood(gaps, signals, minOccurrences = 3) {
  const hotPillars = new Set(deriveThresholdSuggestions(signals, minOccurrences).map((s) => s.pillar_name));
  if (hotPillars.size === 0) return null;

  const matchingGaps = gaps.filter((g) => hotPillars.has(g.pillar_name));
  if (matchingGaps.length === 0) return null;

  const tier = matchingGaps.length === 1 ? "Moderate" : "Elevated";
  return {
    tier,
    matchingGapCount: matchingGaps.length,
    matchingPillars: [...new Set(matchingGaps.map((g) => g.pillar_name))],
  };
}
