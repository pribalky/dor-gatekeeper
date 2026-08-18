import { assertEqual, assertTrue } from "./assert.js";
import { CONCERN_NAVIGATOR } from "../js/config/concernNavigatorMap.js";
import { FRAMEWORKS, DEFAULT_FRAMEWORK_ID } from "../js/config/criteria.js";

const GATEKEEPER_TAB_IDS = ["assessment", "gaps", "jira", "ai", "pr"];

// dor-recovery-console is a separate repo/deployment this test suite can't import
// from directly (no cross-repo module resolution in a zero-build static app) — this
// is a hand-maintained mirror of its known-valid tab ids and bundled sample ids,
// checked against dor-recovery-console/js/config/sampleExports.js and index.html at
// the time this test was written. If that app's samples/tabs change, this list needs
// updating by hand — same "fails loudly, not silently" intent as the gatekeeper-local
// checks below, just without the cross-repo import to make it automatic.
const RECOVERY_CONSOLE_TAB_IDS = ["gaps", "raid", "nfr", "rework", "recovery", "drift"];
const RECOVERY_CONSOLE_SAMPLE_IDS = ["best", "good", "intentionally_off", "very_bad"];

function parseNavigatorUrl(url) {
  const [beforeHash, hash] = url.split("#");
  const [path, query] = beforeHash.split("?");
  const params = new URLSearchParams(query || "");
  const hashParams = new URLSearchParams((hash || "").replace(/^tab=/, "tab="));
  return {
    isRecoveryConsole: path.includes("dor-recovery-console"),
    sample: params.get("sample"),
    framework: params.get("framework"),
    tab: hash ? hash.replace(/^tab=/, "") : null,
  };
}

// Every row is either a real, resolvable link (checked below) or an explicitly
// roadmap-labeled item with no url and an honest note — never a working-looking link
// to a capability that doesn't exist.
for (const row of CONCERN_NAVIGATOR) {
  assertTrue(Boolean(row.concern), "every row has a concern");
  assertTrue(Boolean(row.feature), "every row has a feature label");

  if (row.status === "roadmap") {
    assertTrue(Boolean(row.note), `roadmap row "${row.feature}" has an explanatory note`);
    assertTrue(!row.url, `roadmap row "${row.feature}" has no url — it must not look like a working link`);
    continue;
  }

  assertTrue(Boolean(row.url), `non-roadmap row "${row.feature}" has a url`);
  const parsed = parseNavigatorUrl(row.url);

  if (parsed.isRecoveryConsole) {
    assertTrue(RECOVERY_CONSOLE_TAB_IDS.includes(parsed.tab), `"${row.feature}"'s tab "${parsed.tab}" is a known dor-recovery-console tab`);
    if (parsed.sample) {
      assertTrue(RECOVERY_CONSOLE_SAMPLE_IDS.includes(parsed.sample), `"${row.feature}"'s sample "${parsed.sample}" is a known dor-recovery-console sample id`);
    }
  } else {
    assertTrue(GATEKEEPER_TAB_IDS.includes(parsed.tab), `"${row.feature}"'s tab "${parsed.tab}" is a known dor-gatekeeper tab`);
    const frameworkId = parsed.framework || DEFAULT_FRAMEWORK_ID;
    const framework = FRAMEWORKS.find((f) => f.id === frameworkId);
    assertTrue(Boolean(framework), `"${row.feature}"'s framework "${frameworkId}" is a real framework`);
    if (parsed.sample && framework) {
      assertTrue(
        framework.samples.some((s) => s.id === parsed.sample),
        `"${row.feature}"'s sample "${parsed.sample}" exists in the "${frameworkId}" framework`
      );
    }
  }
}

assertEqual(CONCERN_NAVIGATOR.filter((r) => r.status === "roadmap").length, 1, "exactly one roadmap row (Invisible Governance) — every other row is a real, shipped feature");
