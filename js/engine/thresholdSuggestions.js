// Reader half of the cross-app closed-loop signal — dor-recovery-console writes
// { pillar_name, category_tag, severity_gov, tier, timestamp } signals to the same
// same-origin localStorage key (both apps served under pribalky.github.io); this
// derives which pillars keep recurring, so the UI can surface an advisory suggestion.
// Never mutates FRAMEWORKS/weights itself — reference only, same discipline as
// dor-recovery-console's REMEDIATION_PATHWAYS.
export function deriveThresholdSuggestions(signals, minOccurrences = 3) {
  const counts = new Map();
  for (const signal of signals) {
    counts.set(signal.pillar_name, (counts.get(signal.pillar_name) ?? 0) + 1);
  }

  return [...counts.entries()]
    .filter(([, count]) => count >= minOccurrences)
    .map(([pillar_name, count]) => ({ pillar_name, count }))
    .sort((a, b) => b.count - a.count);
}
