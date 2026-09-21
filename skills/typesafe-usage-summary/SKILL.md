---
name: typesafe-usage-summary
description: Summarize how TypeSafe Jev was used in the current MCP process when a user asks how much Jev was used, what model it substituted, how many tokens it consumed, how long it took, or what it theoretically saved. Do not use for a benchmark or to claim measured savings when no baseline run exists.
---

# TypeSafe Usage Summary

Use `typesafe_usage_summary` when the user asks about Jev usage, theoretical substitution, token use, elapsed time, or savings.

## Record substitute intent when known

When a Jev call is intentionally used instead of a named model, include `comparison_model` in that Jev tool call. For example, use `comparison_model: "gpt-5.6-luna"` when the agent would otherwise have used Luna for the same bounded decision.

This field records intent only. It does not execute, simulate, or price the alternative model.

## Report precisely

The summary is limited to the current MCP server process and resets when that process restarts. Report:

- Jev call count;
- observed input and output tokens;
- observed elapsed time and per-tool breakdown;
- any declared substitute model;
- that savings are theoretical unless a real baseline run was observed.

Do not describe unrun alternatives as measured performance, token, time, or cost savings. If no `comparison_model` was declared, say that Jev use was observed but no intended substitute model was recorded.

The summary records no request bodies, source text, credentials, or user data.
