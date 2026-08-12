// Tiny zero-dependency assertion helper — keeps the "no npm install, ever" story
// true at test time too. Shared module-level counters accumulate across every
// test file imported by run.js in the same process.
let passCount = 0;
let failCount = 0;
const failures = [];

function record(pass, message, detail) {
  if (pass) {
    passCount += 1;
  } else {
    failCount += 1;
    failures.push(`${message} — ${detail}`);
  }
}

export function assertEqual(actual, expected, message) {
  const pass = JSON.stringify(actual) === JSON.stringify(expected);
  record(pass, message, `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

export function assertTrue(condition, message) {
  record(Boolean(condition), message, "expected a truthy value");
}

export function assertClose(actual, expected, tolerance, message) {
  const pass = Math.abs(actual - expected) <= tolerance;
  record(pass, message, `expected ~${expected} (±${tolerance}), got ${actual}`);
}

export function summary() {
  return { passCount, failCount, failures };
}
