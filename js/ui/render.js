const ANSWER_LABELS = { yes: "Yes", partial: "Partial", no: "No" };

// The change listener is bound once by the caller (app.js), not here — calling this
// again on framework switch must not stack duplicate listeners on the container.
export function renderChecklist(pillars, container) {
  container.innerHTML = "";
  for (const pillar of pillars) {
    const section = document.createElement("section");
    section.className = "pillar";

    const heading = document.createElement("h2");
    heading.innerHTML = `${pillar.name} <span class="pillar-weight">(${Math.round(pillar.weight * 100)}% weight)</span>`;
    section.appendChild(heading);

    const list = document.createElement("div");
    list.className = "pillar-items";

    for (const item of pillar.items) {
      const row = document.createElement("div");
      row.className = "item-row";
      row.innerHTML = `
        <div class="item-label">${item.label}</div>
        <div class="item-options" role="radiogroup" aria-label="${item.label}">
          ${["yes", "partial", "no"]
            .map(
              (val) => `
            <label class="option">
              <input type="radio" name="${item.id}" value="${val}" />
              ${ANSWER_LABELS[val]}
            </label>`
            )
            .join("")}
        </div>
      `;
      list.appendChild(row);
    }

    section.appendChild(list);
    container.appendChild(section);
  }
}

// Bind once from app.js via container.addEventListener("change", onRadioChange(handler)).
export function onRadioChange(handler) {
  return (event) => {
    if (event.target.matches('input[type="radio"]')) {
      handler(event.target.name, event.target.value);
    }
  };
}

export function setAnswers(container, answers) {
  for (const [itemId, value] of Object.entries(answers)) {
    const input = container.querySelector(`input[name="${itemId}"][value="${value}"]`);
    if (input) input.checked = true;
  }
}

export function clearAnswers(container) {
  container.querySelectorAll('input[type="radio"]').forEach((input) => {
    input.checked = false;
  });
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

export function updateResults({ scoreResult, gaps, elements }) {
  const { scorePanel, gateBadge, gapList, actionItems } = elements;

  scorePanel.innerHTML = `
    <div class="overall-score">${round2(scoreResult.overallScore)}<span>/100</span></div>
    <ul class="pillar-scores">
      ${scoreResult.pillarScores
        .map((p) => `<li><span>${p.name}</span><strong>${round2(p.score)}</strong></li>`)
        .join("")}
    </ul>
  `;

  gateBadge.textContent = scoreResult.gateDecision;
  gateBadge.className = `gate-badge gate-${scoreResult.gateDecision.toLowerCase()}`;

  gapList.innerHTML = gaps.length
    ? gaps
        .map(
          (g) => `
      <li class="gap severity-${g.severity_gov.toLowerCase()}">
        <span class="gap-severity">${g.severity_gov}</span>
        <span class="gap-desc">${g.description}</span>
        <span class="gap-tag">${g.category_tag === "Other" ? g.category_tag_freetext : g.category_tag}</span>
      </li>`
        )
        .join("")
    : `<li class="empty">No gaps identified.</li>`;

  actionItems.innerHTML = gaps.length
    ? `<ol>${gaps.map((g) => `<li>${g.remediation}</li>`).join("")}</ol>`
    : `<p class="empty">No action items — all criteria satisfied.</p>`;
}

export function showErrors(container, errors) {
  container.innerHTML = errors.length
    ? `<ul class="errors">${errors.map((e) => `<li>${e}</li>`).join("")}</ul>`
    : "";
}
