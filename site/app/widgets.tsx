'use client';
import { useState } from 'react';
import { energy } from '../lib/core.mjs';
export function Calculator({ it, pue, hours }: { it:number; pue:number; hours:number }) {
  const [load,setLoad]=useState(String(it)), [ratio,setRatio]=useState(String(pue));
  let result:any=null;
  try { result=energy(Number(load),Number(ratio),hours); } catch {}
  return <section className="panel calculator"><div className="section-heading"><h2>Explore the energy assumption</h2><span className="badge calculation">Calculation</span></div><div className="input-row"><label>IT load <span>MW</span><input type="number" min="0.1" max="1000" step="0.1" value={load} onChange={e=>setLoad(e.target.value)}/></label><label>PUE<input type="number" min="1" max="5" step="0.01" value={ratio} onChange={e=>setRatio(e.target.value)}/></label></div><div className="calc-result" aria-live="polite">{result?<><strong>{result.facility_mw.toFixed(2)} <small>MW facility</small></strong><strong>{result.annual_gwh.toFixed(2)} <small>GWh/year</small></strong></>:<p>Enter a positive IT load and PUE of at least 1.</p>}</div><p className="footnote">At {hours.toLocaleString()} hours and constant design load. This exploration does not change the saved design.</p></section>;
}
export function RegistrationForm() {
  const [message,setMessage]=useState(''),[busy,setBusy]=useState(false);
  return <form onSubmit={async e=>{
    e.preventDefault();setBusy(true);setMessage('');
    try{const r=await fetch('/api/register',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});const d=await r.json();if(!r.ok)throw Error(d.error);window.location.assign('/ask-the-adviser');}catch(e:any){setMessage(e.message||'Unable to connect. Please try again.');}finally{setBusy(false);}
  }}><button className="button" disabled={busy}>{busy?'Registering…':'Complete website registration'}</button><p role="status" aria-live="polite">{message}</p></form>;
}
export function Refresh({source}:{source:number}) {
  const [message,setMessage]=useState(''),[busy,setBusy]=useState(false);
  return <><button className="button secondary" disabled={busy} onClick={async()=>{setBusy(true);try{const r=await fetch('/api/refresh',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({source_id:source})});const d=await r.json();if(!r.ok)throw Error(d.error);window.location.reload();}catch(e:any){setMessage(e.message);}finally{setBusy(false);}}}>{busy?'Refreshing…':'Refresh dataset'}</button><span role="status">{message}</span></>;
}
export function AdviserForm() {
  const [question,setQuestion]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
  const prompts=['Why is Kajaani the proposed location?','What changes if PUE rises to 1.40?','Which evidence could reverse the recommendation?'];
  return <><div className="suggestions">{prompts.map(p=><button key={p} type="button" onClick={()=>setQuestion(p)}>{p}</button>)}</div><form onSubmit={async e=>{e.preventDefault();setBusy(true);try{const r=await fetch('/api/adviser',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question})});const d=await r.json();setMessage(d.error||d.answer);}catch{setMessage('The adviser could not be reached. Please try again.');}finally{setBusy(false);}}}><label htmlFor="question">Your question</label><textarea id="question" maxLength={2000} required value={question} onChange={e=>setQuestion(e.target.value)} placeholder="Ask about the design, assumptions or evidence gaps."/><button className="button" disabled={busy||!question.trim()}>{busy?'Checking adviser…':'Check adviser availability'}</button></form><p role="status" className="response">{message}</p></>;
}
