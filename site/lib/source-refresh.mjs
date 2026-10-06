// Loader validates the entire upstream response before any observation is written.
// Production D1 and the SQLite test adapter both execute batch atomically.
export async function persistRefresh(db,id,country,loader,now=new Date().toISOString()) {
 try {
  const records=await loader();
  if(!Array.isArray(records)||!records.length||records.length>1500)throw Error('Invalid batch');
  const writes=records.map(record=>{
   const data={...record,country_id:country,source_id:id,retrieved_at:now},columns=Object.keys(data);
   return db.prepare(`INSERT INTO metrics (${columns.join(',')}) SELECT ${columns.map(()=>'?').join(',')} WHERE NOT EXISTS (SELECT 1 FROM metrics WHERE source_id=? AND source_record_id=? AND category=? AND value=?)`).bind(...Object.values(data),id,record.source_record_id,record.category,record.value);
  });
  writes.push(db.prepare("UPDATE sources SET last_refresh_at=?,last_refresh_status='succeeded',last_refresh_error=NULL WHERE id=?").bind(now,id));
  await db.batch(writes);return records.length;
 } catch (error) {
  const status=/^Source request failed \(HTTP (\d{3})\)$/.exec(error.message||'');
  const detail=status?`The provider returned HTTP ${status[1]}.`:['TimeoutError','AbortError'].includes(error.name)?'The provider request timed out.':'The source could not be retrieved or validated.';
  console.warn('source_refresh_failed',{source_id:id,error:error.name,message:error.message});
  await db.prepare("UPDATE sources SET last_refresh_at=?,last_refresh_status='failed',last_refresh_error=? WHERE id=?").bind(now,`${detail} Last valid observations retained.`,id).run();
  throw Error('Refresh failed; last valid data retained');
 }
}
