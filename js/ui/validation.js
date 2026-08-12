import { PILLARS } from "../config/criteria.js";

export function validateFeatureName(name) {
  if (!name || !name.trim()) return "Feature name is required.";
  return null;
}

export function unansweredItemIds(answers) {
  const ids = [];
  for (const pillar of PILLARS) {
    for (const item of pillar.items) {
      if (!answers[item.id]) ids.push(item.id);
    }
  }
  return ids;
}

export function validateReadyForExport(state) {
  const errors = [];
  const nameError = validateFeatureName(state.feature_name);
  if (nameError) errors.push(nameError);

  const unanswered = unansweredItemIds(state.answers);
  if (unanswered.length > 0) {
    errors.push(`${unanswered.length} checklist item(s) not yet answered.`);
  }

  return errors;
}
