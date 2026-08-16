// One gap per checklist item explicitly answered "partial" or "no". An unanswered
// item is not yet a gap — it's simply not answered yet (validation.js's
// unansweredItemIds is the separate, independent check that blocks export on those) —
// so a fresh page load / reset shows an empty Gap Analysis Breakdown instead of all
// 25 items flagged before the user has touched anything.
// gap_id is derived from the stable item id (not a running counter) so it never
// shifts between recomputes of the same assessment.
export function deriveGaps(pillars, answers) {
  const gaps = [];
  for (const pillar of pillars) {
    for (const item of pillar.items) {
      const answer = answers[item.id];
      if (answer !== "partial" && answer !== "no") continue;
      gaps.push({
        gap_id: `GAP-${item.id}`,
        pillar_id: pillar.id,
        pillar_name: pillar.name,
        item_id: item.id,
        description: item.label,
        severity_gov: item.severity_gov,
        category_tag: item.category_tag,
        ...(item.category_tag === "Other" ? { category_tag_freetext: item.category_tag_freetext } : {}),
        answer,
        remediation: item.remediation,
      });
    }
  }
  return gaps;
}
