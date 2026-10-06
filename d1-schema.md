# D1 Schema and Verified Source Mapping

The canonical working schema is **`d1-schema.sql` in this directory**. Maintain that file for future schema changes instead of creating successive schema copies. All project changes now belong in `Pset3-1.125`. This directory's schema supersedes the earlier draft in `ps_3`.

The six assignment content tables are retained. Registration uses the stable Sites ChatGPT user ID. Legacy `sessions`, `auth_limits` and password fields remain inactive to preserve applied migration history; the application no longer uses them. `site/db/schema.ts` is generated from the canonical SQL using `sync_schema.py`; append migrations and keep applied migrations immutable. Source registrations and metric imports remain separate from schema migrations.

## What the teammate completed

`data-source.md` supplies a useful source inventory, dataset identifiers, and candidate endpoints. It also explicitly describes some endpoints as untested. No website integration code, imported dataset, or hosted database was present in the directory when checked.

Read-only HTTP requests on **2026-10-05** independently confirmed the following responses. `api-verification.json` records response metadata and a few samples; it is not a full dataset archive or proof of website integration.

| Source | Verification Result | Scope and Limitations |
| --- | --- | --- |
| [Hydro-Québec demand](https://www.hydroquebec.com/documents-data/open-data/electricity-demand-quebec/) | Official JSON link returned HTTP 200 and demand records. | Québec excluding off-grid regions; MW; 15-minute updates; raw data with no quality guarantee; CC BY-NC 4.0. |
| [Hydro-Québec generation](https://www.hydroquebec.com/documents-data/open-data/electricity-generation-quebec/) | Official JSON link returned HTTP 200 and generation categories. | Hourly MW, including real or estimated power from Hydro-Québec and contracted suppliers. Not an annual percentage mix or a complete Canadian national statistic. |
| [Singapore fuel mix](https://data.gov.sg/datasets/d_dec34f3ed7daeb6429c8d8b7c36852d2/view) | REST query returned HTTP 200, `success=true`, and 68 records. The poll-download endpoint also returned a ready download response. | EMA; 2005–June 2021; percentages; 2021 is partial. Tested without a key, but rate limits still apply. |
| [Singapore peak demand](https://data.gov.sg/datasets/d_926d3e304c0b41e56d4cbd3304acf105/view) | REST query returned HTTP 200, 100 records on the first page, and a total of 199. | EMA; MW; coverage through July 2021. Pagination is required to retrieve the full dataset. |
| [Singapore carbon intensity](https://data.gov.sg/datasets/d_bc140b67a8708ba19c39d69182893f31/view) | REST query returned HTTP 200 and 7 records. | Publisher is **NEA**, not EMA. Unit is **kgCO2/kWh**. Coverage is **2007–2013**, not current grid conditions. |
| [Fingrid instructions](https://data.fingrid.fi/en/instructions) and datasets [124](https://data.fingrid.fi/en/datasets/124), [266](https://data.fingrid.fi/en/datasets/266), [241](https://data.fingrid.fi/en/datasets/241) | Dataset descriptions, units, licensing, and API-key requirement confirmed. Dataset 124 latest-consumption retrieval returned HTTP 200 with the provided server key. | Official API base is **https://data.fingrid.fi/api**. Dataset 124 uses `https://data.fingrid.fi/api/datasets/124/data/latest`; datasets 266/241 still require exact-endpoint and response verification. The credential is stored only in runtime secrets. National Finland data does not establish Kajaani site capacity. |
| [Epoch AI documentation](https://epoch.ai/data/data-centers-documentation) | Official CSV returned HTTP 200 and 93 parsed site records. | Optional estimate dataset; CC BY attribution. Not a complete national datacenter census or a REST API. The claimed October 2 update date was not independently established. |
| [EMA Singapore Energy Statistics, Chapter 2](https://www.ema.gov.sg/resources/singapore-energy-statistics/chapter2) | Current reference page and the listed 2024 values were confirmed through the web research tool. | Curated webpage evidence, not an API. It also reports 2024 grid emission factor of 0.402 kgCO2/kWh, providing newer context than the historical NEA dataset. |

This is enough to proceed with schema and website work. It does not establish a complete, comparable three-country dataset. Site-specific tariffs, connection capacity, cooling water, and other unresolved design conditions still need evidence.

## Tables

| Table | Information Stored |
| --- | --- |
| `users` | Stable Sites-authenticated user ID, registration date, team identifier and server-assigned role. New registrations store no passwords. Legacy email/name/hash fields are inactive; email does not link identities or grant permissions. |
| `sessions` | Legacy session storage, inactive after restoring Sites authentication. Old cookies are ignored. |
| `auth_limits` | Legacy authentication-limit storage, inactive; authentication is handled by Sites. |
| `countries` | Finland, Canada, and Singapore; candidate region such as Kainuu or Québec. |
| `sources` | Citation details, dataset ID, documentation URL, confirmed request/download URL, license, authentication method, verification status, and refresh outcome. |
| `metrics` | One numerical observation per row, with category, unit, value classification, geography, reporting period, original timestamp, source linkage, retrieval time, confidence, and definition notes. |
| `designs` | Current IT load, PUE, annual operating hours, selected country, cooling, backup, and summary. |
| `design_claims` | Evidence, assumptions, calculations, design decisions, and unknowns supplied to the website and AI. |
| `adviser_requests` | Atomic rate-limit reservations and 30-day metadata-only audit: user ID, UTC epoch timestamps, status, model, input/output tokens, tool count and sanitized error code. Questions and answers are not stored. |

## Additions needed for these sources

| Table | Added Fields | Reason |
| --- | --- | --- |
| `sources` | `documentation_url`, `dataset_id`, `endpoint_url` | Separate citation pages from dataset identifiers and actual request URLs. Leave unconfirmed endpoints NULL. |
| `sources` | `auth_type`, `auth_header`, `license` | Record access requirements and attribution/use conditions without storing credentials. |
| `sources` | `verification_status`, `verified_at` | Distinguish source discovery, documentation review, successful endpoint tests, and missing-key cases. |
| `sources` | `last_refresh_at`, `last_refresh_status`, `last_refresh_error`, `notes` | Support visible freshness and a sanitized refresh-failure explanation. |
| `metrics` | `category` | Store separate fuel types or generation technologies without combining them into one number. |
| `metrics` | `value_kind` | Distinguish reported values, estimates, forecasts, and calculations. A prediction is not an observed result. |
| `metrics` | `source_timestamp`, `source_timezone`, `source_record_id` | Retain original source dates and identifiers without inventing a timezone or losing API row provenance. |

`geographic_scope`, `annual_operating_hours`, and claim `updated_at` are retained from the earlier project draft. Confidence and definition notes are now required for every metric.

## Import mapping

| Dataset | Response Fields | Metric Name / Category | Unit / Value Kind |
| --- | --- | --- | --- |
| Hydro-Québec demand | `details[].date`, `details[].valeurs.demandeTotal` | `electricity_demand`; empty category | MW / reported |
| Hydro-Québec generation | `details[].date`, `details[].valeurs.{total,hydraulique,eolien,autres,solaire,thermique}` | `electricity_generation`; retain the original category name | MW / estimate until the method for each field is established |
| Singapore fuel mix | `result.records[].year`, `energy_products`, `percentage` | `electricity_generation_fuel_share`; category = energy product | % / reported |
| Singapore peak demand | `year`, `mth`, `peak_system_demand_mw` | `electricity_peak_demand`; period = year and month | MW / reported |
| Singapore carbon intensity | `year`, `carbon_intensity_of_electricity_generation` | `electricity_generation_carbon_intensity`; period = year | kgCO2/kWh / reported |
| Fingrid 124 | `{datasetId,startTime,endTime,value,modifiedAtUTC}` authenticated response verified. | `electricity_consumption`; 15-minute periods | MWh/h / reported, with estimated components explained |
| Fingrid 266 | Exact authenticated response remains untested. | `electricity_generation_carbon_intensity`; 3-minute periods | gCO2/kWh / estimate |
| Fingrid 241 | Exact authenticated response remains untested. | `electricity_production`; 15-minute periods | MW / forecast |
| Epoch optional CSV | `Country`, `Name`, `Current power (MW)`, `Current total capital cost (2025 USD billions)` | Separate facility power and capital-cost estimates; geographic scope identifies the facility. | MW or 2025 USD billions / estimate |

API numbers may arrive as strings. Parse and validate finite numeric values before storage. Preserve original units. If converting Singapore kgCO2/kWh to Finland's gCO2/kWh, multiply by 1,000 deterministically and label the converted result as a calculation with its original value and source. Energy quantities and instantaneous/average power must not be directly compared as the same metric.

## Verification findings that affect import logic

- Hydro-Québec's demand feed includes missing future values. Its generation feed includes future rows with `total=0`; these are not proof of zero generation. Respect `recentHour` and documented coverage, skip future placeholders, and preserve genuine reported zero values such as a zero solar category in a valid observation.
- Hydro-Québec timestamps contain no UTC offset. Keep the raw timestamp and leave `source_timezone` NULL until its convention is confirmed; do not silently treat it as UTC.
- Singapore's API HTTP `Last-Modified` reflects the response, not the reporting year. The source pages list a 2024 update while the actual observations stop in 2021 or 2013. Display the reporting period separately from retrieval and update dates.
- `tested` means the endpoint returned a structurally usable response. It does not mean every value is verified, the complete dataset was retrieved, or FR4 has been implemented in the website.
- `last_refresh_status` starts as `never`; a manual research test does not count as a successful website-to-D1 refresh.
- A refresh must validate the full intended batch before an atomic write. On failure, keep previously valid observations and record a sanitized error. Never persist secrets in URLs or errors.
- Select current observations by reporting period within the same country, source, metric, category, unit, and geographic scope. A later retrieval of an older reporting period must not replace a newer observation.
- Keep `claim_type` values as `evidence`, `assumption`, `calculation`, `design_decision`, and `unknown`. External forecasts and estimates used as design inputs are assumption claims, with their provenance and limitations retained. Evidence may establish what a publisher reported without making that estimate a measured facility fact.
- Calculate facility load and baseline annual energy from the current design inputs. Refresh any stored explanatory calculation claims when their inputs change.
- Backend identity, role, and team checks are still required; schema constraints do not implement authorization.

Indexes support metric lookup, design-claim retrieval and unique authenticated identities. Sign in with ChatGPT establishes identity; server-side D1 lookups establish registration and permissions. Anonymous protected requests return 401, signed-in unregistered requests return 403, and only registered project editors can refresh evidence. New registrations always receive viewer access and no automatic team privileges. Legacy accounts are not linked by email; existing design/evidence data and applied migrations are preserved.

## AI adviser request limits

`adviser_requests` is introduced by the appended migration `site/drizzle/0002_dapper_betty_ross.sql`. A conditional `INSERT ... SELECT ... RETURNING id` reserves a request atomically: one active request per user (120-second reservation window), 6 requests per 10 minutes, 40 per UTC day, and 200 requests per UTC day across the site. Failed requests also count; no model call occurs when a reservation is rejected. Two timestamp indexes support these checks. Audit metadata expires after 30 days.

The five adviser tools expose only the current public team-1 design, bounded country metrics, design claims, deterministic energy arithmetic and four fixed approved API feeds. The model cannot submit SQL, arbitrary URLs, credentials, or edits. The tool's team ID is **1** for this website; the assignment's team ID 4 is an illustrative example. Source links are generated only for records actually retrieved from `sources`. At the user's request, citation discrepancies return a visible warning alongside the original answer, rather than withholding it; unverified IDs receive no fabricated source links.
