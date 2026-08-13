import { DEFAULT_FRAMEWORK_ID } from "./config/criteria.js";

export function createInitialState() {
  return {
    assessment_id: crypto.randomUUID(),
    assessment_date: new Date().toISOString(),
    feature_name: "",
    answers: {},
    frameworkId: DEFAULT_FRAMEWORK_ID,
  };
}
