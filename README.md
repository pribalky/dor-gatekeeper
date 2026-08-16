# DoR Gatekeeper

**🔗 Live app: [pribalky.github.io/dor-gatekeeper](https://pribalky.github.io/dor-gatekeeper/)**

A Definition-of-Ready governance gate: a weighted checklist across 5 transformation pillars that produces a score, an APPROVED/CONDITIONAL/BLOCKED decision, and a list of gaps to remediate — before a feature, AI integration, or architecture change gets committed to.

Fully static. **No backend, no database, no build step, no `npm install`.** Plain HTML/CSS/JavaScript (ES modules), runs entirely in the browser, deploys straight to GitHub Pages.

Companion app: **[`dor-recovery-console`](https://github.com/pribalky/dor-recovery-console)** — ingests this app's JSON export for anything that comes back CONDITIONAL/BLOCKED and adds financial exposure modeling, RAID tracking, and executive reporting. This app never does that job; see [Out of Scope](#out-of-scope).

---

## Quick start

```bash
git clone https://github.com/pribalky/dor-gatekeeper.git
cd dor-gatekeeper
python3 -m http.server 8000   # any static file server works
```

Open `http://localhost:8000/`. That's the whole setup — no install step exists.

```bash
node tests/run.js   # run the test suite (no npm install needed)
```

Requires only a modern browser (ES modules, `<dialog>`-free) and Node.js ≥ 18 for the test runner. Opening `index.html` directly via `file://` will **not** work — ES module imports require an HTTP origin.

---

## How it works

```
[ User Inputs / Checklist ] ──► [ Weighted Scoring Engine ] ──► [ Risk Classifier & Decision ]
                                                                       │
                          ┌───────────────┬────────────────┬──────────┴─────────┬──────────────────┐
                          ▼               ▼                ▼                    ▼                  ▼
                  [ Gap Analysis ]  [ JSON → App 2 ]  [ Markdown Report ]  [ OPA/Rego Policy ]  [ Jira Content ]
```

Everything — scoring, gap derivation, every export — runs client-side against a single in-memory assessment state (`js/state.js`). No network calls except the optional, user-triggered GitHub PR check. Nothing persists beyond what you explicitly export.

A **framework** (`js/config/criteria.js`) is a swappable sector preset: 5 pillars × 5 checklist items each, plus sample fixtures. Four ship today (Financial Services baseline, Water, Energy, Public Sector/Healthcare) but the scoring/export/UI code has no sector-specific logic — it's entirely driven by whichever framework is selected. See [Core concepts](#core-concepts) and [Extending this app](#extending-this-app) before adding a 5th.

The page itself is a **"Tabbed Spread"** layout: a persistent sticky `<aside>` (gate badge, score panel, every checklist-level export) beside a `<main>` tab bar (Assessment, Gap Analysis, Jira Ticket Content, AI Governance & Feasibility, GitHub PR Check) — visually themed as **"Ledger"** (warm paper, ink-navy/oxblood, `IBMPlexSerif`/`InstrumentSans`/`IBMPlexMono`). Both were picked by direct comparison against interactive artifacts, not a written proposal — see `DECISIONS.md` #30.

---

## Project structure

```
dor-gatekeeper/
├── index.html                        # single-page app shell (Tabbed Spread: aside + tab-nav/tab-panels)
├── assets/css/styles.css             # all styling — Ledger design tokens + @font-face
├── assets/fonts/                     # IBMPlexSerif/InstrumentSans/IBMPlexMono, Regular+Bold each
├── .github/actions/dor-gate-check/
│   └── action.yml                    # composite GitHub Action wrapping `opa eval` for CI use
├── js/
│   ├── app.js                        # entry point — wires state, DOM, and every event listener
│   ├── state.js                      # in-memory assessment state factory
│   ├── config/
│   │   ├── criteria.js               # FRAMEWORKS: 4 presets, each 5 pillars × 5 items + samples
│   │   ├── edgeCaseMap.js            # category_tag → edge-case test prompt (used by jiraExport.js)
│   │   └── aiHazardRules.js          # declarative { match, severity, flag, guidance } hazard rules
│   ├── engine/
│   │   ├── scoring.js                # pure: pillar score, overall score, gate decision
│   │   ├── gaps.js                   # derives the gap list from answers + criteria config
│   │   ├── aiRouting.js              # AI Governance 2×2 router (determinism × process complexity)
│   │   ├── aiFeasibility.js          # evaluates aiHazardRules.js + derives the feasibility verdict
│   │   └── prDriftCheck.js           # classifies a GitHub PR's changed files for schema/contract risk
│   ├── export/
│   │   ├── jsonExport.js             # App 2 handoff export (schema_version 1.0/1.1/1.2) + baseline filename
│   │   ├── markdownExport.js         # human-readable audit report
│   │   ├── opaExport.js              # runnable OPA/Rego policy for the active framework
│   │   ├── jiraExport.js             # Jira-paste-ready acceptance criteria / edge cases / labels
│   │   ├── checklistAdr.js           # checklist-level ADR (Status/Context/Decision/Consequences)
│   │   └── aiFeasibilityAdr.js       # AI Feasibility ADR + a small Rego policy snippet
│   └── ui/
│       ├── validation.js             # feature-name required, all-items-answered check
│       └── render.js                 # renders checklist, score panel, gap list, errors
├── tests/
│   ├── assert.js                     # ~30-line zero-dependency assertion helper
│   ├── scoring.test.js               # weight aggregation + gate threshold boundaries
│   ├── gaps.test.js                  # deriveGaps: only partial/no answers become gaps
│   ├── export.test.js                # JSON schema shape + Markdown content checks
│   ├── opaExport.test.js             # Rego policy content checks
│   ├── jiraExport.test.js            # acceptance criteria / edge cases / labels / copy block
│   ├── checklistAdr.test.js          # checklist-level ADR section content
│   ├── aiRouting.test.js             # all 4 quadrants of the AI Governance router
│   ├── aiFeasibility.test.js         # hazard rule triggers, verdict tiers, ADR + Rego export content
│   ├── prDriftCheck.test.js          # file classification + mocked-fetch network path
│   └── run.js                        # runs every *.test.js, exits non-zero on failure
├── DECISIONS.md                      # why things are built this way (shared with App 2)
└── README.md                         # you are here
```

**Rule of thumb for where new code goes:** `config/` is data (no logic, no DOM), `engine/` is pure functions over that data (no DOM), `export/` turns engine output into a downloadable string, `ui/` is the only layer allowed to touch the DOM. `app.js` is the sole place that wires them together.

---

## Core concepts

| Concept | Shape | Where |
|---|---|---|
| **Framework** | `{ id, label, schemaVersion, pillars, samples }` | `FRAMEWORKS` array in `criteria.js` |
| **Pillar** | `{ id, name, weight, items }` — 5 pillars per framework, weights sum to `1` | inside each framework |
| **Item** | `{ id, label, severity_gov, category_tag, category_tag_freetext?, remediation }` | 5 items per pillar |
| **Answer** | `"yes" \| "partial" \| "no"`, keyed by item `id` | `state.answers` |
| **Gap** | Derived: one per item explicitly answered `"partial"` or `"no"` — an unanswered item is not yet a gap, so the panel starts empty (`DECISIONS.md` #31) | `deriveGaps()` in `engine/gaps.js` |

**Scoring** (`engine/scoring.js`): `yes` = 20 points, `partial` = 10, `no` = 0 (`ANSWER_POINTS`). Pillar score = earned ÷ max × 100. Overall score = Σ(pillar score × pillar weight). Gate decision (`GATE_THRESHOLDS`): **≥85 APPROVED**, **≥65 CONDITIONAL**, **else BLOCKED**.

**`severity_gov` and `category_tag` are the data contract with App 2** — set once per checklist item and never mutated downstream (see `DECISIONS.md` #3–#4). `category_tag` is a closed enum; anything that doesn't fit uses `"Other"` + a required `category_tag_freetext`. Every sector preset shares the same 5-pillar taxonomy and scoring mechanics — only the *content* differs.

---

## Features

**Assessment & scoring**
- 4 selectable sector frameworks (Financial Services, Water, Energy, Public Sector/Healthcare) — same taxonomy, different content and `schema_version`.
- 7 bundled sample assessments (4 spanning the full gate range for baseline, 1 representative "Good" sample each for Water/Energy/Public Sector), provably correct — asserted directly in the test suite, not just UI demos.

**Exports** (aside — always visible, next to the score/gate)
- **JSON** — the App 2 handoff contract.
- **Markdown** — human-readable audit report.
- **OPA/Rego policy** — a real, `opa eval`-runnable policy per framework; denies on a BLOCKED gate or any unresolved High-severity gap.
- **ADR + Policy Bundle** — a checklist-level ADR (Status/Context/Decision/Consequences) paired 1-click with the OPA/Rego export above.
- **Gatekeeper Baseline** — the same JSON export, relabeled/refiled (`_dor_baseline.json`) as a snapshot for `dor-recovery-console`'s Baseline Drift comparison (State Sync Bridge — `DECISIONS.md` #34).
- **Jira ticket content** (its own tab) — live-generated acceptance criteria, edge cases, and labels in one paste-ready block (copy-to-clipboard or `.txt` download); this app never writes to Jira's API directly.

**Standalone tools** (decoupled from the checklist — usable independently)
- **AI Governance & Feasibility Router** — a 2×2 lookup (Determinism × Process Complexity) returns a governance quadrant + HITL guidance; 4 more inputs (Data Sensitivity, Integration Target, Latency & Cost Budget, Agentic Tool Access) run against a declarative hazard-rule table (OWASP LLM-style flags, e.g. regulated data + an external LLM API → Data Leakage Risk; mutating MCP tool access → Confused Deputy / Tool Poisoning Hazard, `DECISIONS.md` #32) to produce a categorical feasibility verdict — **PROCEED** / **PROCEED WITH CONDITIONS** / **RECONSIDER APPROACH**, never an invented percentage score. One-click **Export ADR + Policy Bundle** turns the inputs, quadrant, and any triggered flags into an ADR plus a small Rego snippet that denies on `RECONSIDER APPROACH`.
- **GitHub PR drift check** — paste a PR's owner/repo/number to flag changed files matching schema/contract patterns. Informational only, not wired into the gate decision. Requires your browser to reach `api.github.com`.

**CI integration**
- `.github/actions/dor-gate-check` — a composite Action that runs the exported Rego policy via `opa eval --fail-defined` against a dor-gatekeeper JSON export, failing the step on any denial:

  ```yaml
  - uses: pribalky/dor-gatekeeper/.github/actions/dor-gate-check@main
    with:
      policy-file: dor-policy.rego
      input-file: dor-export.json
  ```

  Both files must already exist as artifacts in your pipeline — the action evaluates them, it doesn't generate them.

---

## Extending this app

### Add a new sector framework
1. In `js/config/criteria.js`, define `const YOUR_SECTOR_PILLARS = [...]` — exactly 5 pillar objects (`id`, `name`, `weight`, `items`), weights summing to `1`, 5 items per pillar (see [Core concepts](#core-concepts) for the item shape).
2. Define `const YOUR_SECTOR_SAMPLES = [...]` — 1 or more fixtures, each `{ id, label, feature_name, answers: { <item_id>: "yes"|"partial"|"no", ... } }` covering every item.
3. Register both in the `FRAMEWORKS` array: `{ id, label, schemaVersion, pillars: YOUR_SECTOR_PILLARS, samples: YOUR_SECTOR_SAMPLES }`. Reuse the current `schemaVersion` unless you're also introducing a new `category_tag` (see below).
4. That's it — `app.js` populates the framework/sample dropdowns from `FRAMEWORKS` automatically, and `tests/scoring.test.js`/`export.test.js` are parametrized over every entry in `FRAMEWORKS`, so your new framework is tested the moment it's registered.

### Introduce a new `category_tag`
`category_tag` is a closed enum shared with `dor-recovery-console` — a value used here that App 2 doesn't recognise gets the export **rejected**, not silently ignored.
1. Use the new tag on the relevant item(s) in `criteria.js`.
2. Bump that framework's `schemaVersion` to the next value — additive only, never reused or broken (`DECISIONS.md` #17–#19).
3. In `dor-recovery-console`: add the tag to `js/config/costModel.js`'s `CATEGORY_COST_MODEL`, add the new `schemaVersion` to `SUPPORTED_SCHEMA_VERSIONS` in `js/ingestion/validate.js`, and (optionally, if relevant) `nfrGatewayMap.js` / `raidTypeMap.js` / `interventionMap.js`.
4. If you're not sure a new tag is warranted, use `category_tag: "Other"` with a `category_tag_freetext` instead — no schema bump required.

### Add a new export format
Follow the pattern in `js/export/*.js`: a pure `buildXyz(framework, state, ...)` returning a string, plus `exportFilenameXyz(featureName, assessmentId)` (reuse `slugify` from `jsonExport.js`). Wire the button into `index.html` and call `downloadFile(...)` from `app.js`. Add `tests/xyzExport.test.js` asserting on the string content, then import it from `tests/run.js`.

### Add a new standalone tool
`aiRouting.js` and `prDriftCheck.js` are both pure, self-contained modules with their own UI section — neither touches the checklist, scoring engine, or gate decision. Follow that pattern unless your tool genuinely needs assessment data; keeping tools decoupled means they stay independently testable and can't accidentally change the gate outcome.

---

## Testing

```bash
node tests/run.js
```

Zero-dependency custom runner (`tests/assert.js` + `tests/run.js`) — no Jest/Vitest, so there's still no `npm install`. Every `*.test.js` in `tests/` is imported by `run.js`; add new ones there. Tests that touch `FRAMEWORKS` iterate over the array rather than hardcoding a framework, so new frameworks are covered automatically.

---

## Deploying to GitHub Pages

No build step, so no Actions workflow is required for the app itself:

1. Push to `main`.
2. Repo Settings → Pages → **Deploy from a branch** → branch `main`, folder `/ (root)`.
3. Save. Live at `https://<owner>.github.io/dor-gatekeeper/` within a minute or two.

`.nojekyll` is included so GitHub Pages serves `js/`/`assets/` as-is without Jekyll processing.

---

## Data contract (App 2 handoff)

"Export JSON" produces `{feature-name-slug}_{assessment_id}_dor_export.json`:

```json
{
  "schema_version": "1.0",
  "assessment_id": "…",
  "assessment_date": "…",
  "feature_name": "…",
  "overall_score": 82.5,
  "gate_decision": "CONDITIONAL",
  "pillars": [
    {
      "pillar_name": "…",
      "pillar_score": 70,
      "gaps": [
        { "gap_id": "…", "description": "…", "severity_gov": "High", "category_tag": "PII" }
      ]
    }
  ]
}
```

`schema_version` is `"1.0"` for the baseline framework, `"1.1"`/`"1.2"` for presets using the extended `category_tag` enum — always additive, never breaking (`DECISIONS.md`). This is a versioned file export, not a shared database or live API, by design.

---

## Related docs

- **`DECISIONS.md`** — the "why," including trade-offs, for every non-obvious choice in this repo (numbered, cross-referenced with App 2).
- **[`dor-recovery-console`](https://github.com/pribalky/dor-recovery-console)** — the companion app this one hands off to.

## Out of scope

Auth/SSO, a persistent database, multi-tenancy, a hosted CI/CD pipeline, and financial modeling/RAID/executive reporting — the last of those is `dor-recovery-console`'s job. See `DECISIONS.md`'s roadmap entry for the full list of PRD items deliberately deferred because they require a backend.
