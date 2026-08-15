// On-demand GitHub PR drift check — pull, not push. The user supplies a PR; this app
// calls GitHub's REST API directly from the browser (which supports CORS on
// api.github.com) and flags files matching schema/contract patterns. Purely
// informational: the result is never wired into the gate decision.

// Patterns that suggest a schema/contract mutation, not a behind-the-interface change.
const SCHEMA_CONTRACT_PATTERNS = [
  /(^|\/)schema\//i,
  /(^|\/)migrations\//i,
  /\.proto$/i,
  /(^|\/)package\.json$/i,
  /\.sql$/i,
  /(^|\/)openapi\.(json|ya?ml)$/i,
  /(^|\/)swagger\.(json|ya?ml)$/i,
];

// Pure, fully unit-testable — no network. filenames: string[].
export function classifyChangedFiles(filenames) {
  return filenames.map((filename) => {
    const flagged = SCHEMA_CONTRACT_PATTERNS.some((pattern) => pattern.test(filename));
    return {
      filename,
      flagged,
      reason: flagged ? "Schema/Contract Mutation risk" : null,
    };
  });
}

// Thin wrapper around the GitHub REST API. Network connectivity to api.github.com
// from a page context is a separate path from this session's own GitHub MCP access
// and may be blocked by an outbound network policy — see README for the caveat.
export async function fetchPrFiles(owner, repo, number, token) {
  const url = `https://api.github.com/repos/${owner}/${repo}/pulls/${number}/files`;
  const headers = { Accept: "application/vnd.github+json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`GitHub API request failed: ${response.status} ${response.statusText}`);
  }
  const files = await response.json();
  return files.map((f) => f.filename);
}
