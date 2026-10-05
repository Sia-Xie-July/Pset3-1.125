import assert from 'node:assert/strict';
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
assert.equal((ddl.match(/sqliteTable\(/g)||[]).length,8);
console.log('PASS: baseline, PUE sensitivity, registration/editor checks, future placeholders, reported zero, numeric validation, and partial-year metadata.');
