# Changelog

All notable changes to TypeSafe-as-a-Judge are documented here.

## Unreleased

- Default model is now pinned to `jev-1.14.0` (`jev-latest` still resolved to `jev-1.13.0`).
- Claude Code now starts the MCP server: `.mcp.json` uses `${CLAUDE_PLUGIN_ROOT}` and passes `TYPESAFE_API_KEY` through `env`. Codex keeps its own `.codex-mcp.json` (relative paths, `env_vars`).

- Community contribution files and issue templates.
- Guided TypeSafe token setup for Windows, macOS, and Linux.
- Expanded autonomous-use-case documentation.

## 0.1.0 - 2026-09-21

- Initial dual Codex and Claude Code plugin.
- TypeSafe Jev tools for routing, ranking, candidate-only extraction, verification, generic typed judgments, and deterministic escalation.
- Dependency-free STDIO MCP server.
- Local marketplace installation and guided token validation.
