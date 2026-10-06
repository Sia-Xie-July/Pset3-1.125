import { env } from 'cloudflare:workers';
import { database, queryApprovedSource } from './data';
import { energy } from '../lib/core.mjs';
import { MODEL, runAgent, historyInput } from '../lib/adviser.mjs';

// Only this website's public design is exposed; tools cannot select private teams or tables.
export const adviserConfigured = () => Boolean(env.OPENAI_API_KEY);
const latest = `NOT EXISTS (SELECT 1 FROM metrics n WHERE n.source_id=m.source_id AND n.country_id=m.country_id AND n.metric_name=m.metric_name AND n.category=m.category AND n.unit=m.unit AND n.geographic_scope=m.geographic_scope AND (n.reporting_period>m.reporting_period OR (n.reporting_period=m.reporting_period AND n.id>m.id)))`;
export async function advise(userId:number,question:string,rawHistory:unknown) {
  const history=historyInput(rawHistory as any);
  if(!env.OPENAI_API_KEY)throw Error('adviser_not_configured');
  const db=database(), now=Math.floor(Date.now()/1000), day=now-now%86400;
  await db.prepare('DELETE FROM adviser_requests WHERE created_at<?').bind(now-30*86400).run();
  // One conditional INSERT makes concurrent reservations atomic across Worker isolates.
  const request=await db.prepare(`INSERT INTO adviser_requests(user_id,created_at,model) SELECT ?,?,? WHERE
    (SELECT count(*) FROM adviser_requests WHERE user_id=? AND created_at>?)<6 AND
    (SELECT count(*) FROM adviser_requests WHERE user_id=? AND created_at>=?)<40 AND
    (SELECT count(*) FROM adviser_requests WHERE created_at>=?)<200 AND
    NOT EXISTS(SELECT 1 FROM adviser_requests WHERE user_id=? AND status='pending' AND created_at>?) RETURNING id`)
    .bind(userId,now,MODEL,userId,now-600,userId,day,day,userId,now-120).first<{id:number}>();
  if(!request)throw Error('adviser_rate_limit');
  const usage={input_tokens:0,output_tokens:0,tool_calls:0};
  const sourceIds=new Set<number>();
  const sources=new Map<number,any>(), periods=new Map<number,Set<string>>(), retrievalTimes=new Map<number,Set<string>>();
  async function withSources(records:any[],field='source_id') {
    const ids=[...new Set(records.map(r=>r[field]).filter(Number.isInteger))] as number[];
    if(!ids.length)return [];
    const rows=await db.prepare(`SELECT id,publisher,title,url,source_type,publication_date,accessed_at,verification_status,last_refresh_at,last_refresh_status,notes FROM sources WHERE id IN (${ids.map(()=>'?').join(',')})`).bind(...ids).all<any>();
    for(const source of rows.results){sources.set(source.id,source);sourceIds.add(source.id);}
    for(const r of records)if(r.reporting_period&&r.source_id){if(!periods.has(r.source_id))periods.set(r.source_id,new Set());periods.get(r.source_id)!.add(r.reporting_period);}
    for(const r of records)if(r.retrieved_at&&r.source_id){if(!retrievalTimes.has(r.source_id))retrievalTimes.set(r.source_id,new Set());retrievalTimes.get(r.source_id)!.add(r.retrieved_at);}
    return rows.results;
  }
  async function getDesign() {
    const d=await db.prepare('SELECT d.*,c.name AS country,c.region FROM designs d LEFT JOIN countries c ON c.id=d.selected_country_id WHERE d.id=1 AND d.team_id=1').first<any>();
    if(!d)throw Error('design_unavailable');
    return {...d,classification:'Proposed design assumptions, not measured facility performance',baseline_calculation:{...energy(d.it_load_mw,d.pue,d.annual_operating_hours),formula:'facility_mw = it_load_mw × pue; annual_gwh = facility_mw × operating_hours / 1000',assumption:'Constant load for all operating hours'}};
  }
  async function savedMetrics(country:string,names:string[]) {
    const rows=await db.prepare(`SELECT m.*,c.name AS country FROM metrics m JOIN countries c ON c.id=m.country_id WHERE c.name=? AND m.metric_name IN (${names.map(()=>'?').join(',')}) AND ${latest} ORDER BY m.reporting_period DESC,m.id DESC LIMIT 25`).bind(country,...names).all<any>();
    return {metrics:rows.results,sources:await withSources(rows.results),missing_metrics:names.filter(n=>!rows.results.some(r=>r.metric_name===n)),limit:25};
  }
  let externalCalls=0;
  async function execute(name:string,a:any):Promise<any> {
    switch(name) {
      case 'get_design':return getDesign();
      case 'get_country_metrics':return savedMetrics(a.country,a.metric_names);
      case 'get_design_claims':{
        const rows=await db.prepare('SELECT * FROM design_claims WHERE design_id=1 ORDER BY id LIMIT 30').all<any>();
        return {claims:rows.results,sources:await withSources(rows.results)};
      }
      case 'calculate_energy':return {classification:'Hypothetical deterministic calculation; saved design unchanged',inputs:a,...energy(a.it_load_mw,a.pue,a.operating_hours),formula:'facility_mw = it_load_mw × pue; annual_gwh = facility_mw × operating_hours / 1000',limitation:'Constant load, not utilization-dependent or site-measured energy'};
      case 'query_approved_external_source':{
        if(externalCalls++>=1)throw Error('external_tool_budget_exceeded');
        const sourceRecords=await withSources([{source_id:a.source_id}]);
        try {const live=await queryApprovedSource(a.source_id);await withSources(live.records);return {status:'live',...live,sources:sourceRecords};}
        catch {
          const rows=await db.prepare(`SELECT m.* FROM metrics m WHERE m.source_id=? AND ${latest} ORDER BY m.reporting_period DESC LIMIT 15`).bind(a.source_id).all<any>();
          return {status:'failed',error:'Approved API could not be retrieved or validated. Last valid saved records retained; these are not a successful live observation.',metrics:rows.results,sources:rows.results.length?await withSources(rows.results):sourceRecords,attempted_at:new Date().toISOString()};
        }
      }
      default:throw Error('unknown_tool');
    }
  }
  try {
    const design=await getDesign();
    const claims=await db.prepare('SELECT * FROM design_claims WHERE design_id=1 ORDER BY id LIMIT 30').all<any>();
    // ponytail: small keyword ranking for initial context; controlled tools handle semantic follow-ups.
    const words=question.toLowerCase().match(/[a-z]{3,}/g)||[];
    const relevant=claims.results.map(c=>({c,score:words.filter(w=>(c.claim_text+' '+c.notes).toLowerCase().includes(w)).length})).sort((a,b)=>b.score-a.score).slice(0,6).map(x=>x.c);
    const context={design,claims:relevant,sources:await withSources(relevant),approved_countries:['Finland','Canada','Singapore'],metric_names:['electricity_consumption','electricity_demand','electricity_generation','electricity_generation_fuel_share','electricity_generation_carbon_intensity','electricity_peak_demand'],retrieval_time:new Date().toISOString()};
    const answer=await runAgent({key:env.OPENAI_API_KEY,question,history,context,execute,sourceIds,usage});
    const citations=answer.evidence_used.map((id:number)=>({...sources.get(id),reporting_periods:[...(periods.get(id)||[])],retrieval_times:[...(retrievalTimes.get(id)||[])]}));
    await db.prepare("UPDATE adviser_requests SET status='succeeded',completed_at=?,input_tokens=?,output_tokens=?,tool_calls=? WHERE id=?").bind(Math.floor(Date.now()/1000),usage.input_tokens,usage.output_tokens,usage.tool_calls,request.id).run();
    return {...answer,citations,usage:{...usage,model:MODEL},request_id:request.id};
  } catch(error:any) {
    await db.prepare("UPDATE adviser_requests SET status='failed',completed_at=?,input_tokens=?,output_tokens=?,tool_calls=?,error_code=? WHERE id=?").bind(Math.floor(Date.now()/1000),usage.input_tokens,usage.output_tokens,usage.tool_calls,(/^[a-z_]{1,80}$/.test(error.message||'')?error.message:'request_failed'),request.id).run();
    throw error;
  }
}
