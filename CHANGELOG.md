# Changelog

All notable changes to TypeSafe-as-a-Judge are documented here.

## Unreleased

- Jev 1.14 support: pass `model` (for example `jev-1.14.0` or `jev-preview`) to any Jev tool, or set `TYPESAFE_JEV_MODEL`. The default stays `jev-latest`.
- Optional `long_context` on Jev tools sends TypeSafe's long-context header (262k tokens) and raises the local request limit to 1 MiB.
- Claude Code now starts the MCP server: `.mcp.json` uses `${CLAUDE_PLUGIN_ROOT}` and passes `TYPESAFE_API_KEY` through `env`. Codex keeps its own `.codex-mcp.json` (relative paths, `env_vars`).
- Community contribution files and issue templates.
- Guided TypeSafe token setup for Windows, macOS, and Linux.
- Expanded autonomous-use-case documentation.

## 0.1.0 - 2026-09-21

- Initial dual Codex and Claude Code plugin.
- TypeSafe Jev tools for routing, ranking, candidate-only extraction, verification, generic typed judgments, and deterministic escalation.
- Dependency-free STDIO MCP server.
- Local marketplace installation and guided token validation.
