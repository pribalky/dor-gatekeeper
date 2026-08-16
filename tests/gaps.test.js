import { assertEqual, assertTrue } from "./assert.js";
import { deriveGaps } from "../js/engine/gaps.js";
import { FRAMEWORKS } from "../js/config/criteria.js";

const baseline = FRAMEWORKS.find((f) => f.id === "baseline");

// A fresh/reset assessment (no answers at all) has zero gaps — the Gap Analysis
// Breakdown panel should be empty on page load, not list every item as failed.
assertEqual(deriveGaps(baseline.pillars, {}).length, 0, "an empty answers object produces zero gaps");

// Answering only some items leaves the rest simply unanswered, not gaps.
const firstItemId = baseline.pillars[0].items[0].id;
const partialAnswers = { [firstItemId]: "no" };
const partialGaps = deriveGaps(baseline.pillars, partialAnswers);
assertEqual(partialGaps.length, 1, "only explicitly partial/no-answered items become gaps, not every unanswered one");
assertEqual(partialGaps[0].answer, "no", "the gap carries the actual answer, never 'unanswered'");

// "yes" still excludes an item; "partial" still includes it.
const secondItemId = baseline.pillars[0].items[1].id;
const mixedAnswers = { [firstItemId]: "yes", [secondItemId]: "partial" };
const mixedGaps = deriveGaps(baseline.pillars, mixedAnswers);
assertEqual(mixedGaps.length, 1, "a 'yes' answer never becomes a gap");
assertEqual(mixedGaps[0].item_id, secondItemId, "a 'partial' answer becomes a gap");

// The fully-ready sample still produces zero gaps (unchanged behavior).
const bestSample = baseline.samples.find((s) => s.id === "best");
assertEqual(deriveGaps(baseline.pillars, bestSample.answers).length, 0, "a fully-answered 'best' sample still produces zero gaps");
