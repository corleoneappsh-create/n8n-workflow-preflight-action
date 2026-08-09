# Copy-paste example

This directory contains a minimal exported n8n workflow and a GitHub Actions workflow you can copy into another repository.

## Try it

1. Copy `preflight.yml` to `.github/workflows/preflight.yml` in your repository.
2. Put exported n8n workflow JSON files in `workflows/`.
3. Push the branch or open a pull request.

The example uses read-only repository permissions and does not require a live n8n instance, n8n API key, or external LLM.

`workflows/example.json` is a minimal safe fixture that should pass preflight with zero blocking findings.
