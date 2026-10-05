# Investment Memo for a University AI Datacenter

**To:** University Consortium Investment Committee | October 5, 2026

## Recommendation

We recommend a phased hybrid approach: secure bounded leased compute for initial workloads while validating a Kajaani facility, and defer the full 25 MW construction commitment. Members have no signed long-term compute commitments, and the utility has not confirmed connection cost or timing. This is a conditional recommendation, not a demonstrated cost advantage. Retain build-and-own, lease, and hybrid options in the financial comparison; the committee should approve evidence gathering and return the construction proposal for further evidence.

## Baseline and initial design assumptions

Retain the assignment baseline for comparison; it does not establish that demand justifies 25 MW. All proposed equipment and service capacities below are unverified targets.

| Variable | Initial value | Status |
| --- | --- | --- |
| IT load | 20 MW | Assumed computing, storage and IT networking load |
| PUE | 1.25 | Assumed target, not measured performance |
| Facility electrical load | 25 MW | Calculated from IT load and PUE |
| Annual operating hours | 8,760 hours | 365-day planning basis |
| Annual facility electricity | 219 GWh | Calculated assuming continuous baseline load |

**Location.** Kajaani, Kainuu, Finland, for a hypothetical Finnish university consortium; exact land and access are unsecured. Compare Canada (Québec) and Singapore. Existing LUMI cooling and heat recovery inform the concept [S1], without proving new capacity is available.

**Grid.** Grid primary supply; assess two routes and separate distribution paths against the largest electrical failure. Voltage, ratings and independence need utility confirmation. Regional queues make energization uncertain [S2].

**Backup.** Target 10-minute UPS protection for IT and necessary cooling, then diesel generation. Remaining generator capacity after the largest unit fails must cover 25 MW. A 48-hour full-load target requires 1,200 MWh delivered; the conservative UPS basis is 4.17 MWh before losses and reserves. Fuel volume, permits and reliability are unverified.

**Cooling and water.** Direct-to-chip GPU liquid cooling, residual air cooling, closed loops, dry coolers and supplemental air-cooled refrigeration when required. Redundant pumps and modules need thermal validation [S3]. Avoid routine cooling towers; filling, makeup, sanitation and fire-water needs remain unquantified. No zero-water claim or heat-sale revenue is assumed.

**Network and electricity.** Assume two diverse external fiber routes, provisionally 100 Gbit/s each, plus an internal GPU fabric sized to workloads. Grid supply includes nuclear and renewables [S4]; assess renewable contracts. Assume no dedicated onsite solar, wind or gas generation. Annual procurement does not establish hourly renewable supply.

## Three findings most likely to change the recommendation

### Finding 1 Contracted demand justifies owned capacity

Signed, funded member commitments establish productive GPU-hours, workload timing, security and availability needs. Demand exceeding what accessible existing facilities can supply could support construction; weak or intermittent demand favors leasing or a smaller phase. Set a build threshold using the cost model rather than an invented utilization cutoff.

### Finding 2 A viable grid offer and reliable design are secured

A site-specific offer confirms usable capacity, upgrades, price and energization. Electrical failure analysis and equipment evidence establish cooling continuity, water service, fiber diversity and the 48-hour backup target. Timely, affordable access supports building; delay, shared failure points or costly upgrades favor relocation, leasing or deferral.

### Finding 3 The ten year comparison changes the preferred option

Comparable quotes and a ten-year cash-flow model show whether ownership beats lease or hybrid at agreed service levels. Separate facility and GPU costs, including construction, grid upgrades, electricity, staffing, maintenance, finance, replacement and unused capacity. A durable advantage could justify building; competitive existing compute or expensive renewal favors leasing.

## Required stress cases and investment exposure

**Base case.** Assume the baseline load for initial engineering comparison, but forecast energy from actual load profiles. Operating continuously does not imply full productive utilization. GPU models, numbers and commitments remain unresolved.

**Grid power one year late.** Defer full opening and assess temporary leased compute. Model extra financing, holding and interim-compute costs and delayed revenue. Avoid assuming a year of operation on standby generators; keep GPU purchases tied to energization.

**GPU utilization halved.** Reduce forecast productive GPU-hours by half. With unchanged annual cost, unit cost doubles; actual costs need a separate idle-power and cooling model. Lower demand may require a smaller build phase.

**Engineering sensitivity.** If PUE reaches 1.40, 20 MW IT requires 28 MW facility power. At a fixed 25 MW limit, supported IT falls to about 17.9 MW. Test summer conditions, equipment compatibility and failure operation; the uptime target still requires consortium agreement.

**Decision evidence still needed.** For each scenario, report pre-opening cash, annual operating cost, cost per productive GPU-hour and capital at risk. These monetary results are not yet established. Obtain quotes and the cash-flow model before construction approval; report nonrecoverable spending and contractual exposure explicitly.

**Conditional ownership plan.** If building is later justified, the consortium should own the facility and shared infrastructure, procure GPUs in phases, and contract utility supply, specialist construction and appropriate operating services. Allocate delay and withdrawal risk in contracts before debt or equipment commitments.

## Evidence references

[[S1] LUMI FAQ](https://lumi-supercomputer.eu/faq/) Kajaani warm-water cooling and heat recovery; page undated.

[[S2] Fingrid connection outlook](https://www.fingrid.fi/en/news/news/2026/electricity-consumption-is-set-to-increase-sharply--more-balancing-power-will-also-be-needed/) August 18, 2026; regional connection queues.

[[S3] DOE data center design guide](https://www.energy.gov/sites/default/files/2024-07/best-practice-guide-data-center-design.pdf) July 2024; cooling and electrical design guidance.

[[S4] Statistics Finland electricity production](https://stat.fi/en/publication/cm1hs1qfy32tf07w5nzls9o0b) 2024 data: 95% fossil-free, 57% renewable domestic production; not site supply.

Sources accessed October 5, 2026. Assumptions are not verified site performance.
