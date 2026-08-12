import { PILLARS } from "../config/criteria.js";

// One gap per non-"yes" checklist item. gap_id is derived from the stable item id
// (not a running counter) so it never shifts between recomputes of the same assessment.
export function deriveGaps(answers) {
  const gaps = [];
  for (const pillar of PILLARS) {
    for (const item of pillar.items) {
      const answer = answers[item.id];
      if (answer === "yes") continue;
      gaps.push({
        gap_id: `GAP-${item.id}`,
        pillar_id: pillar.id,
        pillar_name: pillar.name,
        item_id: item.id,
        description: item.label,
        severity_gov: item.severity_gov,
        category_tag: item.category_tag,
        ...(item.category_tag === "Other" ? { category_tag_freetext: item.category_tag_freetext } : {}),
        answer: answer ?? "unanswered",
        remediation: item.remediation,
      });
    }
  }
  return gaps;
}
