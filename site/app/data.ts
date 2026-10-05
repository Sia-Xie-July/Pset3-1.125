import { env } from 'cloudflare:workers';
import seed from '../db/seed.json';
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
    if (await db.prepare('SELECT id FROM designs WHERE id = 1').first()) return;
    const statements: D1PreparedStatement[] = [];
    for (const [table, rows] of Object.entries(seed)) {
      for (const row of rows as Record<string, unknown>[]) {
        const columns = Object.keys(row);
        statements.push(db.prepare(`INSERT INTO ${table} (${columns.join(',')}) VALUES (${columns.map(() => '?').join(',')}) ON CONFLICT(id) DO NOTHING`).bind(...Object.values(row)));
      }
    }
    await db.batch(statements);
    // Bootstrap a bounded set of approved, key-free datasets once; future refreshes require an editor.
    await Promise.allSettled([refreshSource(6), refreshSource(7), refreshSource(8), ...(env.FINGRID_API_KEY ? [refreshSource(11)] : [])]);
  })().catch(error => { initialized = null; throw error; });
  return initialized;
}
export async function refreshSource(id: number) {
  const specs: Record<number, { url: string; country: number; parser: (value: any) => any[] }> = {
    6: { url: 'https://www.hydroquebec.com/data/documents-donnees/donnees-ouvertes/json/demande.json', country: 2, parser: body => hydroRecords(body) },
    7: { url: 'https://www.hydroquebec.com/data/documents-donnees/donnees-ouvertes/json/production.json', country: 2, parser: body => hydroRecords(body, true) },
    8: { url: 'https://data.gov.sg/api/action/datastore_search?resource_id=d_dec34f3ed7daeb6429c8d8b7c36852d2', country: 3, parser: singaporeRecords },
    11: { url: 'https://data.fingrid.fi/api/datasets/124/data/latest', country: 1, parser: fingridRecords },
  };
  const spec = specs[id];
  if (!spec) throw Error('Source is not enabled for refresh');
  const db = database(), now = new Date().toISOString();
  try {
    if(id===11&&!env.FINGRID_API_KEY)throw Error('Fingrid key is not configured');
    // ponytail: timestamp throttle handles sequential edits; concurrent isolates may still receive provider 429, retaining old data.
    if(id===11){const source=await db.prepare('SELECT last_refresh_at FROM sources WHERE id=11').first<any>();if(source?.last_refresh_at&&Date.now()-Date.parse(source.last_refresh_at)<2000)throw Error('Fingrid refresh is throttled');}
    const response = await fetch(spec.url, { signal: AbortSignal.timeout(15000), headers: { Accept: 'application/json', ...(id===11 ? {'x-api-key':env.FINGRID_API_KEY!} : {}) } });
    if (!response.ok) throw Error('Source request failed');
    const records = spec.parser(await response.json());
    if (records.length > 1500) throw Error('Dataset exceeds initial import limit');
    const writes = records.map(record => {
      const data = { ...record, country_id: spec.country, source_id: id, retrieved_at: now };
      const columns = Object.keys(data);
      return db.prepare(`INSERT INTO metrics (${columns.join(',')}) SELECT ${columns.map(() => '?').join(',')} WHERE NOT EXISTS (SELECT 1 FROM metrics WHERE source_id = ? AND source_record_id = ? AND category = ? AND value = ?)`)
        .bind(...Object.values(data), id, record.source_record_id, record.category, record.value);
    });
    writes.push(db.prepare("UPDATE sources SET last_refresh_at=?, last_refresh_status='succeeded', last_refresh_error=NULL WHERE id=?").bind(now, id));
    await db.batch(writes);
    return records.length;
  } catch {
    await db.prepare("UPDATE sources SET last_refresh_at=?, last_refresh_status='failed', last_refresh_error='The source could not be retrieved or validated. Last valid observations retained.' WHERE id=?").bind(now, id).run();
    throw Error('Refresh failed; last valid data retained');
  }
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
