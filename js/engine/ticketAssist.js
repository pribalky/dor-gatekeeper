import { keywordsFor } from "../config/checklistKeywordMap.js";

const SNIPPET_RADIUS = 40;

// Only ever suggests "yes" — a keyword's presence is treated as (weak) positive
// evidence the concern is addressed; its absence is never treated as evidence of a
// gap ("no"/"partial" are never suggested), matching this app's advisory-only,
// never-fabricate discipline. Pure — no DOM, caller decides whether/how to apply.
export function suggestAnswersFromText(text, pillars) {
  const haystack = text.toLowerCase();
  const suggestions = [];

  for (const pillar of pillars) {
    for (const item of pillar.items) {
      const keywords = keywordsFor(item.category_tag);
      const matchedKeyword = keywords.find((k) => haystack.includes(k));
      if (!matchedKeyword) continue;

      const matchIndex = haystack.indexOf(matchedKeyword);
      const start = Math.max(0, matchIndex - SNIPPET_RADIUS);
      const end = Math.min(text.length, matchIndex + matchedKeyword.length + SNIPPET_RADIUS);
      const snippet = `${start > 0 ? "…" : ""}${text.slice(start, end).trim()}${end < text.length ? "…" : ""}`;

      suggestions.push({ item_id: item.id, evidence: snippet });
    }
  }

  return suggestions;
}
