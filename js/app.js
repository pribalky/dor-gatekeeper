import { SAMPLES } from "./config/criteria.js";
import { scoreAssessment } from "./engine/scoring.js";
import { deriveGaps } from "./engine/gaps.js";
import { buildJsonExport, exportFilenameJson } from "./export/jsonExport.js";
import { buildMarkdownExport, exportFilenameMd } from "./export/markdownExport.js";
import { validateReadyForExport } from "./ui/validation.js";
import { renderChecklist, setAnswers, clearAnswers, updateResults, showErrors } from "./ui/render.js";
import { createInitialState } from "./state.js";

let state = createInitialState();

const els = {
  featureName: document.getElementById("feature-name"),
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

function recompute() {
  const scoreResult = scoreAssessment(state.answers);
  const gaps = deriveGaps(state.answers);
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
  const errors = validateReadyForExport(state);
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

function populateSampleSelect() {
  els.sampleSelect.innerHTML =
    `<option value="">— Load a sample assessment —</option>` +
    SAMPLES.map((s) => `<option value="${s.id}">${s.label}</option>`).join("");
}

function loadSample(sampleId) {
  const sample = SAMPLES.find((s) => s.id === sampleId);
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

function init() {
  refreshMeta();
  renderChecklist(els.checklist, onAnswerChange);
  populateSampleSelect();

  els.featureName.addEventListener("input", () => {
    state.feature_name = els.featureName.value;
    refreshErrorsAndButtons();
  });

  els.sampleSelect.addEventListener("change", () => {
    if (els.sampleSelect.value) loadSample(els.sampleSelect.value);
  });

  els.resetBtn.addEventListener("click", () => {
    state = createInitialState();
    els.featureName.value = "";
    els.sampleSelect.value = "";
    clearAnswers(els.checklist);
    refreshMeta();
    recompute();
    refreshErrorsAndButtons();
  });

  els.exportJsonBtn.addEventListener("click", () => {
    const { scoreResult, gaps } = recompute();
    const data = buildJsonExport(state, scoreResult, gaps);
    downloadFile(exportFilenameJson(state.assessment_id), JSON.stringify(data, null, 2), "application/json");
  });

  els.exportMdBtn.addEventListener("click", () => {
    const { scoreResult, gaps } = recompute();
    const md = buildMarkdownExport(state, scoreResult, gaps);
    downloadFile(exportFilenameMd(state.assessment_id), md, "text/markdown");
  });

  recompute();
  refreshErrorsAndButtons();
}

document.addEventListener("DOMContentLoaded", init);
