# TypeSafe-as-a-Judge

TypeSafe-as-a-Judge is a local dual plugin for Codex and Claude Code. It calls TypeSafe's Jev System One API for small, typed semantic judgments, then returns a transparent `proceed` or `review` recommendation. It never performs the selected route, changes data, or authorizes an external action.

| Tool | Use it for | Result |
| --- | --- | --- |
| `typesafe_route` | Closed-set routing | Route, probability distribution, confidence, review recommendation |
| `typesafe_rank` | Ranking a retrieved candidate shortlist | Ordered scores, confidence, review recommendation |
| `typesafe_extract` | Selecting values from candidates code already found | Verbatim selection or `no_match`; no free-form generation |
| `typesafe_verify` | Checking a claim against evidence | Support probability and review recommendation |
| `typesafe_judge` | Independent Choice, Score, and Noul questions over shared state | Raw typed answers for an explicit caller policy |
| `typesafe_escalation_gate` | Combining explicit confidence or risk signals | Deterministic max-style `proceed` or `review` gate |

## Safety boundary

Only send the minimum relevant state to TypeSafe. Do not send credentials, access tokens, payment data, unrelated tenant data, or unredacted sensitive personal data. A TypeSafe judgment is not authorization: permissions, RLS, financial decisions, production deployments, and destructive operations stay behind deterministic controls and explicit approvals.

`typesafe_extract` deliberately selects only from supplied candidates. `typesafe_escalation_gate` is deterministic and can only recommend review. Both boundaries make it easier to inspect what the model was allowed to decide.

## Prerequisites

- Node.js 20 or later
- A TypeSafe API key in `TYPESAFE_API_KEY`

Do not store the key in this repository. On Windows, set it for your user account and restart the client:

```powershell
setx TYPESAFE_API_KEY "your-key"
```

## Install in Codex

```powershell
codex plugin marketplace add E-FL/typesafe-as-a-judge
codex plugin add typesafe-as-a-judge@typesafe-as-a-judge
```

The Codex plugin forwards `TYPESAFE_API_KEY` from its launch environment. Start a new Codex task after installation so the MCP server and guidance skill load.

## Install in Claude Code

```powershell
claude plugin marketplace add E-FL/typesafe-as-a-judge
claude plugin install typesafe-as-a-judge@typesafe-as-a-judge
```

The Claude plugin uses the same shared MCP server. Start a new Claude Code session after installation and approve the project/plugin MCP tools when prompted.

## Develop and test

```powershell
npm test
```

Run `npm start` only for direct MCP debugging; it communicates over standard input/output, so do not write normal logs to standard output.

## API behavior

The server calls `POST https://api.typesafe.ai/v1/systemone` with `model: "jev-latest"`. It retries transient `429` and `529` responses with bounded exponential backoff, returns TypeSafe usage metadata, and limits requests to 256 KiB before sending them.

## License

MIT. See [LICENSE](LICENSE).
