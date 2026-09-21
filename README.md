# TypeSafe-as-a-Judge

TypeSafe-as-a-Judge is a dual Codex and Claude Code plugin that gives coding agents a bounded semantic-judgment layer powered by TypeSafe Jev.

The agent remains responsible for orchestration, policy, permissions, code changes, and side effects. Jev supplies small typed signals—choices, scores, yes/no probabilities, and confidence—that the agent can use to route work, rank candidates, verify evidence, and decide when to ask for review.

It is deliberately not an autonomous authority layer.

> **Unofficial community integration:** TypeSafe-as-a-Judge is not affiliated with, sponsored by, or endorsed by TypeSafe AI, OpenAI, Anthropic, Codex, or Claude. TypeSafe, Jev, OpenAI, Codex, Claude, and related names are the property of their respective owners.

## Community

Arik Aizikovich is currently the sole maintainer and contributor. Contributions are welcome: bug reports, documentation improvements, new examples, test cases, security feedback, and pull requests are all useful.

Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request. For security concerns, follow [SECURITY.md](SECURITY.md) instead of opening a public issue. The project uses Apache-2.0; contributions are accepted under the same license unless we explicitly agree otherwise.

## What the MCP provides

| Tool | Use it when | What it returns |
| --- | --- | --- |
| `typesafe_route` | One item must be sent to one known route | A route, probability distribution, confidence, and `proceed`/`review` recommendation |
| `typesafe_rank` | Code has already retrieved a bounded candidate list | Ordered candidates with scores, probabilities, confidence, and a review recommendation |
| `typesafe_extract` | Code has already found possible values in a source | A selected candidate or `no_match`; it never invents a value |
| `typesafe_verify` | One claim needs to be checked against evidence | Support probability and a `proceed`/`review` recommendation |
| `typesafe_judge` | Several independent narrow questions should run over shared state | Raw Choice, Score, and Noul signals for the caller's policy |
| `typesafe_escalation_gate` | Existing confidence or risk signals need one deterministic gate | `proceed` when no signal fires, otherwise `review` |

The tools are read-only. They do not edit files, approve actions, change records, invoke another model, or contact a third party.

## How Codex and Claude use it autonomously

The bundled skill tells Codex and Claude to consider this MCP when a task contains a bounded semantic decision. They do not call it for every request.

The normal pattern is:

1. Observe or retrieve the relevant state.
2. Reduce it to the minimum safe context.
3. Choose the narrowest TypeSafe tool.
4. Preserve the raw answer, probabilities, confidence, and threshold.
5. Proceed only when the explicit policy allows it.
6. Ask for review when confidence is low, no candidate fits, or evidence conflicts.

### Autonomous use-case map

| Coding-agent situation | Tool combination | Autonomous behavior |
| --- | --- | --- |
| An issue could be a bug, feature, documentation task, or investigation | `typesafe_route` | Route the issue to one known workflow, or choose `needs_review` when the request is ambiguous |
| Several files may implement the requested behavior | `typesafe_rank` | Rank a retrieved shortlist by relevance before opening or editing candidates |
| Several test suites could cover a change | `typesafe_rank` | Rank candidate suites using changed files, test names, and the requirement |
| A failing test could be code, configuration, environment, dependency, or test failure | `typesafe_route` | Classify the failure and choose the next diagnostic path |
| Several implementation approaches are already known | `typesafe_rank` | Compare them against a concrete rubric such as compatibility, scope, and testability |
| A natural-language request contains a known command, framework, or option | `typesafe_extract` | Select one value from candidates already found by code; return `no_match` rather than inventing one |
| A generated summary makes claims about code or test results | `typesafe_verify` | Check each important claim against source evidence before presenting it as confirmed |
| A citation or documentation link may not support a statement | `typesafe_verify` | Flag unsupported or partial evidence for review |
| An extracted record contains multiple fields | `typesafe_judge` | Run independent field-level checks and keep each signal separately inspectable |
| A plan has conflicting evidence or low-confidence choices | `typesafe_judge` + `typesafe_escalation_gate` | Escalate to the user or a stronger reasoning path instead of silently guessing |
| A pull request has several possible review areas | `typesafe_rank` + `typesafe_verify` | Rank likely risk areas and verify claims about tests, behavior, and regressions |
| A set of available skills could apply | `typesafe_route` | Choose among a closed set of skills, with an explicit no-match path |
| A task queue contains mixed work | `typesafe_route` + `typesafe_rank` | Classify each item, then rank candidates within a defined category |

These are recommendations for the agent's next step. A recommendation is not permission to perform a consequential action.

## Examples

The examples below show the shape of the MCP calls. Codex and Claude normally construct these arguments themselves when the task matches the skill.

### Route a request

Use `typesafe_route` when exactly one route should receive an item.

```json
{
  "state": {
    "request": "I was charged twice and need a refund.",
    "channel": "support"
  },
  "instructions": "Which team should handle this request?",
  "routes": {
    "billing": "Payments, invoices, refunds, and duplicate charges.",
    "technical": "Bugs, outages, integrations, and broken product behavior.",
    "account": "Login, identity, profile, and account-access issues."
  },
  "confidence_threshold": 0.8
}
```

Possible result:

```json
{
  "route": "billing",
  "confidence": 0.93,
  "probabilities": {
    "billing": 0.96,
    "technical": 0.02,
    "account": 0.01,
    "needs_review": 0.01
  },
  "recommended_action": "proceed"
}
```

The tool adds `needs_review` automatically. If the selected route is `needs_review` or confidence is below the threshold, the result is `review`.

### Rank implementation candidates

Use `typesafe_rank` only after code has retrieved a bounded candidate list.

```json
{
  "instructions": "Which implementation is the best fit for adding tenant-scoped audit logging without widening authority?",
  "context": {
    "constraints": [
      "Preserve existing RLS boundaries",
      "Keep audit records append-only",
      "Do not change authentication semantics"
    ]
  },
  "candidates": [
    { "id": "middleware", "value": "Add an audit middleware around protected mutations." },
    { "id": "orm-hook", "value": "Add a global ORM hook for all writes." },
    { "id": "db-trigger", "value": "Add database triggers to protected tables." }
  ],
  "criteria": [
    "Poor fit: violates a constraint or requires broad unsafe changes.",
    "Good fit: satisfies the constraints with manageable integration work.",
    "Excellent fit: satisfies the constraints, is auditable, and has a narrow blast radius."
  ],
  "confidence_threshold": 0.7
}
```

The agent receives an ordered list with a score and confidence for every candidate. It can inspect the top candidate, but should ask for review if the top result is not sufficiently distinct or confident.

### Select a value from known candidates

Use `typesafe_extract` when deterministic code has already found possible values. This is selection, not free-form generation.

```json
{
  "source": "The deployment target is the EU production cluster in Frankfurt.",
  "fields": [
    {
      "id": "deployment_target",
      "instructions": "Which known deployment target is explicitly named by the source?",
      "candidates": [
        { "id": "us_staging", "value": "us-staging", "description": "United States staging environment." },
        { "id": "eu_production", "value": "eu-production", "description": "European production environment." },
        { "id": "eu_staging", "value": "eu-staging", "description": "European staging environment." }
      ]
    }
  ],
  "confidence_threshold": 0.8
}
```

If no supplied value is supported, the tool returns `no_match` and recommends review. It never creates a new environment name from the prose.

### Verify a claim against evidence

Use `typesafe_verify` for one specific claim and its evidence.

```json
{
  "claim": "The migration was replayed successfully on the evaluation database.",
  "evidence": {
    "command": "pnpm eval:db:fresh",
    "exit_code": 0,
    "output": "Applied 42 migrations; seed verification passed."
  },
  "support_threshold": 0.85
}
```

Possible result:

```json
{
  "support_probability": 0.91,
  "support_threshold": 0.85,
  "recommended_action": "proceed"
}
```

The result means the evidence supports the claim according to the question. It is not a deployment attestation, security approval, or substitute for the actual command output.

### Run several independent judgments

Use `typesafe_judge` when several narrow questions share the same state.

```json
{
  "state": {
    "claim": "The release is ready for production.",
    "evidence": {
      "tests": "All focused tests passed.",
      "migration": "Greenfield replay passed; production migration replay was not run.",
      "approval": "No production approval is attached."
    }
  },
  "questions": {
    "tests_complete": {
      "type": "noul",
      "instructions": "Is the available test evidence sufficient for the stated release claim?",
      "criteria": {
        "true": "The relevant tests and checks are complete for the claim.",
        "false": "Important tests or checks are missing."
      }
    },
    "migration_evidence": {
      "type": "choice",
      "instructions": "What is the strongest migration evidence available?",
      "criteria": {
        "production_replay": "The intended production migration path was replayed.",
        "greenfield_only": "Only a greenfield replay was performed.",
        "none": "No meaningful migration evidence is present."
      }
    },
    "approval_present": {
      "type": "noul",
      "instructions": "Is an explicit production approval present in the evidence?",
      "criteria": {
        "true": "The evidence contains an explicit approval.",
        "false": "The evidence does not contain an explicit approval."
      }
    }
  }
}
```

The agent keeps each answer separate instead of collapsing the evidence into one vague overall score.

### Apply a deterministic escalation gate

Use `typesafe_escalation_gate` after collecting model signals and deterministic checks.

```json
{
  "signals": [
    {
      "id": "route_confidence",
      "value": 0.91,
      "threshold": 0.8,
      "comparator": "<=",
      "reason": "Route confidence is too low."
    },
    {
      "id": "citation_gap",
      "value": 0.88,
      "threshold": 0.8,
      "comparator": ">=",
      "reason": "A citation may not support the claim."
    }
  ]
}
```

Result:

```json
{
  "recommended_action": "review",
  "fired_signals": [
    {
      "id": "citation_gap",
      "value": 0.88,
      "threshold": 0.8,
      "comparator": ">=",
      "reason": "A citation may not support the claim."
    }
  ],
  "gate": "max"
}
```

The gate is deterministic. It does not decide what the reviewer should do and cannot execute the next action.

## Confidence and escalation rules

Choice and Score answers include a confidence value derived from their probability distribution. Noul answers provide a probability that the statement is true; Noul does not provide a separate confidence value.

The agent should:

- preserve the raw probability distribution and threshold in its work record;
- treat `needs_review` and `no_match` as review outcomes;
- escalate low-confidence results instead of silently selecting a winner;
- use a max-style gate when one serious independent signal should be enough to trigger review;
- calibrate thresholds against representative examples and the cost of a wrong decision;
- keep useful uncertainty visible in the final explanation.

Confidence is not correctness. A high-confidence answer can still be wrong, and a low-confidence answer can reflect missing evidence rather than a false conclusion.

## Measured development-planning comparison

This example uses a realistic internal planning question that arises while extending this MCP. It is included to illustrate the decision shape, latency, and token accounting—not as a general performance benchmark.

**User request:** Add an MCP tool named `typesafe_compare` that compares two proposed implementation plans, returns an ordered score with a review recommendation, and adds tests and documentation.

**Internal question:** Which existing file should the coding agent inspect first?

**Candidates:**

- `server/judge.mjs` - TypeSafe API client and existing tool handlers.
- `server/index.mjs` - MCP tool schemas and JSON-RPC dispatch.
- `tests/judge.test.mjs` - unit tests for tool behavior.
- `README.md` - tool contracts and use cases.

**Observation:** The agent should locate the primary MCP integration surface before planning the implementation, tests, and documentation.

| Measure | Ordinary reasoning | TypeSafe MCP judgment |
| --- | --- | --- |
| Model | `gpt-5.6-luna` | `jev-1.13.0` |
| Result | `server/index.mjs` | `server/index.mjs` |
| Elapsed time | 6.40 s | 0.861 s |
| Agent usage | 13,236 input, 8,960 cached input, 52 output tokens | 1,174 input, 71 output tokens |
| Price estimate | ~$0.00110 API-equivalent | At least ~$0.0000493 input-only |
| Action | `proceed` | `proceed` |
| Reason | It defines MCP schemas and JSON-RPC dispatch, so it is the first integration surface to inspect. | It ranked first with score 1.98 and confidence 0.98. |

Both paths selected the same first file and the same action. The TypeSafe path adds a reusable score, probability distribution, and confidence signal that a deterministic gate can consume.

### Price assumptions and limits

- The Luna estimate uses the current API rates of $0.20 per million uncached input tokens, $0.02 per million cached input tokens, and $1.20 per million output tokens. It is an API-equivalent calculation; Codex subscription billing can differ. See the [GPT-5.6 Luna model page](https://developers.openai.com/api/docs/models/gpt-5.6-luna).
- The TypeSafe estimate uses the published $42 per billion input tokens: `1,174 x $42 / 1,000,000,000 = $0.000049308`. TypeSafe's public figure did not show output-token pricing, so this is a lower bound. See [TypeSafe AI](https://typesafe.ai/).
- The two runs answer the same internal question, but they are not a controlled benchmark. The left side is an end-to-end Codex run; the right side is a direct MCP ranking call. Their token accounting measures different layers.

## What it will not decide

Do not use this MCP as the authority for:

- authorization, authentication, RLS, tenant isolation, or permission grants;
- financial calculations, payments, billing, or account changes;
- security approval or vulnerability disposition;
- production deployment, migration completion, or release approval;
- destructive actions or irreversible external operations;
- exact arithmetic, dates, identifiers, or deterministic lookups;
- open-ended writing or general reasoning that does not need a typed judgment.

Those decisions belong to deterministic code, existing governance, explicit evidence, and human approval gates.

## Data boundary

Send only the minimum state needed for one judgment. Do not send:

- API keys, passwords, access tokens, or private keys;
- payment data or secrets from configuration files;
- unrelated tenant or company data;
- unredacted sensitive personal information;
- large repositories when a small excerpt or candidate list is sufficient.

The plugin returns TypeSafe usage metadata, but it does not persist a semantic decision history. Callers should decide what to retain in their own auditable work records.

## Installation and guided authentication

### Codex

```powershell
codex plugin marketplace add E-FL/typesafe-as-a-judge
codex plugin add typesafe-as-a-judge@typesafe-as-a-judge
```

Then configure the TypeSafe token from a checkout of this repository:

```powershell
git clone https://github.com/E-FL/typesafe-as-a-judge.git
cd typesafe-as-a-judge
powershell -ExecutionPolicy Bypass -File .\scripts\setup.ps1
```

The Windows setup prompts without echoing the token, validates it with a harmless Jev request, and stores it in the Windows user environment. Restart Codex and start a new task after setup.

### Claude Code

```powershell
claude plugin marketplace add E-FL/typesafe-as-a-judge
claude plugin install typesafe-as-a-judge@typesafe-as-a-judge
```

Run the same guided setup from the repository checkout. Restart Claude Code and approve the project/plugin MCP server when prompted.

### macOS and Linux

```bash
git clone https://github.com/E-FL/typesafe-as-a-judge.git
cd typesafe-as-a-judge
chmod +x ./scripts/setup.sh
./scripts/setup.sh
```

The Unix setup stores the token at `~/.config/typesafe-as-a-judge/token` with owner-only permissions. The MCP launcher reads that file when `TYPESAFE_API_KEY` is not already present.

Never paste a TypeSafe token into Codex or Claude chat, commit it to a file, or place it in MCP command-line arguments.

## How the plugin is authenticated

This plugin is a local STDIO MCP server. Codex and Claude launch it as a local process and pass `TYPESAFE_API_KEY` through the session environment. It does not use an OAuth login button or a hosted credential broker.

The TypeSafe request is:

```text
POST https://api.typesafe.ai/v1/systemone
Authorization: Bearer <TYPESAFE_API_KEY>
model: jev-latest
```

The token is never included in the plugin package or repository.

## API and operational behavior

- Node.js 20 or later is required.
- Requests are limited to 256 KiB before being sent.
- Transient TypeSafe `429` and `529` responses receive bounded exponential backoff.
- The server returns TypeSafe model and usage metadata with judgments.
- `typesafe_rank` accepts at most 50 candidates.
- `typesafe_extract` accepts at most 20 fields and 100 candidates per field.
- `typesafe_judge` accepts at most 25 independent questions.
- `typesafe_escalation_gate` accepts at most 100 signals.
- The MCP server writes protocol messages to stdout; diagnostics must not be written to stdout.

## Development and testing

Install no runtime dependency: the MCP server uses Node.js built-ins so a fresh marketplace install works without `node_modules`.

Run the local tests:

```powershell
npm test
```

The test suite covers tool behavior, missing-token failure, the launcher, and the JSON-RPC MCP handshake without making a live TypeSafe request.

Validate the Codex and Claude manifests:

```powershell
py -3 "$env:USERPROFILE\.codex\skills\.system\plugin-creator\scripts\validate_plugin.py" (Get-Location)
claude plugin validate .
```

For direct MCP debugging:

```powershell
npm start
```

The process communicates over standard input/output. Do not write normal logs to stdout.

## License

Apache-2.0. See [LICENSE](LICENSE).
