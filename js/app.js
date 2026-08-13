import { FRAMEWORKS } from "./config/criteria.js";
import { scoreAssessment } from "./engine/scoring.js";
import { deriveGaps } from "./engine/gaps.js";
import { buildJsonExport, exportFilenameJson } from "./export/jsonExport.js";
import { buildMarkdownExport, exportFilenameMd } from "./export/markdownExport.js";
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
  resetBtn: document.getElementById("reset-btn"),
  assessmentId: document.getElementById("assessment-id"),
  assessmentDate: document.getElementById("assessment-date"),
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
  return { scoreResult, gaps };
}

function refreshErrorsAndButtons() {
  const errors = validateReadyForExport(activeFramework().pillars, state);
  showErrors(els.errors, errors);
  const ready = errors.length === 0;
  els.exportJsonBtn.disabled = !ready;
  els.exportMdBtn.disabled = !ready;
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

  recompute();
  refreshErrorsAndButtons();
}

document.addEventListener("DOMContentLoaded", init);
