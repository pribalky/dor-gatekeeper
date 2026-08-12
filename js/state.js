export function createInitialState() {
  return {
    assessment_id: crypto.randomUUID(),
    assessment_date: new Date().toISOString(),
    feature_name: "",
    answers: {},
  };
}
