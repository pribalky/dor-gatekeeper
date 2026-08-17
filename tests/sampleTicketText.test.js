import { assertTrue, assertEqual } from "./assert.js";
import { FRAMEWORKS } from "../js/config/criteria.js";
import { SAMPLE_TICKET_TEXT, sampleTicketTextFor } from "../js/config/sampleTicketText.js";

// Guards against staleness: every sample bundled in FRAMEWORKS should have a matching
// demo ticket text, the same "iterate over the array, don't hardcode" discipline used
// elsewhere in this suite for future frameworks/samples.
for (const framework of FRAMEWORKS) {
  for (const sample of framework.samples) {
    assertTrue(
      Boolean(SAMPLE_TICKET_TEXT[sample.feature_name]),
      `sample "${sample.feature_name}" (${framework.id}/${sample.id}) has a matching demo ticket text`
    );
  }
}

assertEqual(sampleTicketTextFor("Sample: Not Ready Feature").length > 0, true, "a known feature_name returns its example text");
assertEqual(sampleTicketTextFor("Unknown Feature"), "", "an unknown feature_name returns an empty string, never throws");
