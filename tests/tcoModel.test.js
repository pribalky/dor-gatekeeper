import { assertEqual, assertTrue } from "./assert.js";
import { MODEL_TIER_TCO, tcoForTier } from "../js/config/tcoModel.js";

const EXPECTED_TIERS = ["deterministic-na", "lightweight", "mid-tier", "frontier-reasoning"];

assertEqual(Object.keys(MODEL_TIER_TCO), EXPECTED_TIERS, "all 4 model tiers are defined, in ascending cost order");

for (const tier of EXPECTED_TIERS) {
  const entry = MODEL_TIER_TCO[tier];
  assertTrue(Boolean(entry.label), `${tier} has a label`);
  assertTrue(Boolean(entry.illustrativeLatencyBand), `${tier} has an illustrative latency band`);
  assertTrue(Boolean(entry.whenToUse), `${tier} has when-to-use guidance`);
  assertTrue(
    entry.illustrativeCostPer1kTokensUsd.low <= entry.illustrativeCostPer1kTokensUsd.high,
    `${tier}'s illustrative cost band is low <= high`
  );
}

// Cost bands should strictly increase from deterministic through frontier — the
// whole point of the reference table is showing the trade-off.
assertTrue(
  MODEL_TIER_TCO.lightweight.illustrativeCostPer1kTokensUsd.high < MODEL_TIER_TCO["mid-tier"].illustrativeCostPer1kTokensUsd.high,
  "lightweight tier's cost ceiling is below mid-tier's"
);
assertTrue(
  MODEL_TIER_TCO["mid-tier"].illustrativeCostPer1kTokensUsd.high < MODEL_TIER_TCO["frontier-reasoning"].illustrativeCostPer1kTokensUsd.high,
  "mid-tier's cost ceiling is below frontier-reasoning's"
);

assertEqual(tcoForTier("mid-tier"), MODEL_TIER_TCO["mid-tier"], "tcoForTier returns the matching entry");
assertEqual(tcoForTier("unknown-tier"), null, "tcoForTier returns null for an unrecognised tier, never throws");
