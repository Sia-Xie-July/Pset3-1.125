import { persistRefresh } from '../lib/source-refresh.mjs';
import { env } from 'cloudflare:workers';
import seed from '../db/seed.json';
import research from '../db/research.json';
import { DEFAULTS } from '../lib/investment.mjs';
import { hydroRecords, singaporeRecords, fingridRecords } from '../lib/core.mjs';

export function database() {
  if (!env.DB) throw Error('Evidence database unavailable');
  return env.DB;
}
let initialized: Promise<void> | null = null;
export async function ensureSeed() {
  if (initialized) return initialized;
  initialized = (async () => {
    const db = database();
    const exists = await db.prepare('SELECT id FROM designs WHERE id = 1').first();
    const statements: D1PreparedStatement[] = [];
    for (const [table, rows] of Object.entries(exists ? research : {countries:seed.countries,sources:[...seed.sources,...research.sources],designs:seed.designs,metrics:[...seed.metrics,...research.metrics],design_claims:[...seed.design_claims,...research.design_claims]})) {
      for (const row of rows as Record<string, unknown>[]) {
        const columns = Object.keys(row);
        statements.push(db.prepare(`INSERT INTO ${table} (${columns.join(',')}) VALUES (${columns.map(() => '?').join(',')}) ON CONFLICT(id) DO NOTHING`).bind(...Object.values(row)));
      }
    }
    statements.push(db.prepare('INSERT INTO model_settings(id,inputs_json,updated_at) VALUES(1,?,?) ON CONFLICT(id) DO NOTHING').bind(JSON.stringify(DEFAULTS),new Date().toISOString()));
    await db.batch(statements);
    // Bootstrap a bounded set of approved, key-free datasets once; future refreshes require an editor.
    if(!exists) await Promise.allSettled([refreshSource(6), refreshSource(7), refreshSource(8), ...(env.FINGRID_API_KEY ? [refreshSource(11)] : [])]);
  })().catch(error => { initialized = null; throw error; });
  return initialized;
}
const specs: Record<number, { url: string; country: number; parser: (value: any) => any[] }> = {
    6: { url: 'https://www.hydroquebec.com/data/documents-donnees/donnees-ouvertes/json/demande.json', country: 2, parser: body => hydroRecords(body) },
    7: { url: 'https://www.hydroquebec.com/data/documents-donnees/donnees-ouvertes/json/production.json', country: 2, parser: body => hydroRecords(body, true) },
    8: { url: 'https://data.gov.sg/api/action/datastore_search?resource_id=d_dec34f3ed7daeb6429c8d8b7c36852d2', country: 3, parser: singaporeRecords },
    11: { url: 'https://data.fingrid.fi/api/datasets/124/data/latest', country: 1, parser: fingridRecords },
  };
async function approvedRecords(id:number) {
  const spec=specs[id];
  if(!spec)throw Error('Source is not approved');
  if(id===11&&!env.FINGRID_API_KEY)throw Error('Fingrid key is not configured');
  // Cloudflare supports manual/follow only. Reject 3xx via response.ok; never forward secrets on a redirect.
  const response=await fetch(spec.url,{signal:AbortSignal.timeout(15000),redirect:'manual',headers:{Accept:'application/json','User-Agent':'GlobalDatacenterDesignExplorer/1.0',...(id===11?{'x-api-key':env.FINGRID_API_KEY!}:{})}});
  if(!response.ok)throw Error(`Source request failed (HTTP ${response.status})`);
  const records=spec.parser(await response.json());
  if(records.length>1500)throw Error('Dataset exceeds initial import limit');
  return records;
}
export async function queryApprovedSource(id:number) {
  const records=await approvedRecords(id),retrieved_at=new Date().toISOString();
  const latestPeriod=records.map(r=>r.reporting_period).sort().at(-1);
  return {retrieved_at,records:records.filter(r=>r.reporting_period===latestPeriod).slice(0,15).map(r=>({...r,country_id:specs[id].country,source_id:id,retrieved_at})),limitation:'Read-only live check; does not update the saved dataset.'};
}
export async function refreshSource(id: number) {
  const spec = specs[id];
  if (!spec) throw Error('Source is not enabled for refresh');
  return persistRefresh(database(),id,spec.country,()=>approvedRecords(id));
}

export async function snapshot() {
  await ensureSeed();
  const db = database();
  const [design, countries, sources, claims, metrics] = await Promise.all([
    db.prepare('SELECT * FROM designs WHERE id=1').first<any>(),
    db.prepare('SELECT * FROM countries ORDER BY id').all<any>(),
    db.prepare('SELECT * FROM sources ORDER BY id').all<any>(),
    db.prepare('SELECT * FROM design_claims WHERE design_id=1 ORDER BY id').all<any>(),
    db.prepare(`SELECT m.*, c.name AS country_name, s.title AS source_title, s.url AS source_url FROM metrics m JOIN countries c ON c.id=m.country_id JOIN sources s ON s.id=m.source_id WHERE NOT EXISTS (SELECT 1 FROM metrics newer WHERE newer.source_id=m.source_id AND newer.country_id=m.country_id AND newer.metric_name=m.metric_name AND newer.category=m.category AND newer.unit=m.unit AND newer.geographic_scope=m.geographic_scope AND (newer.reporting_period > m.reporting_period OR (newer.reporting_period=m.reporting_period AND newer.id>m.id))) ORDER BY m.country_id,m.metric_name,m.category`).all<any>(),
  ]);
  return { design, countries: countries.results, sources: sources.results, claims: claims.results, metrics: metrics.results };
}

export async function investmentInputs() {
 await ensureSeed();
 const saved=await database().prepare('SELECT inputs_json,updated_at FROM model_settings WHERE id=1').first<any>();
 const d=await database().prepare('SELECT it_load_mw,pue,annual_operating_hours FROM designs WHERE id=1').first<any>();
 return {inputs:{...DEFAULTS,...(saved?JSON.parse(saved.inputs_json):{}),itMW:d.it_load_mw,pue:d.pue,hours:d.annual_operating_hours},updated_at:saved?.updated_at||null};
}
