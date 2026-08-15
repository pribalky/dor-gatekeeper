# DoR Gatekeeper

**🔗 Live app: [pribalky.github.io/dor-gatekeeper](https://pribalky.github.io/dor-gatekeeper/)**

An interactive, lightweight Target Operating Model / Definition of Ready gate — evaluated across 5 transformation pillars before commitment. Ships with 4 selectable assessment frameworks: a Banking/Financial Services baseline, two Regulated Infrastructure presets (Water Asset Transformation, Energy Grid Operating Model), and Public Sector.

Fully static. No backend, no build step, no npm install. Runs entirely in the browser and deploys straight to GitHub Pages.

Companion tool: [`dor-recovery-console`](https://github.com/pribalky/dor-recovery-console) (Delivery Recovery & Governance Console) ingests this app's JSON export for programs that come back CONDITIONAL/BLOCKED.

---

## Architecture

```
[ User Inputs / Checklist ] ──► [ Weighted Scoring Engine ] ──► [ Risk Classifier & Decision ]
                                                                       │
                                              ┌────────────────────────┴────────────────────────┐
                                              ▼                                                   ▼
                                  [ Markdown Audit Report ]                          [ JSON Export → App 2 ]
```

Everything — scoring, gap derivation, both exports — runs client-side against a single in-memory assessment state. No network calls, no server, nothing persisted beyond what you explicitly export.

## Folder Structure

```
dor-gatekeeper/
├── index.html                  # single-page app shell
├── assets/css/styles.css       # all styling
├── js/
│   ├── app.js                   # entry point: wires state + DOM + event listeners
│   ├── state.js                 # in-memory assessment state factory
│   ├── config/
│   │   └── criteria.js          # FRAMEWORKS: 4 presets, each 5 pillars/weights/25 items + samples
│   ├── engine/
│   │   ├── scoring.js           # pure functions: pillar score, overall score, gate decision
│   │   └── gaps.js              # derives the gap list from answers + criteria config
│   ├── export/
│   │   ├── jsonExport.js        # builds the export (schema_version 1.0/1.1/1.2, per active framework)
│   │   ├── markdownExport.js    # builds the human-readable audit report
│   │   ├── opaExport.js         # builds a runnable OPA/Rego policy from the active framework
│   │   └── jiraExport.js        # builds Jira-paste-ready acceptance criteria / edge cases / labels
│   ├── config/
│   │   └── edgeCaseMap.js       # category_tag → edge-case test prompt, used by jiraExport.js
│   ├── engine/ (continued)
│   │   ├── aiRouting.js         # AI Governance 2×2 router (determinism × process complexity)
│   │   └── prDriftCheck.js      # classifies a GitHub PR's changed files for schema/contract risk
│   └── ui/
│       ├── validation.js        # feature-name required, all-items-answered check
│       └── render.js            # renders checklist, score panel, gap list, errors
├── tests/
│   ├── assert.js                 # ~30-line zero-dependency assertion helper
│   ├── scoring.test.js           # weight aggregation + gate threshold boundaries
│   ├── export.test.js            # JSON schema shape + Markdown content checks
│   ├── opaExport.test.js         # Rego policy content checks (package, thresholds, deny rules)
│   ├── jiraExport.test.js        # acceptance criteria / edge cases / labels / copy block content
│   ├── aiRouting.test.js         # all 4 quadrants of the AI Governance router
│   ├── prDriftCheck.test.js      # file classification (full coverage) + mocked-fetch network path
│   └── run.js                    # runs all *.test.js, exits non-zero on failure
├── .github/actions/dor-gate-check/action.yml  # composite Action wrapping opa eval for CI use
├── DECISIONS.md                 # shared rationale doc (cross-referenced with App 2)
└── README.md
```

## The Assessment

Every framework shares the same 5-pillar taxonomy, 25 checklist items (5 per pillar, each answered Yes / Partial / No), and scoring mechanics — only the *content* (weights, item wording, `category_tag` usage) changes per framework:

| Pillar |
|---|
| People & Capability |
| Process & Workflow |
| Data & Integration |
| Technology & Infrastructure |
| Governance & Compliance |

Yes = full points, Partial = half, No = zero, within each pillar. Overall score is the weighted sum of pillar scores. Gate decision:

- **85–100 → APPROVED**
- **65–84 → CONDITIONAL**
- **&lt;65 → BLOCKED**

Any non-"Yes" answer becomes a gap, carrying that item's pre-assigned `severity_gov` and `category_tag` — both immutable downstream (see `DECISIONS.md` #3, #4). Full criteria list, remediation text, and rationale for the weight/threshold choices live in `js/config/criteria.js` and `DECISIONS.md`.

### Frameworks

The "Assessment framework / sector" dropdown switches between 4 presets, each defined in `js/config/criteria.js`'s `FRAMEWORKS`:

| Framework | Focus | `schema_version` |
|---|---|---|
| Banking / Financial Services (baseline) | Software features, AI integrations, architecture changes | `1.0` |
| Regulated Infrastructure — Water Asset Transformation | Regulatory compliance & capital delivery readiness | `1.1` |
| Regulated Infrastructure — Energy Grid Operating Model | Capability mapping & cross-agency governance | `1.1` |
| Public Sector | Procurement/probity, FOI, ministerial risk, citizen services | `1.2` |

Each sector preset extends the `category_tag` enum with themes the original 8 tags don't honestly cover, additively, via a `schema_version` bump App 2 accepts alongside every prior version: Water/Energy add `Safety`, `AssetLifecycle`, `SupplyChain` (`"1.1"`); Public Sector adds `Probity` (`"1.2"`) — an extension of the schema per its own documented extensibility clause (PRD §7), not a breaking change. See `DECISIONS.md` #17–19, #21–22.

### Sample assessments

The baseline framework's "load a sample assessment" dropdown offers 4 fixtures spanning the full gate range — **Best** (fully ready), **Good** (minor gaps only), **Intentionally Off** (borderline/conditional), **Very Bad** (not ready). Water, Energy, and Public Sector each offer 1 representative **Good** sample (see `DECISIONS.md` #20 for why the depth is asymmetric). None of these are just UI demos: they're defined once in `js/config/criteria.js` and imported directly by the test suite, which asserts each one gates to its documented decision.

### Additional exports and tools

Beyond JSON/Markdown, the assessment view offers:

- **Export OPA/Rego Policy** — a real, `opa eval`-runnable Rego module (`js/export/opaExport.js`) that denies on a BLOCKED gate decision or any unresolved High-severity gap. Pair it with the JSON export in your own CI, or use the bundled GitHub Action below.
- **Jira Ticket Content** — a live panel generating Gherkin-style acceptance criteria, edge-case test prompts, and Jira labels from the current gap list, in one Jira-wiki-markup block. Copy to clipboard or download as `.txt` — this app never writes to Jira's API directly (see `DECISIONS.md` #24).
- **AI Governance Router** — a standalone 2×2 lookup (Determinism × Process Complexity) returning one of 4 governance quadrants with guidance and a human-in-the-loop flag, independent of the checklist.
- **Check a GitHub Pull Request** — paste a PR's owner/repo/number (+ optional PAT, kept in-memory only) to flag changed files matching schema/contract patterns as a drift risk. Informational only, not wired into the gate decision. Requires your browser to reach `api.github.com` — some network policies block this.

### Using this in your own CI

`.github/actions/dor-gate-check` is a composite GitHub Action that installs OPA and runs `opa eval --fail-defined` against a policy file (from "Export OPA/Rego Policy" above) and a dor-gatekeeper JSON export, failing the step if any `deny` rule fires:

```yaml
- uses: pribalky/dor-gatekeeper/.github/actions/dor-gate-check@main
  with:
    policy-file: dor-policy.rego
    input-file: dor-export.json
```

Both `policy-file` and `input-file` must already be present in your repo/pipeline as artifacts — this action evaluates them, it doesn't generate them.

## Running Locally

ES module imports require an HTTP origin — opening `index.html` directly via `file://` will fail in Chrome/Firefox. Serve the folder with any static server, e.g.:

```bash
python3 -m http.server 8000
# then open http://localhost:8000/
```

## Running Tests

```bash
node tests/run.js
```

No `npm install` required — `package.json` only sets `"type": "module"` so Node's native ESM loader can import the same files the browser uses.

## Deploying to GitHub Pages

No build step, so no Actions workflow is required:

1. Push to `main`.
2. Repo Settings → Pages → **Deploy from a branch** → branch `main`, folder `/ (root)`.
3. Save. The app is live at `https://<owner>.github.io/dor-gatekeeper/` within a minute or two.

`.nojekyll` is included so GitHub Pages serves the `js/`/`assets/` folders as-is without Jekyll processing.

## Data Contract (App 2 Handoff)

"Export JSON" produces `{feature-name-slug}_{assessment_id}_dor_export.json` — the feature name leads so files stay recognizable in a downloads folder, with `assessment_id` kept in the name for stable tracking (see `DECISIONS.md` #16). The file content matches the schema App 2 ingests: `schema_version` (`"1.0"` baseline, `"1.1"`/`"1.2"` for the sector presets that use progressively extended `category_tag` enums), `assessment_id`, `assessment_date`, `feature_name`, `overall_score`, `gate_decision`, and `pillars[]` (each with `pillar_name`, `pillar_score`, and `gaps[]` carrying `gap_id`, `description`, `severity_gov`, `category_tag`, and `category_tag_freetext` when `category_tag` is `"Other"`). See `DECISIONS.md` for why this is a versioned file export rather than a shared database or live API.

## Out of Scope

Auth/SSO, persistent database, multi-tenant/concurrency handling, CI/CD pipeline/infra-as-code, financial modeling/RAID/exec reporting — the latter is `dor-recovery-console`'s job.
