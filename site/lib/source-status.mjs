export function sourcePresentation(source) {
  if ([9,10].includes(source.id)) return {mode:'Optional / inactive historical API',notes:'Reference dataset only. This website does not ingest or refresh this optional historical series; it is not a current live feed.'};
  if ([12,13].includes(source.id)) return {mode:'Optional / inactive Fingrid API',notes:'The server Fingrid credential is configured for S11. This optional dataset has no enabled backend parser or refresh integration; its endpoint and semantics still need validation before activation.'};
  return {mode:[6,7,8,11].includes(source.id)?'Enabled backend dataset':'Curated reference / manual review',notes:source.notes};
}
export function countrySnapshotNote(countryId,demand,carbon) {
  if(countryId===2)return demand?`${demand.reporting_period}; timezone unconfirmed [S6]`:'No verified Hydro-Québec demand observation is saved [S6]. Check its refresh status.';
  if(carbon)return '2024 average grid emission factor [S5]';
  return countryId===1?'Optional Fingrid emissions dataset [S12] is inactive; no verified carbon-intensity observation is saved.':'No verified grid carbon-intensity observation is saved [S5].';
}
