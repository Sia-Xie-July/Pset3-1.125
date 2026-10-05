export function energy(it, pue, hours) {
  if (![it, pue, hours].every(Number.isFinite) || it <= 0 || pue < 1 || hours <= 0 || hours > 8784) throw Error('Invalid design inputs');
  return { facility_mw: it * pue, annual_gwh: it * pue * hours / 1000 };
}
export function access(user, account, editor = false) {
  if (!user) return 401;
  if (!account) return 403;
  if (editor && (!['editor', 'team_admin'].includes(account.role) || account.team_id !== 1)) return 403;
  return 200;
}
export function hydroRecords(body, generation = false) {
  if (!Array.isArray(body.details) || typeof body.recentHour !== 'string') throw Error('Invalid Hydro-Québec response');
  const rows = [];
  for (const item of body.details) {
    if (typeof item.date !== 'string' || !item.valeurs || item.date > body.recentHour) continue;
    const fields = generation ? ['total', 'hydraulique', 'eolien', 'autres', 'solaire', 'thermique'] : ['demandeTotal'];
    for (const field of fields) {
      const value = item.valeurs[field];
      if (value === null || value === undefined) continue;
      if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) throw Error('Invalid power value');
      rows.push({ metric_name: generation ? 'electricity_generation' : 'electricity_demand', category: generation ? field : '', value, value_kind: generation ? 'estimate' : 'reported', unit: 'MW', geographic_scope: 'Québec, excluding off-grid regions', reporting_period: item.date, source_timestamp: item.date, source_timezone: null, source_record_id: `${item.date}:${field}`, confidence: 'medium', notes: generation ? 'Provider reports real or estimated output; raw data without quality guarantee. Timezone convention not yet confirmed.' : 'Raw provincial demand snapshot; not a site connection offer. Timezone convention not yet confirmed.' });
    }
  }
  if (!rows.length) throw Error('No usable observations');
  return rows;
}
export function singaporeRecords(body) {
  if (body.success !== true || !Array.isArray(body.result?.records) || !body.result.records.length) throw Error('Invalid Singapore response');
  if (body.result.total > body.result.records.length) throw Error('Pagination required before saving this dataset');
  return body.result.records.map(row => {
    const value = Number(row.percentage);
    if (!/^\d{4}$/.test(String(row.year)) || typeof row.energy_products !== 'string' || row.percentage === '' || row.percentage == null || !Number.isFinite(value) || value < 0 || value > 100) throw Error('Invalid fuel-mix observation');
    return { metric_name: 'electricity_generation_fuel_share', category: row.energy_products, value, value_kind: 'reported', unit: '%', geographic_scope: 'Singapore', reporting_period: row.year === '2021' ? '2021 (Jan–Jun)' : String(row.year), source_timestamp: null, source_timezone: null, source_record_id: String(row._id), confidence: 'medium', notes: 'Historical EMA output-method fuel mix. Coverage ends June 2021; 2021 is partial. Not current supply.' };
  });
}
export function fingridRecords(body) {
  if (body.datasetId !== 124 || typeof body.value !== 'number' || !Number.isFinite(body.value) || body.value < 0 || ![body.startTime,body.endTime,body.modifiedAtUTC].every(x=>typeof x==='string'&&x.endsWith('Z')&&Number.isFinite(Date.parse(x))) || Date.parse(body.endTime)<=Date.parse(body.startTime)) throw Error('Invalid Fingrid consumption response');
  return [{metric_name:'electricity_consumption',category:'',value:body.value,value_kind:'reported',unit:'MWh/h',geographic_scope:'Finland',reporting_period:`${body.startTime} / ${body.endTime}`,source_timestamp:body.modifiedAtUTC,source_timezone:'UTC',source_record_id:`124:${body.startTime}:${body.endTime}`,confidence:'medium',notes:'National quarter-hour average, derived from production plus imports minus exports; includes minor estimated production. Not available connection capacity for Kajaani.'}];
}
