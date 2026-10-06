# Financial model methodology

The website's `site/lib/investment.mjs` is the deterministic source of truth. `financial-results.json` is a dated snapshot of default assumptions, not a live database export. Every numeric control exposes its classification/basis. All amounts are constant 2026 EUR; exchange rate and debt terms are assumptions. No signed university or vendor commitments are implied.

## Comparable demand

Full fleet = floor(IT MW × 1,000 / kW per GPU / 8) × 8. Annual useful demand = full fleet × saved annual hours × scheduling availability × productive utilization. Default: 14,280 equivalents × 8,760 × 0.97 × 0.25 = 30,335,004 useful hours/year. Half-utilization stress halves that demand. This is an assumed workload proxy, not actual measured demand.

Build opens year 3 and owns the full fleet. Hybrid opens year 4 with 40% of the fleet; expansion beyond that phase is not automatically assumed. Lease starts year 1. All options serve identical useful demand over years 1–10 by leasing before opening and whenever owned capacity is insufficient. Grid stress delays owned opening by one year, retains construction commitments, adds holding and lease bridging, and defers initial GPU purchases. Lease is unaffected by this particular project's grid delay, not immune to provider outages.

## Costs and energy

Facility allowance includes land, building, power/cooling/backup infrastructure and project allowances, but excludes dedicated grid upgrades and installed IT. Installed IT includes GPUs, hosts, storage and internal fabric. Facility spend is 20/40/40% across three pre-opening years; GPUs are purchased in the final pre-opening year. Hardware replacement is a full same-real-cost equivalent fleet every four operating years; no future performance gains are credited. There is no replacement at the horizon end when it would deliver no modeled service.

Owned energy = installed IT MW × PUE × annual hours × [idle fraction + (1 − idle fraction) × productive utilization of owned available capacity] / 1,000 GWh. Productive utilization is capped by available owned capacity. The planning power curve includes an idle floor; it is not an empirical performance curve. Separate availability and productive efficiency must be measured. Staffing, facility/IT maintenance, insurance allowance, cloud administration and construction holding costs are included. Cloud useful-hour cost = USD billed-hour price × EUR/USD / useful-to-billed efficiency × (1 + extras uplift).

Default cloud anchor: Lambda's public H100 SXM eight-GPU instance price of USD 3.99/GPU-hour, accessed 6 October 2026, https://lambda.ai/pricing. This does not establish capacity, residency, bandwidth, workload fit or a long-term quote. USD 5.54 for the displayed 256-GPU cluster is an important sensitivity. The NVIDIA power reference is context for the 1.4 kW/GPU allowance, not a procurement specification or price source. Most capex, staffing, reliability and financing numbers are explicitly unquoted allowances requiring validation.

## Financing and decision metrics

Resource cost = facility + grid + IT capex + operating expenditure. Resource NPV discounts each year's cost at the assumed real discount rate. Levelized useful-hour cost divides resource NPV by discounted useful hours. This avoids comparing options on different delivered output or counting debt principal twice.

The separate financing illustration draws debt for 50% of initial capital only. Interest is charged on beginning debt plus half the current year's draw; equal principal is repaid over eight operating years. Replacement is paid by members. Member cash = resource cost + interest + principal − debt drawn. Total member cash + remaining debt = total resource cost + total interest. Remaining year-10 debt is explicitly disclosed.

Cash before opening is gross resource spending plus interest in years before opening, including leased bridge service. Member cash before opening is separately reported after debt draw. Annual operating cost is the first owned-operation year's recurring cost (year 1 for lease); consult annual rows for all other years. Lease has no pre-opening modeled spend: zero is a declared timing convention, not a missing quotation.

Capital at risk is a specified abandonment exposure: unrecovered initial facility capex (50% recovery assumed), grid cost, unrecovered IT (20% recovery), pre-opening operating spend and interest, and three months of cloud cancellation exposure. This includes sunk bridge expenditure and is not all outstanding future commitments; it is not added to NPV. Obtain actual contracts and liquidation estimates before using it as a financing covenant.

Unused-capacity burden allocates staffing, maintenance and straight-line facility/IT capital consumption to unused available owned hours. It is diagnostic, not another expense. Member fees fund costs; no revenues or profitability are forecast.

## Deliberate limitations and decision reversals

No terminal sale, tax shield, grant or heat-sale revenue is credited; these are explicit conservative conventions. VAT is assumed recoverable. Actual tax treatment, decommissioning liability, escalation, terminal values and debt pricing need institution-specific review. The finite horizon and replacement timing can affect option rankings, especially near year 10; do not interpret small NPV differences as robust proof. Cloud and owned service equivalence is assumed and must be benchmarked with the same training and inference jobs.

At default inputs hybrid costs approximately EUR 3.98/useful hour, versus lease EUR 4.77 and build EUR 7.07. Halving demand changes the ranking: lease EUR 4.79, hybrid EUR 6.17, build EUR 12.86. The grid-delay hybrid is EUR 4.35. These results support a conditional pilot/evidence decision, not a construction approval. Sensitivities expose alternative utilization, tariff, capex, GPU life, exchange, lease and financing assumptions. The three reversal findings are signed demand/alternative access, utility/engineering feasibility, and comparable delivered-compute costs.
