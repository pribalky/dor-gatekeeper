import { assertEqual, assertTrue } from "./assert.js";
import { classifyChangedFiles, fetchPrFiles } from "../js/engine/prDriftCheck.js";

// Pure function — full coverage, no network involved.
const files = [
  "src/schema/user.json",
  "db/migrations/0007_add_column.sql",
  "proto/order.proto",
  "package.json",
  "api/openapi.yaml",
  "api/swagger.json",
  "src/components/Button.jsx",
  "README.md",
];

const classified = classifyChangedFiles(files);
assertEqual(classified.length, files.length, "one result per input filename");

const flaggedNames = classified.filter((f) => f.flagged).map((f) => f.filename);
assertTrue(flaggedNames.includes("src/schema/user.json"), "a file under schema/ is flagged");
assertTrue(flaggedNames.includes("db/migrations/0007_add_column.sql"), "a file under migrations/ is flagged");
assertTrue(flaggedNames.includes("proto/order.proto"), "a .proto file is flagged");
assertTrue(flaggedNames.includes("package.json"), "package.json is flagged");
assertTrue(flaggedNames.includes("api/openapi.yaml"), "an openapi.yaml file is flagged");
assertTrue(flaggedNames.includes("api/swagger.json"), "a swagger.json file is flagged");
assertTrue(!flaggedNames.includes("src/components/Button.jsx"), "an unrelated source file is not flagged");
assertTrue(!flaggedNames.includes("README.md"), "a README is not flagged");

for (const result of classified) {
  if (result.flagged) {
    assertEqual(result.reason, "Schema/Contract Mutation risk", `flagged file ${result.filename} carries the risk reason`);
  } else {
    assertEqual(result.reason, null, `unflagged file ${result.filename} carries no reason`);
  }
}

assertEqual(classifyChangedFiles([]).length, 0, "an empty file list classifies to an empty result");

// Mocked-fetch test for the network path — live connectivity to api.github.com is a
// documented manual-verification caveat (this session's own outbound network policy
// may block it; see README).
const originalFetch = globalThis.fetch;
globalThis.fetch = async (url) => {
  assertTrue(url.includes("/repos/pribalky/dor-gatekeeper/pulls/1/files"), "fetchPrFiles requests the correct GitHub API endpoint");
  return {
    ok: true,
    status: 200,
    statusText: "OK",
    json: async () => [{ filename: "package.json" }, { filename: "src/app.js" }],
  };
};

const filenames = await fetchPrFiles("pribalky", "dor-gatekeeper", 1, "");
assertEqual(filenames, ["package.json", "src/app.js"], "fetchPrFiles extracts filenames from the mocked API response");

globalThis.fetch = async () => ({ ok: false, status: 404, statusText: "Not Found" });
let threw = false;
try {
  await fetchPrFiles("pribalky", "dor-gatekeeper", 999, "");
} catch (err) {
  threw = true;
  assertTrue(err.message.includes("404"), "fetchPrFiles surfaces the HTTP status on failure");
}
assertTrue(threw, "fetchPrFiles throws on a non-ok response rather than silently returning nothing");

globalThis.fetch = originalFetch;
