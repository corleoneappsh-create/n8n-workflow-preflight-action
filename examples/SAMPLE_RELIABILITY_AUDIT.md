# Sample n8n Workflow Reliability Audit

> Synthetic example only. It is not a customer case study and contains no production data.

## Scope
One exported n8n workflow: webhook → transform → CRM update → notification.

## Executive verdict
**Risk: HIGH.** The workflow can retry after a partial failure and repeat the CRM write because the external mutation is not protected by an idempotency key or duplicate check.

## Priority findings
1. **P0 — Duplicate external action on retry**
   - CRM update occurs before the final notification step.
   - If notification fails and the execution is retried, the CRM mutation can run again.
   - Fix: add an idempotency key / existence check before the external write.

2. **P1 — Brittle webhook handoff**
   - Incoming payload fields are referenced without explicit validation.
   - Fix: validate required fields and route malformed payloads to a controlled error branch.

3. **P2 — Weak failure observability**
   - Errors reach the execution log, but there is no compact incident payload for triage.
   - Fix: capture workflow, node, execution ID, error class, retry-safety state, and timestamp.

## Regression checklist
- Replay the same webhook twice; confirm only one external mutation occurs.
- Force the final notification to fail; retry; confirm CRM state is unchanged.
- Send a payload missing one required field; confirm fail-closed behavior.
- Confirm secrets/tokens are absent from exported fixtures and incident evidence.

## Deliverable boundary
The paid one-workflow audit provides written findings, prioritized fixes, and a bounded regression checklist. It does not require production credentials or live account access.
