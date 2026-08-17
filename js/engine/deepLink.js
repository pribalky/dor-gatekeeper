// Pure URL-parsing for the persona-routed portal (portal.html) to deep-link into the
// assessment app with a pre-selected framework, a pre-loaded sample, and a
// pre-selected tab — no DOM access here, app.js applies the result. Same shape as
// dor-recovery-console's own deepLink.js (independent copy — DECISIONS.md #1-2),
// plus the framework param this app's samples need.
export function parseDeepLinkParams(search, hash) {
  const params = new URLSearchParams(search);
  const hashParams = new URLSearchParams((hash || "").replace(/^#/, ""));

  return {
    framework: params.get("framework") || null,
    sample: params.get("sample") || null,
    tab: hashParams.get("tab") || null,
  };
}
