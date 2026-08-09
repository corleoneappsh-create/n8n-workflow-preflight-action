# n8n Workflow Preflight

Deterministic GitHub Action for checking exported n8n workflow JSON before merge or deployment.

[![CI](https://github.com/corleoneappsh-create/n8n-workflow-preflight-action/actions/workflows/ci.yml/badge.svg)](https://github.com/corleoneappsh-create/n8n-workflow-preflight-action/actions/workflows/ci.yml)

## What it catches

- invalid JSON and malformed workflow structure;
- hardcoded secret-like values in workflow parameters;
- hardcoded Authorization headers;
- duplicate node names;
- active workflow exports that deserve review before deployment;
- webhook nodes without an explicit path;
- high-impact nodes such as Execute Command and SSH.

It does **not** execute the workflow, call external APIs, upload workflow contents, or require an n8n credential.

## Use in a repository

```yaml
name: n8n preflight
on: [push, pull_request]

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: corleoneappsh-create/n8n-workflow-preflight-action@v1
        with:
          path: workflows
          fail-on: error
```

Want a ready-to-copy repository layout instead? See [`examples/`](./examples/README.md) for a minimal workflow fixture plus a CI file with read-only permissions.

`path` can point to one workflow JSON or a directory. Directory scans ignore unrelated JSON files that do not look like n8n workflows.

## Failure policy

- `error` — fail only on blocking findings such as possible hardcoded secrets or malformed workflow structure;
- `warning` — fail on either warnings or errors;
- `never` — report findings but never fail the job.

## Outputs

The action exposes `files`, `errors`, `warnings`, and `summary-json` for downstream CI steps.

## Example

A clean workflow prints:

```text
n8n Workflow Preflight: 1 file(s), 0 error(s), 0 warning(s)
```

Unsafe findings are emitted as native GitHub Actions annotations so they appear directly in the Checks UI.

## Reliability Toolkit Pro

Need more than the free CI annotations? **n8n Reliability Toolkit Pro ($29 one-time)** adds deep Markdown/JSON preflight reports, broken-connection and webhook-path checks, external-domain and credential-type inventory, plus **Incident Doctor Pro** for batch post-failure diagnosis, severity, retry-safety guidance, and incident reports.

https://n8n-doctor.167-233-67-162.sslip.io/?src=github_action

## Security boundary

The scanner is intentionally conservative and deterministic. A finding is a reason to review a workflow, not proof that a workflow is malicious. Secret detection can produce false positives; inspect the annotated path before changing production logic.

## License

MIT