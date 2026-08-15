import { FRAMEWORKS } from "./config/criteria.js";
import { scoreAssessment } from "./engine/scoring.js";
import { deriveGaps } from "./engine/gaps.js";
import { buildJsonExport, exportFilenameJson } from "./export/jsonExport.js";
import { buildMarkdownExport, exportFilenameMd } from "./export/markdownExport.js";
import { buildOpaPolicy, exportFilenameRego } from "./export/opaExport.js";
import { buildJiraCopyBlock, exportFilenameJiraTxt } from "./export/jiraExport.js";
import { routeAiDecision } from "./engine/aiRouting.js";
import { evaluateHazards, deriveFeasibilityVerdict } from "./engine/aiFeasibility.js";
import { buildAiFeasibilityAdr, exportFilenameAiFeasibilityAdr } from "./export/aiFeasibilityAdr.js";
import { classifyChangedFiles, fetchPrFiles } from "./engine/prDriftCheck.js";
import { validateReadyForExport } from "./ui/validation.js";
import { renderChecklist, onRadioChange, setAnswers, clearAnswers, updateResults, showErrors } from "./ui/render.js";
import { createInitialState } from "./state.js";

let state = createInitialState();

const els = {
  featureName: document.getElementById("feature-name"),
  frameworkSelect: document.getElementById("framework-select"),
  sampleSelect: document.getElementById("sample-select"),
  checklist: document.getElementById("checklist"),
  scorePanel: document.getElementById("score-panel"),
  gateBadge: document.getElementById("gate-badge"),
  gapList: document.getElementById("gap-list"),
  actionItems: document.getElementById("action-items"),
  errors: document.getElementById("errors"),
  exportJsonBtn: document.getElementById("export-json-btn"),
  exportMdBtn: document.getElementById("export-md-btn"),
  exportOpaBtn: document.getElementById("export-opa-btn"),
  resetBtn: document.getElementById("reset-btn"),
  assessmentId: document.getElementById("assessment-id"),
  assessmentDate: document.getElementById("assessment-date"),
  jiraCopyBlock: document.getElementById("jira-copy-block"),
  jiraCopyBtn: document.getElementById("jira-copy-btn"),
  jiraDownloadBtn: document.getElementById("jira-download-btn"),
  jiraCopyStatus: document.getElementById("jira-copy-status"),
  aiDeterminism: document.getElementById("ai-determinism"),
  aiComplexity: document.getElementById("ai-complexity"),
  aiDataSensitivity: document.getElementById("ai-data-sensitivity"),
  aiIntegrationTarget: document.getElementById("ai-integration-target"),
  aiLatencyBudget: document.getElementById("ai-latency-budget"),
  aiRoutingResult: document.getElementById("ai-routing-result"),
  aiHazardFlags: document.getElementById("ai-hazard-flags"),
  aiFeasibilityVerdict: document.getElementById("ai-feasibility-verdict"),
  exportAiFeasibilityAdrBtn: document.getElementById("export-ai-feasibility-adr-btn"),
  prOwner: document.getElementById("pr-owner"),
  prRepo: document.getElementById("pr-repo"),
  prNumber: document.getElementById("pr-number"),
  prToken: document.getElementById("pr-token"),
  prCheckBtn: document.getElementById("pr-check-btn"),
  prDriftResult: document.getElementById("pr-drift-result"),
};

function activeFramework() {
  return FRAMEWORKS.find((f) => f.id === state.frameworkId) ?? FRAMEWORKS[0];
}

function recompute() {
  const pillars = activeFramework().pillars;
  const scoreResult = scoreAssessment(pillars, state.answers);
  const gaps = deriveGaps(pillars, state.answers);
  updateResults({
    scoreResult,
    gaps,
    elements: {
      scorePanel: els.scorePanel,
      gateBadge: els.gateBadge,
      gapList: els.gapList,
      actionItems: els.actionItems,
    },
  });
  els.jiraCopyBlock.value = buildJiraCopyBlock(state, gaps);
  return { scoreResult, gaps };
}

function currentAiInputs() {
  return {
    determinism: els.aiDeterminism.value,
    complexity: els.aiComplexity.value,
    dataSensitivity: els.aiDataSensitivity.value,
    integrationTarget: els.aiIntegrationTarget.value,
    latencyCostBudget: els.aiLatencyBudget.value,
  };
}

const VERDICT_CLASS = {
  "PROCEED": "verdict-proceed",
  "PROCEED WITH CONDITIONS": "verdict-conditions",
  "RECONSIDER APPROACH": "verdict-reconsider",
};

function renderAiGovernanceAndFeasibility() {
  const inputs = currentAiInputs();
  const routing = routeAiDecision(inputs.determinism, inputs.complexity);
  const hazards = evaluateHazards(inputs);
  const verdict = deriveFeasibilityVerdict(hazards, routing.hitlRequired);

  els.aiRoutingResult.innerHTML = `
    <div class="ai-quadrant">${routing.label}</div>
    <p>${routing.guidance}</p>
    ${routing.hitlRequired ? `<p class="hitl-flag">Human-in-the-loop review gate required before this decision takes effect.</p>` : ""}
  `;

  els.aiHazardFlags.innerHTML = hazards.length
    ? `<ul>${hazards.map((h) => `<li class="hazard-${h.severity.toLowerCase()}"><span class="hazard-severity">${h.severity}</span> <strong>${h.flag}</strong> — ${h.guidance}</li>`).join("")}</ul>`
    : `<p class="empty">No hazards flagged for this configuration.</p>`;

  els.aiFeasibilityVerdict.innerHTML = `<span class="feasibility-verdict ${VERDICT_CLASS[verdict]}">${verdict}</span>`;

  return { inputs, routing, hazards, verdict };
}

function refreshErrorsAndButtons() {
  const errors = validateReadyForExport(activeFramework().pillars, state);
  showErrors(els.errors, errors);
  const ready = errors.length === 0;
  els.exportJsonBtn.disabled = !ready;
  els.exportMdBtn.disabled = !ready;
  els.exportOpaBtn.disabled = !ready;
}

function downloadFile(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function refreshMeta() {
  els.assessmentId.textContent = state.assessment_id;
  els.assessmentDate.textContent = new Date(state.assessment_date).toLocaleString();
}

function populateFrameworkSelect() {
  els.frameworkSelect.innerHTML = FRAMEWORKS.map((f) => `<option value="${f.id}">${f.label}</option>`).join("");
  els.frameworkSelect.value = state.frameworkId;
}

function populateSampleSelect() {
  els.sampleSelect.innerHTML =
    `<option value="">— Load a sample assessment —</option>` +
    activeFramework().samples.map((s) => `<option value="${s.id}">${s.label}</option>`).join("");
}

function renderActiveChecklist() {
  renderChecklist(activeFramework().pillars, els.checklist);
}

function loadSample(sampleId) {
  const sample = activeFramework().samples.find((s) => s.id === sampleId);
  if (!sample) return;
  state.feature_name = sample.feature_name;
  state.answers = { ...sample.answers };
  els.featureName.value = sample.feature_name;
  setAnswers(els.checklist, sample.answers);
  recompute();
  refreshErrorsAndButtons();
}

function onAnswerChange(itemId, value) {
  state.answers[itemId] = value;
  recompute();
  refreshErrorsAndButtons();
}

function switchFramework(frameworkId) {
  state.frameworkId = frameworkId;
  state.answers = {};
  els.sampleSelect.value = "";
  renderActiveChecklist();
  populateSampleSelect();
  recompute();
  refreshErrorsAndButtons();
}

function init() {
  refreshMeta();
  populateFrameworkSelect();
  renderActiveChecklist();
  populateSampleSelect();
  els.checklist.addEventListener("change", onRadioChange(onAnswerChange));

  els.featureName.addEventListener("input", () => {
    state.feature_name = els.featureName.value;
    refreshErrorsAndButtons();
  });

  els.frameworkSelect.addEventListener("change", () => {
    switchFramework(els.frameworkSelect.value);
  });

  els.sampleSelect.addEventListener("change", () => {
    if (els.sampleSelect.value) loadSample(els.sampleSelect.value);
  });

  els.resetBtn.addEventListener("click", () => {
    state = createInitialState();
    els.featureName.value = "";
    els.frameworkSelect.value = state.frameworkId;
    els.sampleSelect.value = "";
    renderActiveChecklist();
    populateSampleSelect();
    refreshMeta();
    recompute();
    refreshErrorsAndButtons();
  });

  els.exportJsonBtn.addEventListener("click", () => {
    const framework = activeFramework();
    const { scoreResult, gaps } = recompute();
    const data = buildJsonExport(framework.pillars, framework.schemaVersion, state, scoreResult, gaps);
    downloadFile(exportFilenameJson(state.feature_name, state.assessment_id), JSON.stringify(data, null, 2), "application/json");
  });

  els.exportMdBtn.addEventListener("click", () => {
    const { scoreResult, gaps } = recompute();
    const md = buildMarkdownExport(state, scoreResult, gaps);
    downloadFile(exportFilenameMd(state.feature_name, state.assessment_id), md, "text/markdown");
  });

  els.exportOpaBtn.addEventListener("click", () => {
    const framework = activeFramework();
    const rego = buildOpaPolicy(framework);
    downloadFile(exportFilenameRego(framework.id, state.assessment_id), rego, "text/plain");
  });

  els.jiraCopyBtn.addEventListener("click", async () => {
    try {
      if (!navigator.clipboard) throw new Error("Clipboard API unavailable");
      await navigator.clipboard.writeText(els.jiraCopyBlock.value);
      els.jiraCopyStatus.textContent = "Copied to clipboard.";
    } catch {
      els.jiraCopyStatus.textContent = "Clipboard copy unavailable in this context — select the text above and copy manually.";
    }
  });

  els.jiraDownloadBtn.addEventListener("click", () => {
    downloadFile(exportFilenameJiraTxt(state.feature_name, state.assessment_id), els.jiraCopyBlock.value, "text/plain");
  });

  els.aiDeterminism.addEventListener("change", renderAiGovernanceAndFeasibility);
  els.aiComplexity.addEventListener("change", renderAiGovernanceAndFeasibility);
  els.aiDataSensitivity.addEventListener("change", renderAiGovernanceAndFeasibility);
  els.aiIntegrationTarget.addEventListener("change", renderAiGovernanceAndFeasibility);
  els.aiLatencyBudget.addEventListener("change", renderAiGovernanceAndFeasibility);

  els.exportAiFeasibilityAdrBtn.addEventListener("click", () => {
    const { inputs, routing, hazards, verdict } = renderAiGovernanceAndFeasibility();
    const adr = buildAiFeasibilityAdr({ ...inputs, featureName: state.feature_name }, routing, hazards, verdict);
    downloadFile(exportFilenameAiFeasibilityAdr(state.feature_name, state.assessment_id), adr, "text/markdown");
  });

  els.prCheckBtn.addEventListener("click", async () => {
    const owner = els.prOwner.value.trim();
    const repo = els.prRepo.value.trim();
    const number = els.prNumber.value.trim();
    if (!owner || !repo || !number) {
      els.prDriftResult.innerHTML = `<p class="pr-error">Enter repo owner, repo name, and PR number.</p>`;
      return;
    }
    els.prDriftResult.innerHTML = `<p>Checking…</p>`;
    try {
      const filenames = await fetchPrFiles(owner, repo, number, els.prToken.value.trim());
      const classified = classifyChangedFiles(filenames);
      const flagged = classified.filter((f) => f.flagged);
      els.prDriftResult.innerHTML = `
        <p>${classified.length} file(s) changed, ${flagged.length} flagged.</p>
        <ul>${classified
          .map((f) => `<li class="${f.flagged ? "pr-flagged" : ""}">${f.filename}${f.flagged ? ` — <strong>${f.reason}</strong>` : ""}</li>`)
          .join("")}</ul>
      `;
    } catch (err) {
      els.prDriftResult.innerHTML = `<p class="pr-error">Could not fetch PR files: ${err.message}. This may be blocked by your network's outbound policy — see README.</p>`;
    }
  });

  renderAiGovernanceAndFeasibility();
  recompute();
  refreshErrorsAndButtons();
}

document.addEventListener("DOMContentLoaded", init);
