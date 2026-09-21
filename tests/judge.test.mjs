import assert from "node:assert/strict";
import test from "node:test";
import { JudgeInputError, escalationGate, evaluateSystemOne, extract, rank, route, verify } from "../server/judge.mjs";

function fakeResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

test("route adds a review route and recommends review below the threshold", async () => {
  let request;
  const result = await route(
    {
      state: { request: "Please refund my subscription" },
      instructions: "Choose the owning team.",
      routes: { billing: "Billing and refunds", support: "Technical support" },
      confidence_threshold: 0.8,
    },
    {
      apiKey: "test-key",
      fetchImpl: async (_url, options) => {
        request = JSON.parse(options.body);
        return fakeResponse({
          model: "jev-test",
          answers: { route: { type: "choice", choice: "billing", confidence: 0.6, probabilities: { billing: 0.6, support: 0.2, needs_review: 0.2 } } },
          usage: { input_tokens: 1, output_tokens: 1 },
        });
      },
    },
  );
  assert.equal(request.questions.route.criteria.needs_review.includes("human"), true);
  assert.equal(result.route, "billing");
  assert.equal(result.recommended_action, "review");
  assert.equal(typeof result.elapsed_ms, "number");
});

test("rank sends all candidates in one TypeSafe request and sorts by score", async () => {
  const result = await rank(
    {
      instructions: "Rank implementation fit.",
      candidates: [{ id: "a", value: "First" }, { id: "b", value: "Second" }],
      criteria: ["Poor fit", "Good fit", "Excellent fit"],
    },
    {
      apiKey: "test-key",
      fetchImpl: async () => fakeResponse({
        model: "jev-test",
        answers: {
          a: { type: "score", score: 1.2, confidence: 0.9, probabilities: { "0": 0.1, "1": 0.6, "2": 0.3 }, legend: {} },
          b: { type: "score", score: 1.8, confidence: 0.9, probabilities: { "0": 0, "1": 0.2, "2": 0.8 }, legend: {} },
        },
        usage: { input_tokens: 1, output_tokens: 1 },
      }),
    },
  );
  assert.deepEqual(result.ranked.map((candidate) => candidate.id), ["b", "a"]);
  assert.equal(result.recommended_action, "proceed");
});

test("extract never returns a value when TypeSafe selects no_match", async () => {
  const result = await extract(
    {
      source: "No phone number is shown.",
      fields: [{ id: "phone", instructions: "Select the phone number stated in the source.", candidates: [{ id: "p1", value: "+972555555555" }] }],
    },
    {
      apiKey: "test-key",
      fetchImpl: async () => fakeResponse({
        model: "jev-test",
        answers: { phone: { type: "choice", choice: "no_match", confidence: 0.99, probabilities: { p1: 0.01, no_match: 0.99 } } },
        usage: { input_tokens: 1, output_tokens: 1 },
      }),
    },
  );
  assert.equal(result.fields[0].selected_value, null);
  assert.equal(result.recommended_action, "review");
});

test("verify returns a review recommendation when support falls below the threshold", async () => {
  const result = await verify(
    { claim: "The incident is resolved.", evidence: "The incident is under investigation.", support_threshold: 0.85 },
    {
      apiKey: "test-key",
      fetchImpl: async () => fakeResponse({
        model: "jev-test",
        answers: { supported: { type: "noul", noul: 0.1 } },
        usage: { input_tokens: 1, output_tokens: 1 },
      }),
    },
  );
  assert.equal(result.recommended_action, "review");
  assert.equal(result.support_probability, 0.1);
});

test("escalation gate uses a max-style review rule", () => {
  const result = escalationGate({
    signals: [
      { id: "citation_gap", value: 0.95, threshold: 0.8, comparator: ">=" },
      { id: "route_confidence", value: 0.9, threshold: 0.7, comparator: "<=" },
    ],
  });
  assert.equal(result.recommended_action, "review");
  assert.deepEqual(result.fired_signals.map((signal) => signal.id), ["citation_gap"]);
});

test("evaluateSystemOne refuses to call TypeSafe without an API key", async () => {
  await assert.rejects(
    () => evaluateSystemOne({ state: "test", questions: { q: { type: "noul", instructions: "Is this a test?" } } }, { apiKey: "" }),
    JudgeInputError,
  );
});
