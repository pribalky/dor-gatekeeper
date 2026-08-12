import { PILLARS, ANSWER_POINTS, GATE_THRESHOLDS } from "../config/criteria.js";

export function computePillarScore(pillar, answers) {
  const maxPoints = pillar.items.length * ANSWER_POINTS.yes;
  const earned = pillar.items.reduce((sum, item) => {
    return sum + (ANSWER_POINTS[answers[item.id]] ?? 0);
  }, 0);
  return (earned / maxPoints) * 100;
}

export function computePillarScores(answers) {
  return PILLARS.map((pillar) => ({
    id: pillar.id,
    name: pillar.name,
    weight: pillar.weight,
    score: computePillarScore(pillar, answers),
  }));
}

export function computeOverallScore(pillarScores) {
  return pillarScores.reduce((sum, p) => sum + p.score * p.weight, 0);
}

export function gateDecision(overallScore) {
  if (overallScore >= GATE_THRESHOLDS.APPROVED) return "APPROVED";
  if (overallScore >= GATE_THRESHOLDS.CONDITIONAL) return "CONDITIONAL";
  return "BLOCKED";
}

export function scoreAssessment(answers) {
  const pillarScores = computePillarScores(answers);
  const overallScore = computeOverallScore(pillarScores);
  return { pillarScores, overallScore, gateDecision: gateDecision(overallScore) };
}
