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
    try{const r=await fetch('/api/register',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});const d:any=await r.json();if(!r.ok)throw Error(d.error);window.location.assign('/ask-the-adviser');}catch(e:any){setMessage(e.message||'Unable to connect. Please try again.');}finally{setBusy(false);}
  }}><button className="button" disabled={busy}>{busy?'Registering…':'Complete website registration'}</button><p role="status" aria-live="polite">{message}</p></form>;
}
export function Refresh({source}:{source:number}) {
  const [message,setMessage]=useState(''),[busy,setBusy]=useState(false);
  return <><button className="button secondary" disabled={busy} onClick={async()=>{setBusy(true);try{const r=await fetch('/api/refresh',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({source_id:source})});const d:any=await r.json();if(!r.ok)throw Error(d.error);window.location.reload();}catch(e:any){setMessage(e.message);}finally{setBusy(false);}}}>{busy?'Refreshing…':'Refresh dataset'}</button><span role="status">{message}</span></>;
}
export function AdviserForm() {
  const [question,setQuestion]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
  const [turns,setTurns]=useState<{question:string;data:any}[]>([]);
  const prompts=['Why is Kajaani the proposed location?','What changes if PUE rises to 1.40?','Which evidence could reverse the recommendation?'];
  return <><div className="suggestions">{prompts.map(p=><button key={p} disabled={busy} type="button" onClick={()=>setQuestion(p)}>{p}</button>)}</div>
    <form onSubmit={async e=>{
      e.preventDefault();if(busy)return;setBusy(true);setMessage('');
      try{
        const history=turns.slice(-2).flatMap(t=>[{role:'user',content:t.question},{role:'assistant',content:t.data.answer.slice(0,2500)}]);
        const r=await fetch('/api/adviser',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question,history})});const d:any=await r.json();
        if(!r.ok)throw Error(d.error||'Unable to complete the answer.');
        setTurns(t=>[...t,{question:question.trim(),data:d}]);setQuestion('');
      }catch(e:any){setMessage(e.message||'The adviser could not be reached. Please try again.');}finally{setBusy(false);}
    }}><label htmlFor="question">Your question</label><textarea id="question" maxLength={2000} required disabled={busy} value={question} onChange={e=>setQuestion(e.target.value)} placeholder="Ask about the design, assumptions or evidence gaps."/>
    <div className="account-actions"><button className="button" disabled={busy||!question.trim()}>{busy?'Consulting evidence…':'Ask the Adviser'}</button>{turns.length>0&&<button className="button secondary" type="button" disabled={busy} onClick={()=>{setTurns([]);setMessage('');}}>New conversation</button>}</div></form>
    <p role="status" aria-live="polite" className="response">{message|| (busy?'Retrieving evidence and preparing a source-aware answer…':'')}</p>
    <p className="footnote">Up to 6 requests per 10 minutes and 40 per day, subject to a shared site limit. Conversation stays in this tab; request metadata and token counts are recorded.</p>
    <div className="conversation">{turns.map((t,i)=><article className="adviser-turn" key={i}><h3>Your question</h3><p>{t.question}</p><h3>Answer</h3><p className="adviser-answer">{t.data.answer}</p>{t.data.citation_warnings?.length>0&&<div className="notice" role="note"><strong>Source verification notice</strong><ul>{t.data.citation_warnings.map((warning:string,j:number)=><li key={j}>{warning}</li>)}</ul></div>}<h3>Evidence used</h3>{t.data.citations.length?<ul>{t.data.citations.map((s:any)=><li key={s.id}><a href={`/evidence#source-${s.id}`}>[S{s.id}] {s.publisher}: {s.title}</a> · <a href={s.url} target="_blank" rel="noreferrer">Original source</a><small>{s.reporting_periods.length?`Reporting period: ${s.reporting_periods.join('; ')} · `:''}{s.retrieval_times.length?`Observations retrieved: ${s.retrieval_times.join('; ')} · `:''}Publication: {s.publication_date||'not stated'} · Accessed: {s.accessed_at} · Saved refresh: {s.last_refresh_status} {s.last_refresh_at||''}</small></li>)}</ul>:<p>{t.data.unverified_source_ids?.length?'No verified source links are available for this answer.':'No external evidence cited; this answer concerns design assumptions, arithmetic or an evidence gap.'}</p>}
    {([['assumptions','Assumptions'],['calculations','Calculations'],['design_decisions','Design decisions'],['uncertainties','Uncertainty']] as const).map(([key,label])=><div key={key}><h3>{label}</h3>{t.data[key].length?<ul>{t.data[key].map((v:string,j:number)=><li key={j}>{v}</li>)}</ul>:<p>None identified in this answer.</p>}</div>)}<p className="footnote">{t.data.usage.model} · {t.data.usage.input_tokens.toLocaleString()} input / {t.data.usage.output_tokens.toLocaleString()} output tokens · {t.data.usage.tool_calls} tool calls · Request {t.data.request_id}</p></article>)}</div></>;
}
