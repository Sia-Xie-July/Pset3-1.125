import { snapshot } from './data';
import { energy } from '../lib/core.mjs';
import { Calculator } from './widgets';
export const dynamic = 'force-dynamic';
export default async function Overview() {
  let data;
  try { data = await snapshot(); } catch { return <div className="notice">Evidence storage is temporarily unavailable. Please reload to try again.</div>; }
  const { design, sources, metrics } = data;
  const values = energy(design.it_load_mw, design.pue, design.annual_operating_hours);
  return <>
    <div className="page-heading"><div><p className="eyebrow">University AI infrastructure / Initial concept</p><h1>A decision before a datacenter.</h1><p>Evaluate a shared facility in Kajaani, Finland against leasing and a phased hybrid.</p></div><span className="badge decision">Conditional recommendation</span></div>
    <div className="stat-grid">
      <div className="stat"><span>IT design load</span><strong>{design.it_load_mw}<small> MW</small></strong><span className="badge assumption">Assumption</span></div>
      <div className="stat"><span>PUE target</span><strong>{design.pue.toFixed(2)}</strong><span className="badge assumption">Assumption</span></div>
      <div className="stat"><span>Facility load</span><strong>{values.facility_mw}<small> MW</small></strong><span className="badge calculation">Calculation</span></div>
      <div className="stat"><span>Baseline electricity</span><strong>{values.annual_gwh}<small> GWh/year</small></strong><span className="badge calculation">Calculation</span></div>
    </div>
    <div className="two-column"><section className="panel recommendation"><p className="eyebrow">Current recommendation</p><h2>Lease first. Build when justified.</h2><p>{design.design_summary}</p><p>Approve evidence gathering and bounded leased compute. Return the full 25 MW construction commitment for further evidence.</p><a className="text-link" href="/initial-design">Review the proposed system</a></section><Calculator it={design.it_load_mw} pue={design.pue} hours={design.annual_operating_hours}/></div>
    <section className="section"><div className="section-heading"><h2>Three findings that could change the decision</h2><span className="muted">Currently unresolved</span></div><div className="three-column">
      <article className="panel finding"><span className="number">01</span><h3>Contracted university demand</h3><p>Signed, funded commitments establish productive GPU-hours, workload timing and required service levels.</p></article>
      <article className="panel finding"><span className="number">02</span><h3>A viable grid offer</h3><p>Confirm usable capacity, cost and energization date, then test electrical and cooling failure paths.</p></article>
      <article className="panel finding"><span className="number">03</span><h3>A ten-year cost advantage</h3><p>Compare facility and GPU costs separately for build, lease and hybrid. Monetary results are still unknown.</p></article>
    </div></section>
    <section className="panel"><div className="section-heading"><h2>Evidence readiness</h2><a href="/evidence">Inspect sources</a></div><div className="readiness"><div><strong>{sources.filter((s:any)=>s.verification_status==='tested').length}</strong><span>Endpoints tested in research</span></div><div><strong>{sources.filter((s:any)=>s.last_refresh_status==='succeeded').length}</strong><span>Datasets imported into this site</span></div><div><strong>{metrics.length}</strong><span>Latest metric records displayed</span></div><div><strong>{sources.some((s:any)=>s.id===11&&s.last_refresh_status==='succeeded')?'Connected':'Configured'}</strong><span>Fingrid consumption API</span></div></div><p className="footnote">8,760 hours assumes continuous baseline load. Operating hours are separate from productive GPU utilization. National statistics do not establish site-level capacity.</p></section>
  </>;
}
