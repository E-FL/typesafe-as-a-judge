import assert from "node:assert/strict";
import test from "node:test";
import { recordJevUsage, resetUsage, summarizeJevUsage } from "../server/usage.mjs";

test("usage summary records metadata and labels substitute savings as theoretical", () => {
  resetUsage();
  recordJevUsage({
    tool_name: "typesafe_rank",
    model: "jev-1.13.0",
    usage: { input_tokens: 1174, output_tokens: 71 },
    elapsed_ms: 860.65,
    comparison_model: "gpt-5.6-luna",
  });
  const summary = summarizeJevUsage({ comparison_model: "gpt-5.6-luna" });
  assert.equal(summary.jev_calls, 1);
  assert.equal(summary.input_tokens, 1174);
  assert.equal(summary.output_tokens, 71);
  assert.equal(summary.elapsed_ms, 860.65);
  assert.deepEqual(summary.by_tool, [{ name: "typesafe_rank", calls: 1, input_tokens: 1174, output_tokens: 71, elapsed_ms: 860.65 }]);
  assert.match(summary.theoretical_substitution.statement, /No baseline run was observed/);
});
