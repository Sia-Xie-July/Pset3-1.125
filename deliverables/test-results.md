# Project verification results

Reviewed and extended from commit `f8248e1` on 6 October 2026. This report distinguishes tests run during this work from historical reports. The original teammate session excluded presentation/video work; that does not cancel the course demonstration-video requirement.

## Checks run successfully

- `cd site && node check.mjs`: baseline and PUE calculations, response parsers, role boundaries, controlled adviser tools, conversation trust boundary, mocked Responses exchange and advisory citation behavior.
- `cd site && node check_investment.mjs`: identical delivered service across options; member cash plus terminal debt equals resource cost plus interest; lower demand retains fixed/idle costs; one-year grid delay; GPU replacement; electricity/hardware/lease-price sensitivity; base hybrid and half-demand lease ranking; invalid inputs and permissions.
- `cd site && node check_refresh.mjs`: real in-memory SQLite transaction using the production refresh-persistence function; successful insert and timestamp, injected timeout and invalid response retain prior records, subsequent success appends observations.
- `python3 -B check_d1_schema.py`: database constraints, indexes, source provenance, reported zero versus NULL and baseline arithmetic.
- `cd site && python3 -B check_management.py`: actual local HTTP requests and D1 storage. Public pages; anonymous rejection; viewer and editor cannot change the design; reviewed source/claim insertion; origin and invalid-input rejection; saved PUE 1.40 yields 245.28 GWh; saved financial assumptions; role assignment and team boundaries; audit writes. Modified design/settings/test roles are restored.
- `cd site && node node_modules/typescript/bin/tsc --noEmit --incremental false`: TypeScript check.
- `cd site && npm run build`: production build completed.
- All migrations 0000–0003 replayed in SQLite and applied to a fresh local Cloudflare D1 instance. Existing applied migration files were not edited.
- Browser inspection: investment page renders; changing productive utilization from 25% to 12.5% changes the preferred option from hybrid to lease. Evidence page shows classification/search controls.
- Document QA: memo rendered and inspected as two pages; physical system diagram as one page; request-flow/submission guide as two pages.

## Original teammate session limitations (historical)

The checkout contains no `site/.dev.vars`. Live OpenAI/Fingrid credential-dependent tests were not run in this session. `site/check_runtime.py` retains the team's live-AI and prompt-injection tests, and the README records earlier successes. Those are historical evidence, not proof of this version's live deployment. New finance-tool wiring compiles; live model tool selection needs the credentialed runtime suite.

Sites returned `Sites is not yet enabled for this workspace`. Consequently no new version was deployed, no production migration was applied, and production authentication/secrets were not verified. Publication and course-URL submission remain external completion steps.

## Acceptance criteria still requiring real-world evidence

Utility offer, signed university workload commitments, vendor quotations, permitting, water quantities, site-specific emissions and full-load outage/failure tests remain unknown. They are explicit investment gates. Planning analysis is complete enough to request further evidence; it is not a construction-ready engineering approval.

## Local reproduction

From `site/`:

```sh
npm ci
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 migrations apply DB --local --config wrangler.local.json --persist-to .wrangler/state
npm run dev
```

With the preview running, run `python3 -B check_management.py` from another terminal in `site/`. The local preview uses the framework's mock identity, never production identities. The test temporarily changes only local test registration permissions; do not point it at production.

Run the pure checks and TypeScript/build commands listed above. For live AI checks, supply the existing authorized server secret through ignored `.dev.vars`, then run the existing `check_runtime.py`; it makes five small paid requests. Do not commit credentials.

## Follow-up verification on the original workstation

Publication, production migration 0003 and administrator provisioning have since completed. The current original workspace retains local credentials and configured Sites Secrets. See `live-review-2026-10-05.md` for newly rerun checks and the exact live scope; the complete final production regression suite is still pending.
