# Contributing to TypeSafe-as-a-Judge

Thank you for considering a contribution. This is currently a small, sole-maintainer project led by Arik Aizikovich, and thoughtful contributions are welcome.

## Ways to help

- Report a reproducible bug.
- Improve the README, examples, or setup experience.
- Add focused tests for tool behavior, confidence handling, or MCP protocol compatibility.
- Propose a new bounded use case with a clear input/output contract.
- Improve cross-platform behavior for Windows, macOS, or Linux.
- Review the safety boundary and identify places where the tools could be misused.

For substantial changes, open an issue or Discussion first so the scope and tool contract can be agreed before implementation.

## Development setup

```powershell
git clone https://github.com/E-FL/typesafe-as-a-judge.git
cd typesafe-as-a-judge
npm test
```

The runtime MCP server uses Node.js built-ins and does not require `node_modules`. Node.js 20 or later is required.

## Pull requests

Please keep pull requests focused and include:

- the problem and intended behavior;
- tests for changed behavior;
- documentation updates when a tool contract or workflow changes;
- confirmation that no credentials, tokens, private data, or generated `node_modules` files are included;
- notes about Windows and Unix behavior when setup or launch code changes.

Before opening a pull request, run:

```powershell
npm test
py -3 "$env:USERPROFILE\.codex\skills\.system\plugin-creator\scripts\validate_plugin.py" (Get-Location)
claude plugin validate .
```

## Design expectations

- Prefer the narrowest typed judgment instead of a general prompt.
- Keep candidate lists bounded and include `needs_review` or `no_match` paths.
- Preserve raw probabilities, confidence, thresholds, and review reasons.
- Keep authorization, permissions, tenant isolation, security decisions, exact calculations, and destructive actions outside TypeSafe judgments.
- Never log or commit TypeSafe API tokens.

## Licensing

By submitting a contribution, you agree that it may be distributed under the repository's Apache-2.0 license unless you and the maintainer explicitly agree otherwise in writing.
