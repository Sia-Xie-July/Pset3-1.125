// Constant 2026 EUR, years 0 (development) and 1–10 (equal service horizon).
export const ASSUMPTIONS = [
 ['itMW','Full-build IT MW',20,1,100,'Assignment comparison baseline; not demonstrated demand.'],
 ['hours','Annual scheduled hours',8760,1,8784,'Saved design operating-year assumption.'],
 ['pue','PUE target',1.25,1,2,'Assignment target; not measured. [S3] informs cooling design only.'],
 ['kwPerGPU','IT kW per GPU equivalent',1.4,.5,5,'Planning allowance including hosts, storage and fabric. NVIDIA DGX H100 is 10.2 kW / 8 GPUs before external IT; [S15] is a reference, not the selected liquid-cooled product.'],
 ['utilization','Productive utilization',.25,.01,.95,'Uncontracted demand scenario: fraction of available full-fleet hours producing useful work. Not a demand survey.'],
 ['availability','Available fraction of year',.97,.5,1,'Planning scheduling allowance including maintenance; distinct from the 99.9% essential-service target.'],
 ['phaseFraction','Hybrid IT fraction',.4,.05,1,'8 MW IT / 10 MW facility at defaults. Conditional phase, not a committed expansion.'],
 ['facilityPerMW','Facility EUR per IT MW',10000000,1000000,30000000,'Unquoted planning allowance for land, building, power, UPS, generators and cooling; excludes GPU fleet and utility upgrades. Test 7–15 million.'],
 ['gridCost','Full-build grid upgrade EUR',15000000,0,100000000,'Unquoted placeholder. Actual utility offer is NULL. Hybrid assumes proportional cost; test fixed-cost exposure.'],
 ['gpuCost','Installed IT EUR per GPU',40000,5000,100000,'Unquoted GPU, host, fabric and storage allowance. Includes deployment; test 25–60 thousand.'],
 ['replacementYears','IT replacement interval years',4,2,8,'Planning life, constant real replacement price and GPU-equivalent performance; no forecast of technology progress.'],
 ['electricity','Delivered electricity EUR/kWh',.10,.02,.50,'Unquoted all-in planning tariff, including network charges and nonrecoverable electricity taxes. Statistics Finland [S16] provides market context, not a site quote.'],
 ['idleFraction','Idle IT power fraction',.35,.1,.8,'Planning idle-power floor; electricity does not scale directly with productive utilization.'],
 ['leaseUSD','Cloud USD per billed GPU-hour',3.99,.5,15,'Observed Lambda 8-GPU H100 SXM instance rate [S14]; first-come service, not guaranteed large-cluster capacity. Cluster sensitivity: USD 5.54.'],
 ['eurPerUSD','EUR per USD assumption',.92,.5,1.5,'Planning conversion only, not a verified exchange-rate fixing.'],
 ['cloudEfficiency','Productive hours / billed cloud hours',.85,.2,1,'Planning allowance for idle/reserved time, setup and failed jobs; benchmark before procurement.'],
 ['leaseExtras','Cloud storage/network uplift',.10,0,1,'Unquoted allowance on compute rental; procure equivalent storage, networking and data residency.'],
 ['staffPerYear','Full-build annual staffing EUR',3000000,100000,15000000,'Planning 25 FTE × EUR 120,000 loaded; hybrid uses 40% fixed + 60% scale.'],
 ['facilityMaintenance','Annual facility maintenance fraction',.02,0,.1,'Planning maintenance and insurance fraction of facility capex.'],
 ['gpuMaintenance','Annual IT maintenance fraction',.03,0,.15,'Planning support and repair fraction of installed IT capex.'],
 ['cloudAdmin','Annual cloud administration EUR',600000,0,5000000,'Planning security, user support and procurement; charged in every option.'],
 ['discount','Real discount rate',.06,0,.2,'Committee planning hurdle, not an offered financing rate.'],
 ['debtShare','Initial capex debt share',.5,0,.8,'Illustrative financing only; no lender commitment. Replacement funded from members.'],
 ['debtRate','Real debt interest rate',.04,0,.2,'Planning rate; eight annual principal installments from facility opening.'],
 ['facilityRecovery','Abandonment facility recovery',.5,0,1,'Stress liquidation assumption, net of sale costs; not terminal cash-flow income.'],
 ['gpuRecovery','Abandonment IT recovery',.2,0,1,'Stress liquidation assumption, not a resale quotation.'],
];
export const DEFAULTS=Object.fromEntries(ASSUMPTIONS.map(([k,,v])=>[k,v]));
export function validateInputs(raw) {
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||Object.keys(raw).some(k=>!(k in DEFAULTS)))throw Error('Invalid assumptions');
 const a={...DEFAULTS,...raw};
 for(const [k,, ,lo,hi] of ASSUMPTIONS)if(typeof a[k]!=='number'||!Number.isFinite(a[k])||a[k]<lo||a[k]>hi)throw Error(`Invalid ${k}`);
 if(!Number.isInteger(a.replacementYears))throw Error('Replacement interval must be whole years');
 return a;
}
export function model(raw={},option='build',scenario='base') {
 const a=validateInputs(raw);
 if(!['build','lease','hybrid'].includes(option)||!['base','delay','half'].includes(scenario))throw Error('Invalid option/scenario');
 const fullGPU=Math.floor(a.itMW*1000/a.kwPerGPU/8)*8;
 const fraction=option==='lease'?0:option==='hybrid'?a.phaseFraction:1;
 const gpu=Math.floor(fullGPU*fraction/8)*8, itMW=gpu*a.kwPerGPU/1000;
 const demand=fullGPU*a.hours*a.availability*a.utilization*(scenario==='half'?.5:1);
 const opening=option==='lease'?1:(option==='build'?3:4)+(scenario==='delay'?1:0);
 const facility=itMW*a.facilityPerMW, grid=a.gridCost*fraction, fleet=gpu*a.gpuCost;
 const leaseUnit=a.leaseUSD*a.eurPerUSD/a.cloudEfficiency*(1+a.leaseExtras);
 let debt=0;const rows=[];
 for(let year=0;year<=10;year++) {
  const operating=year>=opening&&gpu>0;
  const ownedHours=operating?Math.min(demand,gpu*a.hours*a.availability):0;
  const leasedHours=year?demand-ownedHours:0;
  const u=operating?ownedHours/(gpu*a.hours*a.availability):0;
  // Construction runs in the same scheduled years even if grid energization is delayed.
  const planned=option==='build'?3:4;
  const weights=option==='lease'?{}:{[planned-3]:.2,[planned-2]:.4,[planned-1]:.4};
  const facilityCapex=facility*(weights[year]||0),gridCapex=grid*(weights[year]||0);
  const initialGPU=year===opening-1?fleet:0;
  const replacement=operating&&(year-opening+1)%a.replacementYears===0&&year<10?fleet:0;
  const gpuCapex=initialGPU+replacement;
  const energyGWh=operating?itMW*a.pue*a.hours*(a.idleFraction+(1-a.idleFraction)*u)/1000:0;
  const electricity=energyGWh*1e6*a.electricity;
  const staff=operating?a.staffPerYear*(.4+.6*fraction):0;
  const maintenance=operating?facility*a.facilityMaintenance+fleet*a.gpuMaintenance:0;
  const holding=!operating&&year>0&&year>=planned-1?facility*.01:0;
  const lease=leasedHours*leaseUnit,admin=year?a.cloudAdmin:0;
  const opex=lease+electricity+staff+maintenance+holding+admin;
  const draw=(facilityCapex+gridCapex+initialGPU)*a.debtShare;
  const interest=(debt+draw*.5)*a.debtRate;
  const principal=operating?Math.min(debt+draw,(facility+grid+fleet)*a.debtShare/8):0;
  debt+=draw-principal;
  const capex=facilityCapex+gridCapex+gpuCapex;
  // Resource cost excludes debt flows. Financing is shown separately to avoid counting principal twice.
  const resourceCost=capex+opex;
  const memberCash=resourceCost+interest+principal-draw;
  rows.push({year,facilityCapex,gridCapex,gpuCapex,lease,electricity,staff,maintenance,holding,admin,opex,interest,draw,principal,debt,resourceCost,memberCash,ownedHours,leasedHours,productiveHours:year?demand:0,energyGWh,unusedGPUHours:operating?gpu*a.hours*a.availability-ownedHours:0});
 }
 const sum=k=>rows.reduce((n,r)=>n+r[k],0);
 const pv=k=>rows.reduce((n,r)=>n+r[k]/(1+a.discount)**r.year,0);
 const first=rows[opening];
 const before=rows.filter(r=>r.year<opening);
 const preOpeningCash=before.reduce((n,r)=>n+r.resourceCost+r.interest,0);
 const capitalAtRisk=facility*(1-a.facilityRecovery)+grid+fleet*(1-a.gpuRecovery)+before.reduce((n,r)=>n+r.opex+r.interest,0)+(demand*leaseUnit*.25);
 return {option,scenario,opening,fullGPU,gpu,itMW,demand,rows,preOpeningCash,preOpeningMemberCash:before.reduce((n,r)=>n+r.memberCash,0),annualOperatingCost:first.opex,capitalAtRisk,npvCost:pv('resourceCost'),costPerGPUHour:pv('resourceCost')/pv('productiveHours'),totalCost:sum('resourceCost'),totalInterest:sum('interest'),totalMemberCash:sum('memberCash'),terminalDebt:debt,totalProductiveHours:sum('productiveHours'),unusedCapacityCost:first.unusedGPUHours/(gpu*a.hours*a.availability||1)*(first.staff+first.maintenance+(facility+grid)/20+fleet/a.replacementYears)};
}
export function compare(raw={}) {return ['base','delay','half'].flatMap(s=>['build','lease','hybrid'].map(o=>model(raw,o,s)));}
export function adviserComparison(raw={}) {
 const inputs=validateInputs(raw), results=compare(inputs);
 return {currency:'EUR',price_basis:'Constant 2026 EUR',verified_site_quotes:[],cloud_reference:{source_id:14,price:inputs.leaseUSD,currency:'USD',unit:'per billed GPU-hour',eur_per_usd_assumption:inputs.eurPerUSD,note:'The published reference is USD, not EUR; model costs convert it to EUR and include efficiency and storage/network allowances.'},power_model:'20 MW is full-build IT capacity at defaults, not constant consumption. Operating power depends on productive utilization plus the assumed idle-power floor. Hybrid uses a fraction of full-build capacity.',delay_scenario:'One extra year before owned infrastructure opens; demand is served by cloud rental during the delay.',ranking_basis:'Lowest discounted resource cost over the same 10-year service horizon; excludes financing flows and terminal value',scenarios:['base','delay','half'].map(scenario=>{
  const ranked=results.filter(r=>r.scenario===scenario).sort((a,b)=>a.npvCost-b.npvCost);
  return {scenario,full_fleet_productive_utilization:inputs.utilization*(scenario==='half'?.5:1),lowest_cost_option:ranked[0].option,options_ranked_by_cost:ranked.map(r=>({option:r.option,resource_npv_eur:r.npvCost,eur_per_productive_gpu_hour:r.costPerGPUHour,capital_at_risk_eur:r.capitalAtRisk,opening_year:r.opening}))};
 })};
}
