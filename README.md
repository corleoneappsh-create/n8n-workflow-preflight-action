# n8n Workflow Preflight

Deterministic GitHub Action for checking exported n8n workflow JSON before merge or deployment.

[![CI](https://github.com/corleoneappsh-create/n8n-workflow-preflight-action/actions/workflows/ci.yml/badge.svg)](https://github.com/corleoneappsh-create/n8n-workflow-preflight-action/actions/workflows/ci.yml)

> **Need deeper reports and post-failure diagnosis?** [n8n Reliability Toolkit Pro — $29 one-time](https://zbewt1-yh.myshopify.com/cart/43173943803966:1?checkout&ref=github_action&utm_source=github&utm_medium=repository&utm_campaign=n8n_reliability_toolkit&utm_content=preflight_top_cta) adds detailed Markdown/JSON preflight reports plus Incident Doctor Pro. No subscription is required.

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

**Buy Toolkit Pro:** https://zbewt1-yh.myshopify.com/cart/43173943803966:1?checkout&ref=github_action&utm_source=github&utm_medium=repository&utm_campaign=n8n_reliability_toolkit&utm_content=preflight_readme

**See full details:** https://n8n-doctor.167-233-67-162.sslip.io/?src=github_action

## Need a human reliability review?

If one workflow is already failing, duplicating actions, retrying unsafely, or breaking at an API/webhook handoff, there is now a fixed-scope **n8n Workflow Reliability Audit — $49 for one workflow**.

- written findings with prioritized fixes;
- review of retry/duplicate-action and brittle handoff risks;
- bounded regression checklist;
- no production credentials or live access required.

**See exactly what the deliverable looks like:** [synthetic sample reliability audit](./examples/SAMPLE_RELIABILITY_AUDIT.md). It is explicitly a sample, not a customer case study.

**Buy the one-workflow audit:** https://zbewt1-yh.myshopify.com/products/n8n-workflow-reliability-audit-1-workflow?ref=github_preflight_audit&utm_source=github&utm_medium=repository&utm_campaign=n8n_workflow_audit&utm_content=preflight_service_cta

**Open a redacted audit request / confirm fit first:** https://github.com/corleoneappsh-create/n8n-workflow-preflight-action/issues/new?title=Workflow%20reliability%20audit%20request

Never post passwords, tokens, API keys, PHI, customer records, or other sensitive data. Use only redacted or synthetic evidence.

## Security boundary

The scanner is intentionally conservative and deterministic. A finding is a reason to review a workflow, not proof that a workflow is malicious. Secret detection can produce false positives; inspect the annotated path before changing production logic.

## License

MIT