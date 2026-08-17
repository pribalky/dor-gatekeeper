// Escapes text destined for interpolation into an innerHTML template string or an
// HTML attribute value. Anything sourced outside this app's own config data — a
// GitHub API response, a pasted-in error message, a same-origin localStorage read
// written by dor-recovery-console — is untrusted and must go through this before
// it reaches innerHTML (see DECISIONS.md).
const ESCAPE_MAP = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (ch) => ESCAPE_MAP[ch]);
}
