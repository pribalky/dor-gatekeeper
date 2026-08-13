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
