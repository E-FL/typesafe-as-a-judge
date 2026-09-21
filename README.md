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

## Guided setup

After installing the plugin, run the setup script from a checkout of this repository. It hides the token while you type it, validates the token with a harmless TypeSafe Jev request, and only saves it after validation succeeds. It never writes the token to the repository, plugin configuration, command arguments, or logs.

```powershell
git clone https://github.com/E-FL/typesafe-as-a-judge.git
cd typesafe-as-a-judge
```

On Windows:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\setup.ps1
```

The Windows script stores the token in your user environment. On macOS or Linux:

```bash
chmod +x ./scripts/setup.sh
./scripts/setup.sh
```

The Unix script stores the token in `~/.config/typesafe-as-a-judge/token` with owner-only permissions. The MCP launcher reads that file when the environment variable is not present. Do not paste the token into Codex or Claude chat.

## Install in Codex

```powershell
codex plugin marketplace add E-FL/typesafe-as-a-judge
codex plugin add typesafe-as-a-judge@typesafe-as-a-judge
```

The Codex plugin forwards `TYPESAFE_API_KEY` from its launch environment. Run guided setup, then start a new Codex task so the MCP server and guidance skill load.

## Install in Claude Code

```powershell
claude plugin marketplace add E-FL/typesafe-as-a-judge
claude plugin install typesafe-as-a-judge@typesafe-as-a-judge
```

The Claude plugin uses the same shared MCP server. Run guided setup, then start a new Claude Code session and approve the project/plugin MCP tools when prompted.

## Develop and test

```powershell
npm test
```

Run `npm start` only for direct MCP debugging; it communicates over standard input/output, so do not write normal logs to standard output.

## API behavior

The server calls `POST https://api.typesafe.ai/v1/systemone` with `model: "jev-latest"`. It retries transient `429` and `529` responses with bounded exponential backoff, returns TypeSafe usage metadata, and limits requests to 256 KiB before sending them.

## License

MIT. See [LICENSE](LICENSE).
