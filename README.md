# DoR Gatekeeper

**🔗 Live app: [pribalky.github.io/dor-gatekeeper](https://pribalky.github.io/dor-gatekeeper/)**

An interactive, lightweight Target Operating Model / Definition of Ready gate — evaluated across 5 transformation pillars before commitment. Ships with 3 selectable assessment frameworks: a software/AI feature governance baseline, and two regulated-sector presets (Water Asset Transformation, Energy Grid Operating Model).

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
│   │   └── criteria.js          # FRAMEWORKS: 3 presets, each 5 pillars/weights/25 items + samples
│   ├── engine/
│   │   ├── scoring.js           # pure functions: pillar score, overall score, gate decision
│   │   └── gaps.js              # derives the gap list from answers + criteria config
│   ├── export/
│   │   ├── jsonExport.js        # builds the export (schema_version 1.0 or 1.1, per active framework)
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

The "Assessment framework / sector" dropdown switches between 3 presets, each defined in `js/config/criteria.js`'s `FRAMEWORKS`:

| Framework | Focus | `schema_version` |
|---|---|---|
| Financial Services / Enterprise Tech Governance (baseline) | Software features, AI integrations, architecture changes | `1.0` |
| Regulated Infrastructure / Water Asset Transformation | Regulatory compliance & capital delivery readiness | `1.1` |
| Energy Grid Operating Model | Capability mapping & cross-agency governance | `1.1` |

The Water and Energy presets use 3 category_tags (`Safety`, `AssetLifecycle`, `SupplyChain`) added on top of the original 8 — an additive extension of the schema per its own documented extensibility clause (PRD §7), not a breaking change. Exports using them carry `schema_version: "1.1"`; App 2 accepts both `"1.0"` and `"1.1"`. See `DECISIONS.md` #17–19.

### Sample assessments

The baseline framework's "load a sample assessment" dropdown offers 4 fixtures spanning the full gate range — **Best** (fully ready), **Good** (minor gaps only), **Intentionally Off** (borderline/conditional), **Very Bad** (not ready). Water and Energy each offer 1 representative **Good** sample (see `DECISIONS.md` #20 for why the depth is asymmetric). None of these are just UI demos: they're defined once in `js/config/criteria.js` and imported directly by the test suite, which asserts each one gates to its documented decision.

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

"Export JSON" produces `{feature-name-slug}_{assessment_id}_dor_export.json` — the feature name leads so files stay recognizable in a downloads folder, with `assessment_id` kept in the name for stable tracking (see `DECISIONS.md` #16). The file content matches the schema App 2 ingests: `schema_version` (`"1.0"` baseline, `"1.1"` for the sector presets that use the extended `category_tag` enum), `assessment_id`, `assessment_date`, `feature_name`, `overall_score`, `gate_decision`, and `pillars[]` (each with `pillar_name`, `pillar_score`, and `gaps[]` carrying `gap_id`, `description`, `severity_gov`, `category_tag`, and `category_tag_freetext` when `category_tag` is `"Other"`). See `DECISIONS.md` for why this is a versioned file export rather than a shared database or live API.

## Out of Scope

Auth/SSO, persistent database, multi-tenant/concurrency handling, CI/CD pipeline/infra-as-code, financial modeling/RAID/exec reporting — the latter is `dor-recovery-console`'s job.
