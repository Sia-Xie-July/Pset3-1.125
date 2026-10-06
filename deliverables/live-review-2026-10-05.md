# Live review — 5 October 2026 (America/New_York)

This follow-up supersedes the earlier teammate-workspace publication blockers. The original workstation has Sites access and configured OpenAI/Fingrid Secrets. No credential values are included here.

Final publication: Site version 12, source `b3d73f3dfe38bbbbb192b2d0003ea763d5748f82`, succeeded at `2026-10-06T02:03:12.796413+00:00` with environment revision 4 (temporary administrator configuration removed).

## Completed

- Published the teammate changes and applied production migration `0003_project_management.sql`; `model_settings` and `project_audit` were confirmed in live D1. Existing design data survived.
- The owner explicitly authorized administrator access for their account. The signed-in account page verified the requested email and numeric account ID 1; its stable D1 identity was matched through server-only configuration. The persisted role is `team_admin`, team 1, with an atomic provisioning audit. The temporary configuration was removed and the removal deployed. There is no public bootstrap endpoint or automatic first-user promotion.
- The administrator management forms render. A production re-save of the existing 20 MW / PUE 1.25 / 8,760-hour baseline succeeded and was checked in D1. Numerical inputs remained unchanged; assumption/calculation text and the verification timestamp were updated by the normal save path.
- Country Comparison now uses a Hydro-Québec-specific missing-demand message for Canada, never the Fingrid carbon message. NULL observations are excluded from the card's numeric selection.
- S9/S10 and S12/S13 are explicitly optional, inactive integrations. Curated references are labeled for manual review. S8 remains an enabled historical dataset, not a current annual supply observation.
- The Québec refresh root causes were reproduced: Cloudflare does not implement `redirect: 'error'`, and the provider returns HTTP 403 for requests without a User-Agent. The shared approved-source loader now uses `manual`, rejects non-2xx responses, and identifies the application with a User-Agent. It still accepts only backend-defined URLs and preserves existing observations on failure.
- Real production refreshes succeeded for S6, S7, S8 and S11, with no remaining refresh errors in their source records:
  - S6: `2026-10-06T01:50:25.925Z`
  - S7: `2026-10-06T01:50:32.028Z`
  - S8: `2026-10-06T01:50:45.878Z`
  - S11: `2026-10-06T01:50:46.110Z`
- A signed-in production adviser request returned the saved baseline correctly (25 MW and 219 GWh/year), real source links, and 3 tool calls. Its loose wording around PUE/efficiency and climate rationale prompted clearer agent instructions. Citation warnings remain advisory, per the owner's earlier request.
- Production finance QA initially failed despite a successful tool call: the adviser reversed scenario winners, used USD instead of EUR, and confused undiscounted costs with resource NPV. The tool now returns compact, explicitly ranked scenarios with named EUR fields, utilization, power-model limitations and no verified site quotes. Version 10 returned the correct winners and NPV values, but still mislabeled public references as quotes and omitted structured classifications; further instructions were added before final verification. These observations demonstrate that API connectivity and valid source IDs alone do not establish semantic correctness.
- Reran `node check_admin.mjs`, `node check.mjs`, `node check_refresh.mjs`, TypeScript and production build successfully. The administrator test uses real SQLite to check exact identity/ID matching, invalid configuration, foreign teams, existing administrators, transactional audit and one-time behavior. HTTP error and retention behavior are covered by the refresh check.
- `node check_investment.mjs` additionally verifies the adviser tool's EUR fields, base/half scenario winners and saved utilization, using the same deterministic calculations as the investment page.
- Final version 12 live request 7 used the finance tool and correctly returned base hybrid NPV EUR 889,427,768, half-utilization lease NPV EUR 534,728,101, the other scenario costs and the original USD 3.99/billed-GPU-hour reference. Structured assumption/calculation/decision sections rendered. However, the model still put hardware/market references under a “Verified Quotes” heading and cited S3 from an assumption note without retrieving its full source record. The existing citation warnings surfaced this issue and the generated answer remained visible as requested. Financial arithmetic/currency checks passed; quotation classification and complete citation fidelity did NOT pass. Do not mark Step 21 complete or treat this sample as a full agent evaluation.
- A direct production POST to `/api/adviser` without a signed-in identity (normal User-Agent, valid same-origin JSON) returned HTTP 401 with `Sign in with ChatGPT to continue.` No paid model call was made for that check.

## Evidence still missing

Comparable datacenter counts/capacity, selected-site hourly climate/extreme conditions, water availability and peak cooling demand, fiber routes/latency, binding utility offers, vendor quotes and signed workload commitments remain unresolved. The current sources provide context, not those numerical measurements. NULL remains correct; these are evidence gaps, not completed research.

## Remaining verification and submission

Production role assignment to another person, reviewed-evidence addition and finance saving were not performed using disposable real identities or invented evidence. Their local acceptance tests passed previously. The complete final production adversarial/rate-limit regression suite has not been rerun. Agent citation fidelity and quotation classification require further evaluation and correction; warnings are not evidence that the underlying generated claim is correct. Record and submit the two-minute demonstration video and submit the published URL to the course document. Verify any separate presentation requirement against the course brief.


## Step 21–23 follow-up (later on 5 October, New York)

Version 13 was published successfully at `2026-10-06T02:23:42.777839+00:00` (10:23 p.m. New York), source `f2b373f6960acb00c9d72b83417a4c2e566feb45`, environment revision 4. This supersedes the version-12 Step 21 failures above for the tested cases.

The final local real-AI run passed all six requests, with consistent D1-backed citation identifiers, correct original USD versus computed EUR costs, explicit absence of verified site procurement quotes, saved-PUE propagation, missing-data recognition and ignored malicious source/history instructions. Protected refresh, request limits, editor/admin actions and failure-state UI checks passed too. Detailed test environments and the twelve Step 22 cases are in test-results.md; raw successful answers are in step-21-23-live-answers.json. Prompt-injection and mutating identity/design fixtures were confined to local D1 and restored; this is not a claim that those destructive fixtures ran on production.


Final version 14 published at `2026-10-06T02:31:33.260728+00:00`, source `e59734f7ea036141f897fa53aca96aaf1e67a031`, environment revision 4. The extra production review exposed a mixed-scope original D1 claim: Fingrid’s national information had been combined with our lack of a verified site offer and marked evidence. The exact original record is now unknown/unresolved; LUMI’s example has explicit site limitations. Read-only production D1 inspection confirmed both corrections. Local repeat-run checks preserve later editor modifications.

All final local Step 22/23 cases passed again (six real AI answers, 29,278 input / 1,425 output tokens). Public production/anonymous/spoofed-identity/origin checks passed on version 14. Request 10 answered the current PUE/energy and LUMI context correctly but missed parts of a compound question and left uncertainty empty, so it is not a full semantic pass. Focused real production request 11 correctly described absent grid offers/capacity, contextual national evidence, LUMI limitations and the proposal’s non-construction-ready status, with real S1/S2 links, uncertainty entries and no citation warning. Proof is saved as step-21-23-production.txt/png. These results supersede the older pending local adviser checks above; production destructive fixtures and course/video submission remain outside this run.
