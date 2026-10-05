# Pset3-1.125

All future project changes belong in this directory.

- `d1-schema.sql` is the canonical working schema. Maintain this file for schema changes rather than creating versioned copies.
- `d1-schema.md` explains the schema, verified API/source mappings, and outstanding limitations.
- `api-verification.json` contains endpoint-check metadata and small response samples, not a complete imported dataset.
- `data-source.md` is the teammate's original research inventory; use the corrections and verification status in `d1-schema.md` when implementing imports.

The public Site is published at https://global-datacenter-design-explorer.tong-zhou.chatgpt.site. Source code is in `site/`; see `site/README.md` for local setup, architecture, checks and remaining limits. Cloudflare D1 backs site data and independent email/password accounts. Applied migration history must remain immutable.

The Fingrid key is stored in ignored `site/.dev.vars` locally and as a production Sites Secret. Never put its value in D1, Git, browser code or this documentation. Dataset 124 consumption is connected; carbon/forecast endpoint verification and the OpenAI adviser remain pending.
