# DECISIONS.md

This file documents non-obvious architectural and scoping decisions across both apps (DoR Gatekeeper / App 1 and Delivery Recovery & Governance Console / App 2). Each entry: what was decided, why, and what it trades off. Intended to be read by anyone reviewing the codebase — including future-me — without needing to re-derive the reasoning.

This file is cross-referenced from both repos (`dor-gatekeeper` and `dor-recovery-console`); entries 1–10 apply to both apps, entries 11+ are App 1 (this repo) implementation decisions.

---

## 1. Two apps, not one

**Decision:** Split into App 1 (DoR Gatekeeper) and App 2 (Delivery Recovery & Governance Console) instead of one combined tool.

**Why:** App 1's use case is a fast, repeatable intake check (target: ~3 minutes, run on every feature/story). App 2's use case (financial modeling, RAID tracking, executive reporting) only triggers for programs already flagged CONDITIONAL/BLOCKED or actively recovering. Combining them would force every intake check through a heavier UI, killing adoption. This also mirrors the PRD's own governance maturity spectrum (Option 1 → 2 → 3) — bolting everything into one app pushes Option 2 toward Option 3 territory prematurely.

**Trade-off:** Requires a defined handoff contract between the two apps instead of shared internal state.

---

## 2. Loosely coupled via JSON export, not a shared database

**Decision:** App 1 emits a versioned JSON file. App 2 ingests it via upload/paste. No shared backend, no live API call between them.

**Why:** Keeps both apps independently deployable, independently demoable, and free-hostable (no server-to-server auth/networking to manage). It also mirrors how real handoffs between governance and delivery functions actually work in practice — a defined contract at a boundary, not shared mutable state.

**Trade-off:** No real-time sync — App 2 always reflects a point-in-time snapshot from when the JSON was exported, not live App 1 state.

---

## 3. `severity_gov` is set once by App 1 and is immutable downstream

**Decision:** App 1's governance severity rating (High/Med/Low) is never overwritten by App 2. App 2 can re-rank/sort display order using its own financial or RAID-priority lenses, but the original governance rating is always preserved and visible.

**Why:** Preserves audit integrity. The governance/architecture lens (App 1) and the commercial/business lens (App 2) are legitimately different views on the same gap — a gap might be Med severity architecturally but High priority financially. Overwriting the original would destroy the audit trail of what governance actually flagged at assessment time.

**Trade-off:** Requires the UI to always show both the original and re-ranked values, adding a small amount of display complexity.

---

## 4. `category_tag` is a fixed enum with an `Other` escape hatch

**Decision:** Gap categorization uses a closed set of tags (PII, Fallback, RateLimit, Consent, HITL, Lineage, NFR) plus `Other` with a required freetext field.

**Why:** A fixed enum is what allows App 2's Financial Impact Translator to auto-map gaps to cost buckets without manual tagging — this is the mechanism that makes the financial layer actually automatic instead of manual guesswork. `Other` exists because rigid enums break on edge cases; without an escape hatch, novel gap types would either be miscategorized or block the pipeline entirely.

**Trade-off:** `Other`-tagged gaps can't be auto-costed — they're flagged as "requires manual costing" and never silently excluded from totals, but they do require human input to fully resolve.

---

## 5. `schema_version` field on every export

**Decision:** Every JSON export from App 1 carries an explicit schema version.

**Why:** If App 1's enum or schema changes in the future (e.g. a new category_tag is added), App 2 needs to detect version mismatches and fail loudly with a clear error — not silently misparse or crash on an unexpected field. This is a small addition now that prevents a much harder-to-debug failure mode later.

**Trade-off:** None meaningful — near-zero cost to include.

---

## 6. Financial exposure is expressed as a range, never a point estimate

**Decision:** The Financial Impact Translator outputs low/high $ ranges per gap and in aggregate, never a single number.

**Why:** A single number implies false precision and invites a stakeholder to challenge the exact figure rather than engage with the underlying uncertainty. A range signals the estimate is honest about its own confidence and shifts the conversation toward decision-making under that range — which is a more defensible and more senior way to present unmodeled risk.

**Trade-off:** Ranges are less "clean" for simple dashboard summaries — requires slightly more UI thought than a single KPI number.

---

## 7. `escalation_level` is a first-class RAID field, set at creation

**Decision:** Every RAID entry carries an explicit `escalation_level` (Team / Programme / Steering Committee / Client Exec), assigned when the entry is created, not decided reactively later.

**Why:** Escalation calibration is one of the core evaluated skills for a delivery leadership role. Making it a structured field — rather than an implicit judgment buried in a status update — makes the discipline visible and auditable, and gives a concrete, demonstrable answer to "how do you handle escalation" instead of an abstract claim.

**Trade-off:** Requires the assessor to make an escalation call up front, which may need revision as an issue evolves — status/level should be editable, not fixed forever.

---

## 8. No auth, no persistent database, no multi-tenancy (deliberately)

**Decision:** Neither app has authentication, a real database, or concurrent multi-user handling in v1.

**Why:** This is a portfolio-stage tool demonstrating architectural and governance thinking, not a production system with real client data. Building auth/persistence/scale now would be effort spent on a problem that doesn't exist yet (no real users, no real data sensitivity) instead of on the actual signal being tested (governance design, financial reasoning, executive communication).

**Trade-off:** Not usable as-is for a real client engagement — would need all three before any production use. This is explicitly out of scope and stated as such, not an oversight.

---

## 9. No CI/CD policy enforcement, no bid/proposal tooling, no CoP features

**Decision:** These are explicitly not built, even though they map to real JD/business needs (Option 3 governance spectrum, commercial account growth, mentoring/community of practice).

**Why:** These are either (a) a different point on the governance maturity spectrum requiring a real client-driven trigger to justify (CI/CD enforcement), or (b) organizational functions rather than app functions (bids, mentoring) that a dedicated feature wouldn't meaningfully prove better than clear documentation of design intent. The schema/enum structure is intentionally designed to be *extensible* by other teams without rebuilding the scoring engine — that's the actual answer to "how does this support broader reuse," not a built feature.

**Trade-off:** None — this is scope discipline, not a gap. Reviewers should read this as evidence of judgment about what not to build, not as missing functionality.

---

## 10. Fully static, client-side build (no backend server)

**Decision:** Both apps are built as static React/JS applications with all scoring, cost-mapping, and RAID logic running in-browser. No Python/Streamlit server, no backend of any kind.

**Why:** None of the actual computation requires a server — scoring is deterministic weighted math, cost mapping is a lookup table, RAID is local state, and the App1→App2 handoff is a file, not a live API call. Removing the backend entirely eliminates cold-start/sleep behavior (a real problem on free-tier Streamlit hosting), removes a whole class of infra failure modes, and allows permanent free hosting via GitHub Pages tied directly to the repo.

**Trade-off:** Required porting logic from the originally-scoped Python/Streamlit approach to JS/TS — a real one-time rebuild cost, accepted because this is intended as a long-term portfolio artifact, not a single-use demo.

---

## 11. Pillar/criteria weights are config-driven, not hardcoded

**Decision:** The 5 pillar weights and all 25 checklist items (with their `severity_gov`, `category_tag`, and remediation text) live in a single config module (`js/config/criteria.js`), never inline in scoring or UI code.

**Why:** Weights and criteria are the part of this tool most likely to need tuning per pod/account without touching the scoring engine itself. Keeping them in one file also means the engine, UI, and tests all read from one source of truth instead of three copies that can drift.

**Trade-off:** None meaningful — a config file has effectively the same cost as inline constants, just one level of indirection.

---

## 12. Gate thresholds fixed at 85 / 65

**Decision:** ≥85 APPROVED, 65–84 CONDITIONAL, <65 BLOCKED — taken directly from the PRD.

**Why:** Documenting the exact thresholds here (also as `GATE_THRESHOLDS` in config, and asserted at both boundaries in `tests/scoring.test.js`) means any future change to these numbers is a deliberate, reviewed decision — not silent drift between the PRD, the code, and someone's memory of "roughly 85."

**Trade-off:** None.

---

## 13. Gaps come only from the fixed 25-item checklist — no free-form "add gap" in App 1

**Decision:** Unlike App 2's RAID log, App 1 has no manual "add a gap/risk" entry point. Every gap is derived deterministically from a non-"Yes" answer to one of the 25 fixed checklist items.

**Why:** Ad hoc, free-form risk capture is explicitly App 2's job (RAID Mobilisation, PRD §3.3) once a programme is already flagged CONDITIONAL/BLOCKED. Keeping App 1 fully deterministic (same answers always produce the same gaps and score) is what makes it a fast, structured ~3-minute check rather than a second RAID tool — and it's what makes the checklist items reusable as automated test fixtures (see #14).

**Trade-off:** An assessor who spots a real risk outside the 25 items has nowhere to record it in App 1 — by design; it becomes an App 2 RAID entry once the assessment triggers a recovery track.

---

## 14. Sample assessments are a single source of truth, shared by the UI and the test suite

**Decision:** The 4 "load sample" answer sets offered in the UI dropdown (Best / Good / Intentionally Off / Very Bad) are defined once, in `js/config/criteria.js` (`SAMPLES`), and imported by both `js/app.js` (for the dropdown) and `tests/scoring.test.js` / `tests/export.test.js` (which assert each sample gates to its documented decision).

**Why:** A demo sample that isn't also a test fixture tends to silently drift from the scoring logic over time — the UI can end up showing an example that no longer produces the outcome its label claims. Making the samples the actual test data closes that gap: every sample in the dropdown is provably correct against the current scoring engine on every test run, not just eyeballed once.

**Trade-off:** None meaningful — the samples still need hand-picked answer combinations to land cleanly in each gate band, but that's a one-time design cost regardless of where they live.

---

## 15. Zero-dependency custom test runner instead of Jest/Vitest

**Decision:** `tests/run.js` plus a ~30-line `tests/assert.js` replace a full test framework.

**Why:** Scoring and export logic are pure functions over plain JS objects — trivial to assert without a framework's fixtures, mocks, or watch-mode machinery. Using a real framework would mean an `npm install` step this project otherwise has no reason to have, breaking the "clone and go, forever" pitch of the rest of the stack.

**Trade-off:** No test-framework conveniences (parallel runs, snapshot testing, rich diffs) — acceptable at this test volume (~40 assertions across 2 files).

---

## 16. Download filenames lead with the feature name, not just `assessment_id`

**Decision:** Exported files are named `{slugified-feature-name}_{assessment_id}_dor_export.{json|md}`, not the PRD's literal `{assessment_id}_dor_export.json`. `assessment_id` stays in the filename (and remains the field App 2 keys off inside the JSON) — only the on-disk name changes.

**Why:** A UUID-first filename is unreadable in a downloads folder — a user running several assessments can't tell them apart without opening each one. Leading with the feature name makes files self-describing and sortable by name, while keeping `assessment_id` in the name (and unchanged inside the JSON payload) preserves the stable identifier App 2 depends on.

**Trade-off:** A deliberate, minor deviation from the PRD's literal filename pattern — noted here so it reads as an intentional usability call, not drift. The JSON schema itself (§4) is unaffected; only the filename format changed.

---

## 17. Pillar taxonomy reframed to 5 general transformation pillars — free, schema-wise

**Decision:** The original 5 software/AI-specific pillars (Architectural & Data Lineage Feasibility, Responsible AI & Safety Assurance, Data Governance & Regulatory Compliance, Operational Readiness & Resilience, Definition of Ready Completeness) were replaced with 5 general transformation pillars (People & Capability, Process & Workflow, Data & Integration, Technology & Infrastructure, Governance & Compliance), used identically across every framework/sector preset (`js/config/criteria.js`, `FRAMEWORKS`).

**Why:** `pillar_name` has never been hardcoded in App 2 — it's just a display string App 2 renders from whatever arrives in the JSON. Broadening the pillar taxonomy to something that fits a general Target Operating Model assessment (not just a software feature check) costs **zero schema or App 2 changes**; only the content authored under `js/config/criteria.js` changed. This is what made the sector-preset feature (#19) tractable without touching the core scoring/export engine at all.

**Trade-off:** The baseline preset dropped 2 narrowly AI-specific items (output determinism, model drift monitoring) that didn't have an honest home in the new taxonomy, replacing them with 2 new People & Capability items (team training/role readiness, RACI/ownership) to keep every pillar at 5 items. A small, deliberate content loss in exchange for a taxonomy that generalizes.

---

## 18. `category_tag` enum extended (schema_version 1.1) rather than force-fit onto the original 8 tags

**Decision:** 3 new category_tag values — `Safety`, `AssetLifecycle`, `SupplyChain` — were added for the Water and Energy sector presets, which need physical/regulated-sector risk themes the original enum (PII/Fallback/RateLimit/Consent/HITL/Lineage/NFR/Other) doesn't honestly cover. Exports using them carry `schema_version: "1.1"`; the baseline preset (which uses only the original 8 tags) still exports `"1.0"`.

**Why:** This PRD explicitly anticipates this: *"This schema/enum is also designed to be extended by other pods without rebuilding the scoring engine — supports reuse across teams/accounts, not just this single build"* (§7). Force-fitting a water-safety-case gap into `PII` just because its cost driver text happens to superficially fit would be semantically dishonest and would undermine App 2's auto-costing quality for those sectors. Extending the enum — additively, with a versioned bump — is the mechanism the schema was designed to support, not a workaround.

**Trade-off:** App 2 must recognize the new tags and carry cost-model entries for them, and must accept both `"1.0"` and `"1.1"` on ingestion (see `dor-recovery-console`'s `DECISIONS.md`). This is coordinated, cross-repo change — the cost of the loose-coupling architecture (#2) actually evolving, not just staying static.

---

## 19. Sector presets ("frameworks") are a selectable config, not separate apps or forks

**Decision:** `js/config/criteria.js` exports `FRAMEWORKS`, an array of `{ id, label, schemaVersion, pillars, samples }`. A dropdown in the UI (`js/app.js`, `switchFramework()`) swaps the active framework; the scoring engine, gap derivation, export, and validation modules were changed from importing a fixed `PILLARS` constant to accepting `pillars` as a parameter, so they work identically regardless of which framework is active.

**Why:** Financial Services (baseline), Water Asset Transformation, and Energy Grid Operating Model are different *content*, not different *mechanics* — same 5-pillar shape, same Yes/Partial/No scoring, same gate thresholds, same export contract. Modeling this as one app with a content selector (rather than 3 forked apps, or 3 hardcoded modes) means a 4th sector is a config addition, not a new codebase.

**Trade-off:** Switching frameworks mid-assessment clears answers (item IDs aren't compatible across presets with different content) — acceptable since frameworks represent fundamentally different assessments, not variations on the same one.

---

## 20. Sample-assessment depth is asymmetric across presets

**Decision:** The baseline preset keeps its full 4-tier Best/Good/Intentionally-Off/Very-Bad samples. Water and Energy each get 1 representative "Good" sample.

**Why:** All 4 tiers exist for baseline because it's the primary, most-exercised path; hand-crafting 25-answer combinations that land cleanly in each of 4 gate bands for 2 more sectors would be disproportionate effort for a delta whose main point is proving the framework-switching mechanism and the extended enum actually work end to end — which 1 sample per sector already does, and does provably (asserted in `tests/scoring.test.js`, same pattern as baseline).

**Trade-off:** Water/Energy don't have a demonstrated CONDITIONAL or BLOCKED example yet. Noted as a fast-follow if either preset sees real use.

---

## 21. Framework labels group Water/Energy under a visible "Regulated Infrastructure" umbrella instead of merging them into one preset

**Decision:** The dropdown reads "Regulated Infrastructure — Water Asset Transformation" and "Regulated Infrastructure — Energy Grid Operating Model" as two entries, not one combined "Regulated Infrastructure" preset. Baseline is labeled "Banking / Financial Services (baseline)".

**Why:** A single generic "Infrastructure" preset would have to average over two genuinely different regulatory/operational contexts (water utility vs. grid operator), diluting both. Keeping them separate but visibly grouped by a shared label prefix gets the best of both: the dropdown reads as "3 sector families" for the interview narrative, while each preset stays specific enough to be a credible demonstration rather than a generic stand-in.

**Trade-off:** 4 dropdown entries instead of 3 — a minor UI cost for not diluting either sector's content.

---

## 22. Public Sector preset adds a 4th `category_tag` (`Probity`) via `schema_version` 1.2

**Decision:** The Public Sector framework introduces `Probity` (procurement/conflict-of-interest breach) as a new `category_tag`, on top of the `Safety`/`AssetLifecycle`/`SupplyChain` set added for Water/Energy. Exports using it carry `schema_version: "1.2"` (additive over `"1.1"`, same pattern as before — see `DECISIONS.md` #18).

**Why:** Procurement/probity risk is a distinct, well-understood category in public sector delivery (not a vague one-off), same bar applied to `Safety` for the infrastructure sectors. Two Public-Sector-specific items (FOI/Public Records, Accessibility) still route through `Other` rather than minting more new tags — reserving `Other` for genuinely narrow, less-recurring themes, and reserving a first-class tag for the theme that's central enough to appear twice.

**Trade-off:** This is now the 3rd schema_version bump (1.0 → 1.1 → 1.2), each additive. Confirms the extension mechanism is a repeatable pattern, not a one-off — but each new sector still requires an App 2 cost-model entry to avoid falling through to "Other" (see `dor-recovery-console`'s `DECISIONS.md`).

---

## 23. OPA/Rego policy export is real, runnable output — not illustrative text

**Decision:** `js/export/opaExport.js`'s `buildOpaPolicy(framework)` emits a syntactically valid Rego module targeting modern `rego.v1` syntax (`if`/`contains` keywords), with two `deny` rules: one for a BLOCKED gate decision derived from `input.overall_score` against the framework's own thresholds, one for any unresolved High-severity gap in `input.pillars[].gaps[]`. It's wired to a new "Export OPA/Rego Policy" button and is also what `.github/actions/dor-gate-check` (#27 below) runs directly in CI.

**Why:** The v2.0 PRD's "Executable NFR Policy-as-Code" module asked for policy that actually gates a pipeline, not a description of one. Generating real Rego — evaluable with `opa eval`/`conftest` as-is — keeps the claim honest without needing this app to run OPA itself (which would need a backend).

**Trade-off:** No OPA binary is available in this session to validate the generated syntax at test time; `tests/opaExport.test.js` asserts on string content (package name, threshold values, both `deny` rules present) rather than actually evaluating the policy. Flagged as a manual-verification step — run `opa eval` yourself, or exercise it via the GitHub Action (#27), before relying on it in a real pipeline.

---

## 24. Jira ticket content is generated for copy-paste, not written via Jira's API

**Decision:** `js/export/jiraExport.js` generates acceptance criteria (Gherkin-style, one per gap), edge-case test prompts (via a new `js/config/edgeCaseMap.js` category_tag lookup, same pattern as `interventionMap.js`), and Jira-label-safe tags, combined into one Jira-wiki-markup block (`buildJiraCopyBlock`). The new "Jira Ticket Content" panel shows this in a live, read-only textarea with a **Copy to Clipboard** button (`navigator.clipboard.writeText`, with a visible fallback message if the Clipboard API is unavailable) and a **Download .txt** option.

**Why:** The PRD's "auto-generates AC/edge-case/NFR tags directly inside Jira tickets" requires writing to Jira's REST API, which needs OAuth and a backend — a genuine architectural pivot this session explicitly deferred. Generating the same content and making it trivially paste-ready keeps the actual value (a human doesn't have to author these from scratch) without pretending this app has write access it doesn't have.

**Trade-off:** A human still has to open the ticket and paste — there's no write-back confirmation loop. Listed under the deferred backend-requiring roadmap (#28) as "Jira/ADO write-back."

---

## 25. AI Governance routing is a static 2×2 lookup, not a learned or configurable model

**Decision:** `js/engine/aiRouting.js`'s `routeAiDecision(determinism, complexity)` maps the 4 combinations of {High,Low} determinism × {High,Low} process complexity to one of 4 fixed quadrants (No AI/Deterministic, Standard Script, AI-Assisted/HITL, Pure AI Flow), each carrying guidance text and a `hitlRequired` flag. It's a standalone module with no interaction with the checklist/scoring engine — a routing decision doesn't depend on any one assessment's answers.

**Why:** The PRD's §5 module names the 4 quadrants but doesn't fully specify the guidance text per quadrant, so this is an authored, documented mapping (same discipline as the cost bands and rework-risk config) rather than an invented black box. Keeping it decoupled from the checklist means it can be used to think through a decision independently of whether a full DoR assessment is in progress.

**Trade-off:** Only 2 inputs, 2 levels each — a real governance decision may have more nuance than a 2×2 can capture. Deliberately kept simple to match what the PRD actually specified rather than inventing extra axes.

---

## 26. GitHub PR drift check is pull-on-demand, not passive/webhook-driven

**Decision:** `js/engine/prDriftCheck.js` splits into a pure `classifyChangedFiles(filenames)` (flags files matching schema/contract patterns — `**/schema/**`, `**/migrations/**`, `*.proto`, `package.json`, `*.sql`, OpenAPI/Swagger paths) and a thin `fetchPrFiles(owner, repo, number, token)` wrapper calling GitHub's REST API directly from the browser. The new "Check a GitHub Pull Request" section is user-triggered and its result is purely informational — never wired into the gate decision. An optional PAT is kept in a page-local variable only, explicitly labeled as not persisted.

**Why:** The PRD's "Passive Automation & Webhook Ingestion" and "Module 1 Passive Drift Engine" both require a backend to listen for webhook events — genuinely out of scope for a static app. A user-initiated pull against a specific PR gets the useful part (flagging schema/contract risk) without the always-on listening infrastructure.

**Trade-off:** Only catches drift when someone remembers to check a specific PR, not automatically on every push — the honest cost of staying static. This session's own outbound network policy may block `fetch()` calls to `api.github.com` from a page context (a different path from the MCP tool's own GitHub access, which does work); `classifyChangedFiles` has full unit test coverage, `fetchPrFiles` has a mocked-fetch test, and real connectivity is called out in the README as needing manual verification in your own browser.

---

## 27. The OPA policy is also wrapped as a real, opt-in GitHub Action

**Decision:** `.github/actions/dor-gate-check/action.yml` is a composite action using `open-policy-agent/setup-opa@v2` that runs `opa eval --fail-defined` against a policy file (from #23) and a dor-gatekeeper JSON export, failing the CI step if any `deny` rule fires. It's published in this repo for other repos to reference (`uses: pribalky/dor-gatekeeper/.github/actions/dor-gate-check@main`), not something this app hosts or triggers itself.

**Why:** This is the honest version of "blocks non-compliant merges" the PRD describes — real and runnable, but opt-in per consuming repo's own CI, since this static app has no way to intercept another repo's pipeline itself.

**Trade-off:** Requires the consuming repo to have both the Rego policy and the JSON export as CI artifacts already — this action doesn't generate them, it only evaluates them. Documented in the README's "Using this in your own CI" section.

---

## 28. V2.0 items deliberately deferred — require a backend

**Decision:** The following PRD v2.0 features are documented here rather than built, because each requires infrastructure this project's `DECISIONS.md` #8/#10 deliberately excludes (a backend, a database, or an OAuth app):

- **Passive webhook ingestion** (auto-triggered on push/PR, not user-initiated) — needs a server to receive and process webhook events; #26 above ships the pull-based equivalent instead.
- **Passive drift detection running continuously** — same webhook dependency as above, plus somewhere to persist "what changed since last check" state across sessions.
- **Jira/ADO write-back** (actually creating/updating tickets via API, not just generating paste-ready content) — needs OAuth credentials and a server to hold them; #24 above ships the copy-paste equivalent instead.
- **Auto-revert / auto-schedule / auto-ticket actions** — any action taken *on the user's behalf* against an external system needs stored, refreshable credentials and an audit trail of what the automation did — a database, not a static page.
- **Real static/dynamic code analysis for Blast-Radius / Resource Boundary profiling** — needs to actually clone and parse a target repo's source, which means compute beyond a browser tab and almost certainly a backend to run it on.
- **Multi-tenancy** — every user of this app today gets their own local, in-memory session; supporting multiple organizations/teams with isolated data needs a database and auth, both explicitly out of scope (`DECISIONS.md` #8, #10).
- **Persistent cross-session team dashboards** — requires storing assessments across sessions/users somewhere durable, i.e. a database.
- **Closed-loop self-tuning of DoR weights** — requires collecting outcome data across many assessments over time and a place to store/train on it — meaningless for a single-session, no-persistence app.

**Why:** Building any of these "lite" inside a static app would mean silently faking a capability (a fake webhook listener, a fake write-back that doesn't actually write) — worse than not building it, since it would mislead a user about what actually happened. Documenting the gap honestly, with a one-line reason each, matches the transparency already established for no-auth/no-DB/no-CI-CD (#8, #9) rather than quietly scope-creeping into a different architecture.

**Trade-off:** None of the above ships. If real usage demands any of these, it's a deliberate architectural decision to add a backend — not something to bolt onto the static app piecemeal.

---

## 29. AI Feasibility & Risk Delta Engine extends the AI Governance Router in place, and outputs a categorical verdict, not an invented score

**Decision:** The AI Feasibility & Risk Delta Engine — proposed as a hazard-flagging, ADR-generating extension of the AI Governance Router — was built as literal extension of that existing panel rather than a second, parallel module: the same `#ai-determinism`/`#ai-complexity` selects that already drive `routeAiDecision()` (`js/engine/aiRouting.js`) now also feed the new hazard evaluation, so there's one intake, not two that could disagree. 3 new selects (Data Sensitivity, Integration Target, Latency & Cost Budget) were added to the same panel. Hazard detection (`js/config/aiHazardRules.js` + `js/engine/aiFeasibility.js`'s `evaluateHazards`) is a declarative array of `{ match, severity, flag, guidance }` rule objects, matched by simple equality — the same lookup-table discipline as `edgeCaseMap.js` and the companion app's `interventionMap.js`/`nfrGatewayMap.js`, not inline if/else logic. The result is a 3-tier categorical verdict — `PROCEED` / `PROCEED WITH CONDITIONS` / `RECONSIDER APPROACH` (`deriveFeasibilityVerdict`) — not the 0–100% score originally proposed.

**Why:** The original proposal's "Model Type" intake (Deterministic Script vs. Probabilistic LLM) is the same underlying question as the Determinism axis `routeAiDecision` already answers — building a second dropdown for it would let the page show two different opinions on "should this be AI at all" depending on which panel a user filled in. Reusing the existing state avoids that entirely. On the score: this repo has consistently rejected fabricated numeric precision without a defined formula behind it (`GATE_THRESHOLDS`, `classifyReworkTier` in the companion app, `computeReworkRiskScore`'s severity-point sum) — a feasibility "score" invented with no stated formula would break that discipline and mislead a reader into treating an illustrative number as measured fact.

**Trade-off:** The panel now carries 5 inputs instead of 2, and the hazard rule table currently has 4 entries — deliberately small and named, not an attempt at exhaustive OWASP LLM Top 10 coverage. New rules are additive (append to `HAZARD_RULES`) and each is independently unit-tested, so growing this table doesn't risk regressing existing ones.

---

## 30. Visual/structural redesign: Ledger identity + Tabbed Spread layout, chosen by direct comparison, not by decree

**Decision:** The app was re-themed to "Ledger" (warm ivory paper, ink-navy/oxblood accents, `IBMPlexSerif`/`InstrumentSans`/`IBMPlexMono`, ruled rows, double-rule stamped badges) and restructured to "Tabbed Spread": a persistent sticky `<aside>` (gate badge, score panel, checklist-level exports) alongside a `<main>` tab bar with 5 panes (Assessment, Gap Analysis, Jira Ticket Content, AI Governance & Feasibility, GitHub PR Check). Both were arrived at by building real, interactive comparison artifacts (4 visual directions, then 5 layout directions applied to the *chosen* visual direction) rather than picking from static mockup images or a single proposal — the user directly compared working HTML/CSS before confirming either choice, and the Tabbed Spread option itself is a combination the user requested after comparing the other 4 layouts, not one of the original menu.

Every existing element `id` was preserved through the restructuring — `app.js`'s `getElementById` lookups needed zero changes; only DOM ancestry, CSS, and one small new tab-switching module changed. Checklist Yes/Partial/No stayed real `<input type="radio">` elements (re-skinned via `:has(input:checked)`, never replaced with non-native controls) to keep keyboard/screen-reader navigation intact. Tabs use proper `role="tablist"/"tab"/"tabpanel"`, `aria-selected`, and Left/Right arrow-key roving focus.

Fonts are shipped as real `.ttf` files under `assets/fonts/` (own copy per repo, matching the existing decoupling discipline used for `tests/assert.js`), referenced via ordinary `@font-face { src: url(...) }` — not inlined as base64, which was a technique specific to the comparison artifacts' single-file portability requirement and would be pure waste in a real shipped stylesheet.

**Why:** The prior visual treatment was functional but never actually decided on — it was whatever came out of the first scaffold and just accumulated new panels over every subsequent delta. Comparing real, interactive options (not descriptions of options) let the actual decision-maker judge type pairing, density, and information architecture directly against real app content, rather than approving a written pitch.

**Trade-off:** This was a large single-purpose commit touching almost every file in the app, deliberately kept free of *any* new feature/logic changes (see #31 for what was added immediately after) so a regression could only be structural/visual, not behavioral — verified by the unchanged 190-test suite plus a full headless-browser click-through of every pre-existing feature through the new shell.

---

## 31. Gap Analysis Breakdown only reflects answered items — "unanswered" was never a real gap

**Decision:** `js/engine/gaps.js`'s `deriveGaps` now includes an item only when its answer is exactly `"partial"` or `"no"` — previously it included anything that wasn't `"yes"`, meaning an unanswered item (the default state of every item on page load or reset) was also pushed in as a gap with `answer: "unanswered"`. A fresh assessment now shows an empty Gap Analysis Breakdown, as it should, instead of all 25 items flagged as failed before anyone has touched the checklist.

**Why:** "Unanswered" and "answered No" are not the same claim — one says a criterion failed, the other says nobody has looked at it yet. Collapsing them meant the panel's real signal (what's actually wrong) was drowned out by noise (what's simply not done yet) for the entire time a user is working through the checklist. `validation.js`'s `unansweredItemIds`/`validateReadyForExport` already independently blocks export while items remain unanswered — that check was never entangled with `deriveGaps`, so this fix is additive and isolated.

**Trade-off:** None found — `gap.answer` is an App 1-internal/UI field (`jsonExport.js` never exports it, confirmed by re-reading the export builder), so narrowing its possible values from `{"partial", "no", "unanswered"}` to `{"partial", "no"}` has no downstream contract impact.

---

## 32. MCP & Agentic Security hazard rules are a declaration + flag, not runtime interception

**Decision:** The AI Governance & Feasibility Router gained a 6th input, "Agentic Tool Access" (`none` / `read-only-mcp` / `read-write-mcp`), and 2 new declarative rules in `aiHazardRules.js`: mutating MCP tool access always flags High ("Confused Deputy / Tool Poisoning Hazard (MCP)" — requires an HITL approval gate before any write); read-only MCP access combined with a probabilistic/low-determinism model flags Med ("Unvalidated Tool Output Risk").

**Why:** The originating request asked this app to "detect" confused-deputy/tool-poisoning attacks. It can't — there's no running agent or tool call for a static, client-side page to observe. What it can honestly do is what every other rule in this table already does: ask the assessor to declare a property of the proposed design and flag the known hazard class if so. Framed as governance intake, not security telemetry — the same honesty discipline already applied to the PR drift check (`DECISIONS.md` #26, informational only) and the OPA export (a real policy, not a simulated one).

**Trade-off:** A dishonest or uninformed answer to "Agentic Tool Access" produces no flag — this is a self-reported checklist item like every other input in this router, not a control that can verify the claim.

---

## 33. ADR + Policy-as-Code bundles: one click, two files, no new Rego logic beyond what already existed

**Decision:** Two new "Export ADR + Policy Bundle" actions were added, each downloading two files from one click. At the checklist level (new `js/export/checklistAdr.js`, `buildChecklistAdr`): a Status/Context/Decision/Consequences ADR (this app had no checklist-level ADR export before — only the Markdown audit report) paired with the *existing* `buildOpaPolicy` Rego export (`opaExport.js`, unchanged). On the AI Governance & Feasibility panel: the existing AI Feasibility ADR export is now paired with a new, small Rego snippet (`buildAiFeasibilityRego`, `aiFeasibilityAdr.js`) — a single `deny` rule firing on a `RECONSIDER APPROACH` verdict, plus one `deny` rule per triggered High-severity hazard.

**Why:** The two ADR builders intentionally don't share a helper beyond `slugify` — a checklist ADR is about pillar/gap data, an AI feasibility ADR is about router inputs/hazards, and forcing a shared abstraction over two genuinely different data shapes would be premature generalization for two call sites. The AI Feasibility Rego snippet is deliberately minimal (verdict + per-High-hazard messages) rather than a general-purpose policy language over the hazard rule table — proving the verdict can gate a pipeline, not building a second OPA compiler.

**Trade-off:** Two files downloading from one click has no user-facing progress/confirmation beyond the browser's own download UI — acceptable for a low-frequency governance action, not something a high-frequency workflow would want.

---

## 34. State Sync Bridge (gatekeeper side): a relabeled export, not a new format — and not `dor-core`

**Decision:** "Export Gatekeeper Baseline" reuses `buildJsonExport` exactly as the existing "Export JSON" button does; the only new code is a filename helper (`exportFilenameBaseline`, `_dor_baseline.json` suffix) so the file is recognizable as a snapshot meant for later comparison on the `dor-recovery-console` side (see that repo's `DECISIONS.md` for the receiving "Baseline Drift" tab).

**Why:** The originating pitch named this a `dor-core` JSON schema export implying a shared library between the two repos, and described the sync as "real-time." Neither is accurate: the JSON shape is already the existing, versioned App 1→App 2 contract (`DECISIONS.md` #2, #16-19) — a second export format would fork that contract for no reason — and there is no live channel between two static pages, only two files a person moves between them on their own schedule. Both corrections are made explicit here rather than silently building something that overclaims.

**Trade-off:** None — this is the smallest possible implementation of the confirmed scope, by design.

---

## 35. `portal.html` presents the two apps as one product without merging their repos

**Decision:** A new `portal.html`, sibling to `index.html`, is a persona-routed landing page ("Strategy-to-Execution Control Plane") with 3 cards — Squad Engineer/BA, Tech Lead/Architect, CXO/Board — each a direct link into a populated, pre-selected view of one of the two apps (via the new `?sample=&framework=#tab=` deep-linking, `js/engine/deepLink.js` — same shape and discipline as `dor-recovery-console`'s own `deepLink.js`/`DECISIONS.md` #31, independent copy per #1–2). This is the chosen alternative to a literal single-repo merge: both apps keep their own repo, tests, and live URL; `portal.html` is the only new surface, reusing every existing handler (`switchFramework`, `loadSample`, `switchTab`) rather than introducing new state or a router.

**Why:** A genuine PRD-style pitch for "one unified app" was assessed against a literal repo merge (Option A) and this persona-shell approach (Option B). The merge would have reversed `DECISIONS.md` #1–2's deliberate two-repo decoupling for a large one-time migration cost, and broken both existing live URLs. The persona shell delivers the same experience a visitor actually has — one front door, landing on relevant, populated content per role — without touching either app's architecture.

**Trade-off:** Not literally "one app" under the hood — still two repos, two deploys, two test suites. Considered the right trade for the cost/benefit; revisit only if a real technical reason (not narrative alone) requires a true merge.

---

## 36. Closed-loop threshold suggestions read `dor-recovery-console`'s signals via shared-origin `localStorage` — advisory only, never auto-applied

**Decision:** This app now reads the same `dor:reworkSignals` key that `dor-recovery-console` writes (see that repo's `DECISIONS.md` #33) — a capped array of `{ pillar_name, category_tag, severity_gov, tier, timestamp }` recorded there whenever a loaded assessment classifies as Medium/High rework risk. New pure `js/engine/thresholdSuggestions.js`, `deriveThresholdSuggestions(signals, minOccurrences = 3)`, counts occurrences per `pillar_name` and returns any pillar at or above the threshold, most-frequent first. On `init()`, if any suggestions exist, a dismissible banner renders above the assessment: *"`{pillar_name}` has driven Medium/High rework risk in {n} recent assessments (via dor-recovery-console) — consider tightening this pillar's checklist or weight."* Dismissing a suggestion only hides it for the current page load — it is not written back to storage, so a fresh load re-evaluates from scratch.

**Why:** `dor-gatekeeper` and `dor-recovery-console` are both served under `pribalky.github.io/<repo>/` — same protocol+host+port, so same browser origin, so `localStorage` written by one page is directly readable by the other with zero backend. That fact makes a *genuine* (not merely narrative) closed loop possible: gaps this app approved that later caused real rework in the Console can visibly nudge the next assessor here. The banner is read-only guidance — it never mutates `FRAMEWORKS`, item weights, or scoring — the same "reference, not auto-applied" discipline already used for the AI hazard rules (#32) and the remediation-pathway reference table in the Console. `localStorage` access is wrapped in try/catch, degrading to no banner if storage is unavailable (private browsing, disabled storage), consistent with this app's existing fail-gracefully discipline.

**Trade-off:** This is genuinely scoped to one person's one browser, not an org-wide or cross-device closed loop — clearing browser storage, using a different browser, or a different assessor entirely all silently reset the signal history. Explicitly not a walk-back of the "no persistent database" position (`DECISIONS.md` #8/#10): it's a narrow, documented, advisory-only exception, and the first client-side persistence either app has used.
