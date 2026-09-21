---
name: typesafe-as-a-judge
description: Use bounded TypeSafe Jev judgments when a task needs routing, ranking, selection from known candidates, evidence verification, or a confidence-based recommendation to review. Do not use it for authority, security, permissions, tenant isolation, destructive actions, exact calculations, or an open-ended answer.
---

# TypeSafe-as-a-Judge

Use TypeSafe as a source of typed semantic signals. Codex or Claude owns orchestration, policies, and all side effects.

## Choose the narrowest tool

- Use `typesafe_route` when exactly one of a closed set of handlers or paths should receive an item. Include a `needs_review` route whenever no candidate may fit.
- Use `typesafe_rank` only after code has retrieved a bounded candidate set. Supply a task-specific scoring rubric and let code consume the ordered results.
- Use `typesafe_extract` to select from values that code already found. It does not generate facts; include `no_match` and return the source value verbatim.
- Use `typesafe_verify` to judge whether cited evidence supports one claim. An unsupported or borderline result is a review signal, not proof that the claim is false.
- Use `typesafe_judge` when several independent narrow Choice, Score, or Noul questions can run together against the same state.
- Use `typesafe_escalation_gate` to combine explicit signals with a max-style rule. It returns only `proceed` or `review`; it cannot invoke a model, modify data, or perform an external action.

## Handle uncertainty deliberately

Choice and Score results include confidence. Treat low confidence, `needs_review`, and `no_match` as review outcomes. Noul returns probability rather than confidence, so compare it to the stated threshold and preserve the raw probability in the result.

Keep raw judgments and the explicit threshold in the work artifact. Calibrate thresholds against representative examples; a typed output is not proof of correctness.

## Safety and data boundary

Send only the minimum state needed for the judgment. Never send secrets, credentials, payment data, access tokens, tenant data from unrelated companies, or unredacted sensitive personal data. Do not use this plugin to decide authorization, RLS scope, policy enforcement, financial actions, production releases, or destructive operations. Those remain deterministic checks and explicit human approval gates.
