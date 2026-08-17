import "./scoring.test.js";
import "./gaps.test.js";
import "./export.test.js";
import "./opaExport.test.js";
import "./jiraExport.test.js";
import "./checklistAdr.test.js";
import "./aiRouting.test.js";
import "./aiFeasibility.test.js";
import "./prDriftCheck.test.js";
import "./deepLink.test.js";
import { summary } from "./assert.js";

const { passCount, failCount, failures } = summary();

console.log(`\n${passCount} passed, ${failCount} failed\n`);

if (failCount > 0) {
  for (const failure of failures) console.log(`  ✗ ${failure}`);
  process.exit(1);
} else {
  console.log("All tests passed.");
}
