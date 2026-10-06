import { database } from './data';
import { energy } from '../lib/core.mjs';
import { canManage,designInput,evidenceInput,financialInput } from '../lib/management.mjs';
export async function manage(action:string,body:any,account:any) {
 if(!canManage(account,['save-design','save-finance','assign-role'].includes(action)))throw Error('forbidden');
 const db=database(),now=new Date().toISOString();
 const audit=(details:string)=>db.prepare('INSERT INTO project_audit(user_id,action,details,created_at) VALUES(?,?,?,?)').bind(account.id,action,details,now);
 if(action==='save-design') {
  const d=designInput(body),v=energy(d.it_load_mw,d.pue,d.annual_operating_hours);
  // Replace calculated prose atomically with its input update; do not leave stale 25 MW claims in D1.
  await db.batch([
   db.prepare('UPDATE designs SET it_load_mw=?,pue=?,annual_operating_hours=?,updated_at=? WHERE id=1 AND team_id=1').bind(d.it_load_mw,d.pue,d.annual_operating_hours,now),
   db.prepare("UPDATE design_claims SET claim_text=?,notes=?,updated_at=? WHERE id=3 AND design_id=1 AND claim_type='assumption'").bind(`Current IT design load is ${d.it_load_mw} MW, including compute, storage and networking.`,d.reason,now),
   db.prepare("UPDATE design_claims SET claim_text=?,notes=?,updated_at=? WHERE id=4 AND design_id=1 AND claim_type='assumption'").bind(`Current proposed PUE target is ${d.pue}; seasonal and load-dependent performance is unverified.`,d.reason,now),
   db.prepare("UPDATE design_claims SET claim_text=?,notes=?,updated_at=? WHERE id=5 AND design_id=1 AND claim_type='assumption'").bind(`Current operating-year basis is ${d.annual_operating_hours} hours at constant design load for baseline arithmetic.`,d.reason,now),
   db.prepare("DELETE FROM design_claims WHERE design_id=1 AND claim_type='calculation'"),
   db.prepare("INSERT INTO design_claims(design_id,claim_text,claim_type,status,notes,updated_at) VALUES(1,?,'calculation','calculated',?,?)").bind(`Current saved baseline: ${d.it_load_mw} MW IT × PUE ${d.pue} = ${v.facility_mw} MW; ${d.annual_operating_hours} hours = ${v.annual_gwh} GWh. UPS delivered-energy basis: ${v.facility_mw/6} MWh for 10 minutes; 48-hour basis: ${v.facility_mw*48} MWh.`,d.reason,now),
   audit(JSON.stringify(d)),
  ]);return {saved:true};
 }
 if(action==='save-finance') {
  const data=financialInput(body.inputs);
  await db.batch([db.prepare('INSERT INTO model_settings(id,inputs_json,updated_at) VALUES(1,?,?) ON CONFLICT(id) DO UPDATE SET inputs_json=excluded.inputs_json,updated_at=excluded.updated_at').bind(JSON.stringify(data),now),audit(JSON.stringify(data))]);return {saved:true};
 }
 if(action==='add-evidence') {
  const e=evidenceInput(body);
  // Source + claim insert and audit share one D1 transaction. last_insert_rowid refers to the source insert.
  await db.batch([
   db.prepare("INSERT INTO sources(publisher,title,url,source_type,accessed_at,auth_type,verification_status,last_refresh_status,notes) VALUES(?,?,?,'webpage',?,'none','documented','never',?)").bind(e.publisher,e.title,e.url,now,e.notes),
   db.prepare('INSERT INTO design_claims(design_id,claim_text,claim_type,source_id,status,notes,updated_at) VALUES(1,?,?,last_insert_rowid(),?,?,?)').bind(e.claim,e.claim_type,e.claim_type==='evidence'?'verified':e.claim_type==='unknown'?'unresolved':'proposed',e.notes,now),audit(JSON.stringify(e)),
  ]);return {saved:true};
 }
 if(action==='assign-role') {
  if(!Number.isInteger(body.user_id)||body.user_id===account.id||!['viewer','editor','team_admin'].includes(body.role))throw Error('invalid_input');
  const target=await db.prepare('SELECT id,team_id FROM users WHERE id=?').bind(body.user_id).first<any>();
  if(!target||target.team_id!==null&&target.team_id!==1)throw Error('invalid_input');
  await db.batch([db.prepare('UPDATE users SET role=?,team_id=? WHERE id=?').bind(body.role,body.role==='viewer'?null:1,body.user_id),audit(JSON.stringify({user_id:body.user_id,role:body.role}))]);return {saved:true};
 }
 throw Error('invalid_input');
}
