export function validateFeatureName(name) {
  if (!name || !name.trim()) return "Feature name is required.";
  return null;
}

export function unansweredItemIds(pillars, answers) {
  const ids = [];
  for (const pillar of pillars) {
    for (const item of pillar.items) {
      if (!answers[item.id]) ids.push(item.id);
    }
  }
  return ids;
}

export function validateReadyForExport(pillars, state) {
  const errors = [];
  const nameError = validateFeatureName(state.feature_name);
  if (nameError) errors.push(nameError);

  const unanswered = unansweredItemIds(pillars, state.answers);
  if (unanswered.length > 0) {
    errors.push(`${unanswered.length} checklist item(s) not yet answered.`);
  }

  return errors;
}
