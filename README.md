# DoR Gatekeeper

An interactive, lightweight Definition of Ready (DoR) gate for feature initiatives, AI integrations, and architecture change requests — evaluated across 5 governance pillars before sprint commitment.

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
│   │   └── criteria.js          # 5 pillars, weights, 25 checklist items, sample assessments
│   ├── engine/
│   │   ├── scoring.js           # pure functions: pillar score, overall score, gate decision
│   │   └── gaps.js              # derives the gap list from answers + criteria config
│   ├── export/
│   │   ├── jsonExport.js        # builds the PRD schema_version 1.0 export (App 2 contract)
│   │   └── markdownExport.js    # builds the human-readable audit report
│   └── ui/
│       ├── validation.js        # feature-name required, all-items-answered check
│       └── render.js            # renders checklist, score panel, gap list, errors
├── tests/
│   ├── assert.js                 # ~30-line zero-dependency assertion helper
│   ├── scoring.test.js           # weight aggregation + gate threshold boundaries
│   ├── export.test.js            # JSON schema shape + Markdown content checks
│   └── run.js                    # runs all *.test.js, exits non-zero on failure
├── DECISIONS.md                 # shared rationale doc (cross-referenced with App 2)
└── README.md
```

## The Assessment

5 pillars, 5 fixed checklist items each (25 total), each item answered Yes / Partial / No:

| Pillar | Weight |
|---|---|
| Architectural & Data Lineage Feasibility | 20% |
| Responsible AI & Safety Assurance | 25% |
| Data Governance & Regulatory Compliance | 25% |
| Operational Readiness & Resilience | 15% |
| Definition of Ready Completeness | 15% |

Yes = full points, Partial = half, No = zero, within each pillar. Overall score is the weighted sum of pillar scores. Gate decision:

- **85–100 → APPROVED**
- **65–84 → CONDITIONAL**
- **&lt;65 → BLOCKED**

Any non-"Yes" answer becomes a gap, carrying that item's pre-assigned `severity_gov` and `category_tag` — both immutable downstream (see `DECISIONS.md` #3, #4). Full criteria list, remediation text, and rationale for the weight/threshold choices live in `js/config/criteria.js` and `DECISIONS.md`.

### Sample assessments

The "load a sample assessment" dropdown offers 4 fixtures spanning the full gate range — **Best** (fully ready), **Good** (minor gaps only), **Intentionally Off** (borderline/conditional), **Very Bad** (not ready). These aren't just UI demos: they're defined once in `js/config/criteria.js` and imported directly by the test suite, which asserts each one gates to its documented decision. See `DECISIONS.md` #14.

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

"Export JSON" produces `{assessment_id}_dor_export.json`, matching the schema App 2 ingests: `schema_version`, `assessment_id`, `assessment_date`, `feature_name`, `overall_score`, `gate_decision`, and `pillars[]` (each with `pillar_name`, `pillar_score`, and `gaps[]` carrying `gap_id`, `description`, `severity_gov`, `category_tag`, and `category_tag_freetext` when `category_tag` is `"Other"`). See `DECISIONS.md` for why this is a versioned file export rather than a shared database or live API.

## Out of Scope

Auth/SSO, persistent database, multi-tenant/concurrency handling, CI/CD pipeline/infra-as-code, financial modeling/RAID/exec reporting — the latter is `dor-recovery-console`'s job.
