// Portal problem→solution navigator (portal.html): a director-level "concern → where
// it's solved → direct link" reference. Every non-roadmap row's url must resolve to a
// real, already-shipped feature — asserted directly in
// tests/concernNavigatorMap.test.js, same "fails loudly if content drifts from
// reality" discipline as sampleTicketText.test.js (DECISIONS.md #41). The one roadmap
// exception (Invisible Governance) carries status: "roadmap" and renders visibly
// muted with the honest reason, never a working-looking link (DECISIONS.md #45).
export const CONCERN_NAVIGATOR = [
  {
    concern: "Will an AI feasibility decision get reasoned about before build, or second-guessed after?",
    feature: "AI Suitability & Routing Matrix",
    url: "index.html?sample=intentionally_off#tab=ai",
  },
  {
    concern: "Can a policy gate actually block a pipeline before commit, not just recommend it?",
    feature: "Executable Policy-as-Code (OPA/Rego) Export",
    url: "index.html?sample=intentionally_off#tab=gaps",
  },
  {
    concern: "Will leadership see capital exposure before it's committed, or only after the sprint fails?",
    feature: "Executive Strategy-to-Execution Health Card",
    url: "https://pribalky.github.io/dor-recovery-console/?sample=very_bad&health-card=1#tab=recovery",
  },
  {
    concern: "Are OWASP LLM-style hazards (data leakage, tool poisoning) flagged before build, or discovered in production?",
    feature: "AI Hazard Flags (declarative rule table)",
    url: "index.html?sample=intentionally_off#tab=ai",
  },
  {
    concern: "Does a multi-agent or recursive-tool design get its blast radius assessed, or just shipped?",
    feature: "Agentic Risk — recursive execution / multi-agent blast-radius hazards",
    url: "index.html?sample=intentionally_off#tab=ai",
  },
  {
    concern: "Which OWASP/NIST categories does our AI governance actually touch, and which are gaps?",
    feature: "OWASP LLM Top 10 / NIST AI RMF Coverage Map",
    url: "index.html?sample=intentionally_off#tab=ai",
  },
  {
    concern: "Will an in-flight collapse show up before the retro, or only after?",
    feature: "Predictive Escalation Alert (Rework Risk trend)",
    url: "https://pribalky.github.io/dor-recovery-console/?sample=very_bad#tab=rework",
  },
  {
    concern: "Do we know which NFR gate a gap actually violates, or just that its severity is High?",
    feature: "NFR Gateway Exposure",
    url: "https://pribalky.github.io/dor-recovery-console/?sample=very_bad#tab=nfr",
  },
  {
    concern: "Does turning a checklist gap into acceptance criteria take an hour, or one click?",
    feature: "Ticket-to-Checklist Assist",
    url: "index.html?sample=intentionally_off#tab=assessment",
  },
  {
    concern: "Does the same checklist apply whether it's Financial Services, Water, Energy, or Public Sector?",
    feature: "4 Sector Framework Presets",
    url: "index.html?framework=water&sample=good#tab=assessment",
  },
  {
    concern: "Could we stop asking teams to self-report Jira tickets entirely, and listen passively instead?",
    feature: "Invisible Governance (Passive Jira Ingestion)",
    status: "roadmap",
    note: "Not yet configured — passive listening needs a backend webhook receiver this static, zero-backend app deliberately doesn't have (DECISIONS.md #28). Ticket-to-Checklist Assist above is the honest, pull-based version available today.",
  },
];
