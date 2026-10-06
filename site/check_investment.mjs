import assert from 'node:assert/strict';
import {model,compare,validateInputs} from './lib/investment.mjs';
import {canManage,designInput,evidenceInput} from './lib/management.mjs';
for(const r of compare()) {
 assert.equal(r.rows.length,11);
 for(const row of r.rows) {
  assert.ok(Math.abs(row.ownedHours+row.leasedHours-row.productiveHours)<1e-5);
  assert.ok(Math.abs(row.memberCash-(row.resourceCost+row.interest+row.principal-row.draw))<1e-5);
  assert.ok(row.energyGWh>=0&&row.debt>=-1e-6);
 }
 assert.ok(Math.abs(r.totalMemberCash+r.terminalDebt-r.totalCost-r.totalInterest)<.01);
}
const full=model(),half=model({},'build','half'),delay=model({},'build','delay'),lease=model({},'lease');
assert.equal(half.demand,full.demand/2);
assert.ok(half.annualOperatingCost>full.annualOperatingCost/2);
assert.equal(delay.opening,full.opening+1);assert.ok(delay.preOpeningCash>full.preOpeningCash);
assert.equal(lease.rows.reduce((n,r)=>n+r.gpuCapex+r.facilityCapex+r.gridCapex,0),0);
assert.deepEqual(model({},'lease','delay').rows,lease.rows);
assert.ok(full.rows.some(r=>r.year>=full.opening&&r.gpuCapex>0));
assert.ok(model({electricity:.2}).npvCost>full.npvCost);
assert.ok(model({gpuCost:60000}).npvCost>full.npvCost);
assert.ok(model({leaseUSD:5.54},'lease').npvCost>lease.npvCost);
assert.equal(compare().filter(r=>r.scenario==='base').sort((a,b)=>a.npvCost-b.npvCost)[0].option,'hybrid');
assert.equal(compare().filter(r=>r.scenario==='half').sort((a,b)=>a.npvCost-b.npvCost)[0].option,'lease');
assert.throws(()=>validateInputs({utilization:null}));assert.throws(()=>validateInputs({gpuCost:NaN}));assert.throws(()=>validateInputs({replacementYears:2.5}));
assert.ok(!canManage({team_id:2,role:'team_admin'},true));assert.ok(!canManage({team_id:1,role:'viewer'}));assert.ok(canManage({team_id:1,role:'editor'}));assert.ok(!canManage({team_id:1,role:'editor'},true));
assert.throws(()=>designInput({it_load_mw:20,pue:.5,annual_operating_hours:8760,reason:'test'}));
assert.throws(()=>evidenceInput({url:'https://secret@host.test',title:'test',publisher:'test',claim:'test',notes:'test',claim_type:'evidence'}));
console.log('PASS: equal service, financing identities, delay/utilization stress, replacements, sensitivities, decision reversal, input and role validation.');
