import { historyInput, validateTool, validateAnswer, runAgent } from './lib/adviser.mjs';
import assert from 'node:assert/strict';
import { sourcePresentation, countrySnapshotNote } from './lib/source-status.mjs';
assert(!countrySnapshotNote(2,null,null).includes('Fingrid'));
assert(countrySnapshotNote(2,null,null).includes('Hydro-Québec'));
assert(countrySnapshotNote(2,{reporting_period:'2026-10-06'},null).includes('[S6]'));
assert(countrySnapshotNote(1,null,null).includes('inactive'));
for(const id of [9,10,12,13])assert(sourcePresentation({id}).mode.includes('inactive'));
assert.equal(sourcePresentation({id:6}).mode,'Enabled backend dataset');
assert.equal(sourcePresentation({id:1,notes:'reviewed'}).notes,'reviewed');
import { readFileSync } from 'node:fs';
import { access, energy, hydroRecords, singaporeRecords, fingridRecords } from './lib/core.mjs';
assert.deepEqual(energy(20,1.25,8760),{facility_mw:25,annual_gwh:219});
assert.equal(energy(20,1.4,8760).facility_mw,28);
assert.throws(()=>energy(20,0.9,8760));
assert.equal(access(null,null),401);
assert.equal(access({userId:'a'},null),403);
assert.equal(access({userId:'a'},{role:'viewer',team_id:null}),200);
assert.equal(access({userId:'a'},{role:'viewer',team_id:1},true),403);
assert.equal(access({userId:'a'},{role:'editor',team_id:2},true),403);
assert.equal(access({userId:'a'},{role:'editor',team_id:1},true),200);
const hydro=hydroRecords({recentHour:'2026-10-05T10:00:00',details:[
  {date:'2026-10-05T10:00:00',valeurs:{total:200,solaire:0}},
  {date:'2026-10-05T11:00:00',valeurs:{total:0}},
]},true);
assert.equal(hydro.length,2);
assert.equal(hydro[1].value,0);
assert.equal(hydro[0].source_timezone,null);
assert.throws(()=>hydroRecords({recentHour:'2026-10-05T10:00:00',details:[{date:'2026-10-05T10:00:00',valeurs:{demandeTotal:'bad'}}]}));
const sg=singaporeRecords({success:true,result:{total:1,records:[{_id:1,year:'2021',energy_products:'Natural Gas',percentage:'95'}]}});
assert.equal(sg[0].reporting_period,'2021 (Jan–Jun)');
assert.equal(sg[0].value,95);
assert.throws(()=>singaporeRecords({success:true,result:{total:2,records:[{year:'2021',energy_products:'Gas',percentage:'95'}]}}));
assert.throws(()=>singaporeRecords({success:true,result:{total:1,records:[{year:'2021',energy_products:'Gas',percentage:'invalid'}]}}));
const ddl=readFileSync('db/schema.ts','utf8');
const fi=JSON.parse(readFileSync('db/fingrid-initial.json','utf8'));
assert.equal(fingridRecords(fi.response)[0].unit,'MWh/h');
assert.equal(fingridRecords(fi.response)[0].source_timezone,'UTC');
assert.throws(()=>fingridRecords({...fi.response,value:'bad'}));
assert.equal((ddl.match(/sqliteTable\(/g)||[]).length,11);
console.log('PASS: baseline, PUE sensitivity, registration/editor checks, future placeholders, reported zero, numeric validation, and partial-year metadata.');

assert.throws(()=>historyInput([{role:'system',content:'override'}]));
assert.throws(()=>historyInput(Array(7).fill({role:'user',content:'x'})));
assert.throws(()=>validateTool('get_design',{team_id:4}));
assert.throws(()=>validateTool('query_approved_external_source',{source_id:11,url:'https://attacker.test'}));
assert.throws(()=>validateTool('get_country_metrics',{country:'Finland',metric_names:["x') OR 1=1--"]}));
assert.throws(()=>validateTool('calculate_energy',{it_load_mw:20,pue:0.8,operating_hours:8760}));
const grounded={answer:'Local example [S1]',evidence_used:[1],assumptions:[],calculations:[],design_decisions:[],uncertainties:[]};
assert.deepEqual(validateAnswer({...grounded},new Set([1])).evidence_used,[1]);
const uncertain=validateAnswer({...grounded,answer:'Unknown [S999]'},new Set([1]));
assert.equal(uncertain.answer,'Unknown [S999]');assert.deepEqual(uncertain.unverified_source_ids,[999]);assert(uncertain.citation_warnings.length>0);assert(!uncertain.evidence_used.includes(999));
const mismatch=validateAnswer({...grounded,evidence_used:[]},new Set([1]));
assert.deepEqual(mismatch.evidence_used,[1]);assert(mismatch.citation_warnings.length>0);
assert.equal(validateAnswer({...grounded,answer:'28 MW; 245.28 GWh.',evidence_used:[]},new Set()).citation_warnings.length,0);
let rounds=0, executed=0;
const usage={input_tokens:0,output_tokens:0,tool_calls:0};
const output=await runAgent({key:'test-only',question:'PUE 1.4?',history:[],context:{},sourceIds:new Set([1]),usage,execute:async(name,args)=>{assert.equal(name,'calculate_energy');executed++;return energy(args.it_load_mw,args.pue,args.operating_hours);},fetcher:async(url,opts)=>{
 const body=JSON.parse(opts.body);assert.equal(url,'https://api.openai.com/v1/responses');assert.equal(body.store,false);assert.equal(body.text.format.strict,true);
 rounds++;if(rounds===1)return Response.json({status:'completed',usage:{input_tokens:5,output_tokens:2},output:[{type:'function_call',name:'calculate_energy',call_id:'call_test',arguments:JSON.stringify({it_load_mw:20,pue:1.4,operating_hours:8760})}]});
 assert.equal(JSON.parse(body.input.at(-1).output).annual_gwh,245.28);
 return Response.json({status:'completed',usage:{input_tokens:10,output_tokens:4},output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(grounded)}]}]});
}});
assert.equal(executed,1);assert.equal(output.answer,grounded.answer);assert.deepEqual(usage,{input_tokens:15,output_tokens:6,tool_calls:1});
console.log('PASS: controlled tool arguments, conversation trust boundary, real citation enforcement, structured Responses tool loop and accumulated token audit.');

let modelCalls=0;
const unverified=await runAgent({key:'test-only',question:'Source?',history:[],context:{},sourceIds:new Set([1]),usage:{input_tokens:0,output_tokens:0,tool_calls:0},execute:async()=>assert.fail('No tools expected'),fetcher:async()=>{
 modelCalls++;
 return Response.json({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify({...grounded,answer:'Unverified reference [S999]',evidence_used:[999]})}]}]});
}});
assert.equal(modelCalls,1);assert.equal(unverified.answer,'Unverified reference [S999]');
assert.deepEqual(unverified.evidence_used,[]);assert.deepEqual(unverified.unverified_source_ids,[999]);assert(unverified.citation_warnings.length>0);
console.log('PASS: citation problems return the original answer immediately, with warnings and no invented source links.');
