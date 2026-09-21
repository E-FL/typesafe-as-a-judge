---
name: typesafe-session-control
description: Let a user enable, disable, or inspect TypeSafe Jev use for the current MCP session, and apply an automatic policy that favors Jev for bounded semantic work when plan/quota conservation is relevant. Do not infer billing context from credentials.
---

# TypeSafe Session Control

Use `typesafe_session_mode` when the user says to enable, disable, or inspect TypeSafe-as-a-Judge for the current session.

## Modes

- `auto` (default): use the existing TypeSafe-as-a-Judge skill when the task needs a bounded semantic judgment.
- `enabled`: prefer Jev whenever the request matches the bounded tool shapes, subject to the normal safety boundary.
- `disabled`: do not call Jev tools for the rest of the current MCP process. Deterministic work and `typesafe_escalation_gate` remain available.

Session mode is process-local and resets when the MCP server restarts. It does not change Codex or Claude global configuration.

## Automatic preference policy

In `auto` mode, prefer Jev when all or most of these are true:

- the question is bounded (route, rank, select, verify, or score);
- the caller already has a small candidate set or evidence set;
- confidence or a review gate would improve the workflow;
- the task is repeated or high-volume;
- the user is on a plan and conserving agent context, quota, latency, or review effort is valuable.

Do not use Jev for exact deterministic work, open-ended coding or writing, permissions, tenant isolation, security authority, financial actions, destructive operations, or sensitive data that should not leave the local environment.

If the billing context is known, pass `billing_context: "plan"` or `billing_context: "api"` when changing the mode. If it is not explicitly known, use `unknown`; never infer it from the presence of credentials. Plan context can justify preferring a fast bounded Jev judgment to reduce main-agent context and review work, but Jev API calls create separate API usage. API context should use ordinary quality, latency, and API-cost judgment.

When Jev substitutes for a named model, pass `comparison_model` on the Jev tool call so `typesafe_usage_summary` can report the intent. This does not run the alternative or prove savings.
