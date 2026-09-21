const MAX_EVENTS = 500;
const events = [];

function finiteNumber(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function resetUsage() {
  events.length = 0;
}

export function recordJevUsage({ tool_name, model, usage, elapsed_ms, comparison_model = null }) {
  if (!usage || typeof model !== "string" || !model) return;
  events.push({
    tool_name,
    model,
    input_tokens: finiteNumber(usage.input_tokens),
    output_tokens: finiteNumber(usage.output_tokens),
    elapsed_ms: finiteNumber(elapsed_ms),
    comparison_model: typeof comparison_model === "string" && comparison_model.trim() ? comparison_model.trim() : null,
  });
  if (events.length > MAX_EVENTS) events.shift();
}

function aggregate(records, key) {
  const groups = new Map();
  for (const record of records) {
    const value = record[key] ?? "not_declared";
    const group = groups.get(value) ?? { name: value, calls: 0, input_tokens: 0, output_tokens: 0, elapsed_ms: 0 };
    group.calls += 1;
    group.input_tokens += record.input_tokens;
    group.output_tokens += record.output_tokens;
    group.elapsed_ms += record.elapsed_ms;
    groups.set(value, group);
  }
  return [...groups.values()].sort((left, right) => right.calls - left.calls || left.name.localeCompare(right.name));
}

export function summarizeJevUsage({ comparison_model = null } = {}) {
  const requestedModel = typeof comparison_model === "string" && comparison_model.trim() ? comparison_model.trim() : null;
  const matching = requestedModel ? events.filter((event) => event.comparison_model === requestedModel) : events;
  const total = matching.reduce(
    (summary, event) => ({
      calls: summary.calls + 1,
      input_tokens: summary.input_tokens + event.input_tokens,
      output_tokens: summary.output_tokens + event.output_tokens,
      elapsed_ms: summary.elapsed_ms + event.elapsed_ms,
    }),
    { calls: 0, input_tokens: 0, output_tokens: 0, elapsed_ms: 0 },
  );

  return {
    scope: "current MCP server process; resets when the process restarts",
    jev_calls: total.calls,
    input_tokens: total.input_tokens,
    output_tokens: total.output_tokens,
    elapsed_ms: Number(total.elapsed_ms.toFixed(2)),
    average_elapsed_ms: total.calls ? Number((total.elapsed_ms / total.calls).toFixed(2)) : 0,
    by_tool: aggregate(matching, "tool_name"),
    by_jev_model: aggregate(matching, "model"),
    declared_substitute_models: aggregate(matching, "comparison_model"),
    theoretical_substitution: {
      comparison_model: requestedModel,
      observed_baseline_run: false,
      statement: requestedModel
        ? `Jev handled ${total.calls} recorded call(s) declared as an alternative to ${requestedModel}. No baseline run was observed, so saved tokens, elapsed time, and cost are not measured.`
        : "No baseline model was selected. This summary reports observed Jev use only; it does not claim measured savings.",
    },
  };
}
