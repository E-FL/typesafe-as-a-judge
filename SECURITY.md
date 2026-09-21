# Security Policy

## Reporting a vulnerability

Please do not open a public issue for a security vulnerability.

Use GitHub's private vulnerability reporting for this repository when available. If it is not available, contact the maintainer privately through [github.com/E-FL](https://github.com/E-FL) and include `TypeSafe-as-a-Judge security report` in the subject.

Please include:

- a short description of the issue;
- affected files, tools, or versions;
- reproduction steps or a minimal proof of concept;
- the potential impact;
- any suggested mitigation.

Do not include API tokens, customer data, private keys, or other secrets in the report. Redact them before sending.

## Supported versions

The latest `main` release is the supported version. Older releases may not receive security fixes; update before reporting whether an issue remains reproducible.

## Security boundaries

The MCP is intentionally read-only. It should not be used as an authority for permissions, RLS, tenant isolation, financial actions, production deployment, or destructive operations. TypeSafe tokens must stay in the local setup environment and must never be committed or sent in chat.
