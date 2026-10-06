import { validateInputs } from './investment.mjs';
export function canManage(account,admin=false) {return Boolean(account&&account.team_id===1&&(admin?account.role==='team_admin':['editor','team_admin'].includes(account.role)));}
const text=(v,max=4000)=>{if(typeof v!=='string'||!v.trim()||v.length>max)throw Error('invalid_input');return v.trim();};
export function designInput(b) {
 for(const k of ['it_load_mw','pue','annual_operating_hours'])if(typeof b[k]!=='number'||!Number.isFinite(b[k]))throw Error('invalid_input');
 if(b.it_load_mw<=0||b.it_load_mw>100||b.pue<1||b.pue>2||b.annual_operating_hours<=0||b.annual_operating_hours>8784)throw Error('invalid_input');
 return {it_load_mw:b.it_load_mw,pue:b.pue,annual_operating_hours:b.annual_operating_hours,reason:text(b.reason,1000)};
}
export function evidenceInput(b) {
 let url;try{url=new URL(text(b.url,2000));}catch{throw Error('invalid_input');}if(url.protocol!=='https:'||url.username||url.password)throw Error('invalid_input');
 const claim_type=b.claim_type;if(!['evidence','assumption','design_decision','unknown'].includes(claim_type))throw Error('invalid_input');
 return {publisher:text(b.publisher,200),title:text(b.title,300),url:url.href,claim:text(b.claim),notes:text(b.notes),claim_type};
}
export function financialInput(b){if(!b||typeof b!=='object'||Array.isArray(b))throw Error('invalid_input');try{return validateInputs(b);}catch{throw Error('invalid_input');}}
