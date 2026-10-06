# Pset3-1.125

All future project changes belong in this directory.

- `d1-schema.sql` is the canonical working schema. Maintain this file for schema changes rather than creating versioned copies.
- `d1-schema.md` explains the schema, verified API/source mappings, and outstanding limitations.
- `api-verification.json` contains endpoint-check metadata and small response samples, not a complete imported dataset.
- `data-source.md` is the teammate's original research inventory; use the corrections and verification status in `d1-schema.md` when implementing imports.

The public Site is published at https://global-datacenter-design-explorer.tong-zhou.chatgpt.site. Source code is in `site/`; see `site/README.md` for local setup, architecture, checks and remaining limits. Cloudflare D1 backs site data and application registrations after Sign in with ChatGPT. Applied migration history must remain immutable.

The original workstation used ignored `site/.dev.vars` and production Sites Secrets for Fingrid and OpenAI. A fresh checkout has no local credentials. Never put its value in D1, Git, browser code or this documentation. Dataset 124 consumption is connected; carbon/forecast endpoint verification remains pending. The AI adviser now uses a server-side OpenAI Responses request with controlled D1/API tools, real source citations, registration checks and request limits. See `site/README.md` for Steps 18–21.

## Repository layout

`site/` is tracked as a normal source directory in this assignment repository, so cloning the repository includes the website code. Local secrets, dependencies and build output are ignored. On the original workstation, Sites publishing history is retained separately in `.git/sites-publishing.git`, referenced by the local-only `site/.git` file; neither is uploaded to GitHub.


## Completed analysis and written deliverables

The investment model and project-management features are implemented locally; the latest development starts from commit `f8248e1`. Open `/investment` for cost/stress/sensitivity analysis and `/decision` for demand, country research, engineering and governance. See [completion checklist](deliverables/completion-checklist.md), [test results](deliverables/test-results.md), [financial methodology](deliverables/financial-methodology.md), [system diagram](deliverables/system-diagram.pdf), and [request-flow guide](deliverables/submission-guide.pdf). The updated investment memo is `investment-memo.docx` and has two verified pages.

Publication remains blocked because Sites is not enabled in this workspace. Real site offers and demand commitments remain unresolved decision gates. The presentation and demonstration video are excluded by request. No Git commit or push was performed during completion work.
