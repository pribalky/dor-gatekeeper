import { assertEqual } from "./assert.js";
import { parseDeepLinkParams } from "../js/engine/deepLink.js";

assertEqual(
  parseDeepLinkParams("", ""),
  { framework: null, sample: null, tab: null },
  "no query string or hash produces all-null defaults"
);

assertEqual(
  parseDeepLinkParams("?sample=intentionally_off", "#tab=ai"),
  { framework: null, sample: "intentionally_off", tab: "ai" },
  "sample and tab are parsed from the query string and hash respectively"
);

assertEqual(
  parseDeepLinkParams("?framework=baseline&sample=intentionally_off", "#tab=jira"),
  { framework: "baseline", sample: "intentionally_off", tab: "jira" },
  "framework, sample, and tab all parse together"
);

assertEqual(
  parseDeepLinkParams("?framework=public-sector", ""),
  { framework: "public-sector", sample: null, tab: null },
  "a hyphenated framework id parses correctly"
);
