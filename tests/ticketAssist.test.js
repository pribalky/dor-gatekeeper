import { assertEqual, assertTrue } from "./assert.js";
import { suggestAnswersFromText } from "../js/engine/ticketAssist.js";

const pillars = [
  {
    id: "p1",
    items: [
      { id: "PII-1", category_tag: "PII" },
      { id: "FB-1", category_tag: "Fallback" },
      { id: "OTHER-1", category_tag: "Other" },
    ],
  },
];

const matched = suggestAnswersFromText("This story ensures all PII is redacted before storage.", pillars);
assertEqual(matched.length, 1, "a keyword match produces exactly one suggestion");
assertEqual(matched[0].item_id, "PII-1", "the suggestion is attributed to the correct item");
assertTrue(matched[0].evidence.toLowerCase().includes("pii"), "the evidence snippet includes the matched text");

const noMatch = suggestAnswersFromText("This story adds a new button to the settings page.", pillars);
assertEqual(noMatch, [], "no keyword match produces no suggestions — never a negative claim");

const otherTagText = suggestAnswersFromText("Anything at all, including pii and fallback words.", [
  { id: "p2", items: [{ id: "OTHER-2", category_tag: "Other" }] },
]);
assertEqual(otherTagText, [], "an item tagged Other (no keywords defined) never produces a suggestion");

const overlapping = suggestAnswersFromText("We added a circuit breaker and also redact PII on export.", pillars);
assertEqual(overlapping.length, 2, "two distinct category tags each matching their own keyword both produce a suggestion");
assertTrue(
  overlapping.some((s) => s.item_id === "PII-1") && overlapping.some((s) => s.item_id === "FB-1"),
  "overlapping keyword matches across two tags are both attributed correctly, not double-counted onto one item"
);
