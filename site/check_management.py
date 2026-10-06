"""Local-only HTTP acceptance checks. Restores edited records and roles."""
import json,sqlite3,urllib.request,urllib.error,http.cookiejar
from pathlib import Path
base='http://127.0.0.1:5173';browser=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
def request(path,body=None,origin=base):
 req=urllib.request.Request(base+path,data=None if body is None else json.dumps(body).encode(),headers={'Content-Type':'application/json','Origin':origin})
 try:r=browser.open(req,timeout=60)
 except urllib.error.HTTPError as e:r=e
 with r:return r.status,r.read().decode()
for path in ['/','/investment','/decision','/evidence','/manage','/initial-design','/country-comparison']:
 status,body=request(path);assert status==200,(path,status,body[:300])
assert request('/api/save-design',{})[0]==401
assert request('/signin-with-chatgpt?return_to=%2Fregister')[0]==200
assert request('/api/register',{})[0]==200
paths=[p for p in Path('.wrangler/state/v3/d1').rglob('*.sqlite') if p.name!='metadata.sqlite'];assert len(paths)==1
con=sqlite3.connect(paths[0]);con.row_factory=sqlite3.Row
user=dict(con.execute("SELECT * FROM users WHERE authenticated_user_id='local_seedy'").fetchone())
design=dict(con.execute('SELECT * FROM designs WHERE id=1').fetchone());claims=[dict(r) for r in con.execute("SELECT * FROM design_claims WHERE design_id=1 AND (claim_type='calculation' OR id IN (3,4,5))")];settings=[dict(r) for r in con.execute('SELECT * FROM model_settings')]
start_audit=con.execute('SELECT coalesce(max(id),0) FROM project_audit').fetchone()[0]
new_source=None;target=None
try:
 con.execute("UPDATE users SET role='viewer',team_id=NULL WHERE id=?",(user['id'],));con.commit()
 data={'it_load_mw':20,'pue':1.4,'annual_operating_hours':8760,'reason':'Local acceptance test'}
 assert request('/api/save-design',data)[0]==403
 assert request('/api/save-finance',{'inputs':{}})[0]==403
 con.execute("UPDATE users SET role='editor',team_id=1 WHERE id=?",(user['id'],));con.commit()
 assert request('/api/save-design',data)[0]==403
 evidence={'publisher':'Local test','title':'Acceptance fixture','url':'https://example.com/acceptance','claim':'Fixture assumption only','notes':'Not external research','claim_type':'assumption'}
 result=request('/api/add-evidence',evidence);assert result[0]==200,result
 new_source=con.execute("SELECT max(id) FROM sources WHERE title='Acceptance fixture'").fetchone()[0]
 assert con.execute('SELECT count(*) FROM design_claims WHERE source_id=?',(new_source,)).fetchone()[0]==1
 assert request('/api/add-evidence',{**evidence,'url':'javascript:alert(1)'})[0]==400
 con.execute("UPDATE users SET role='team_admin',team_id=1 WHERE id=?",(user['id'],));con.commit()
 assert request('/api/save-design',data,'https://example.com')[0]==403
 assert request('/api/save-design',{**data,'pue':.9})[0]==400
 result=request('/api/save-design',data);assert result[0]==200,result
 assert con.execute('SELECT pue FROM designs WHERE id=1').fetchone()[0]==1.4
 assert '245.28' in request('/')[1]
 assert '245.28' in con.execute("SELECT claim_text FROM design_claims WHERE claim_type='calculation'").fetchone()[0]
 assert '1.4;' in con.execute('SELECT claim_text FROM design_claims WHERE id=4').fetchone()[0]
 assert request('/api/save-finance',{'inputs':{'electricity':.15}})[0]==200
 assert json.loads(con.execute('SELECT inputs_json FROM model_settings').fetchone()[0])['electricity']==.15
 assert request('/api/save-finance',{'inputs':{'electricity':None}})[0]==400
 assert request('/api/assign-role',{'user_id':user['id'],'role':'viewer'})[0]==400
 target=con.execute("INSERT INTO users(authenticated_user_id,registered_at) VALUES('completion-test-target','2026-10-06')").lastrowid;con.commit()
 assert request('/api/assign-role',{'user_id':target,'role':'editor'})[0]==200
 con.execute('UPDATE users SET team_id=2 WHERE id=?',(target,));con.commit()
 assert request('/api/assign-role',{'user_id':target,'role':'team_admin'})[0]==400
 assert con.execute('SELECT count(*) FROM project_audit WHERE id>?',(start_audit,)).fetchone()[0]>=4
 assert request('/api/refresh',{'source_id':999})[0]==400
 print('PASS: public pages, authentication, viewer/editor/admin restrictions, saved PUE/calculation, saved finance, reviewed evidence, role boundaries and audit records.')
finally:
 con.execute('UPDATE designs SET '+','.join(k+'=?' for k in design)+' WHERE id=1',list(design.values()))
 con.execute("DELETE FROM design_claims WHERE design_id=1 AND (claim_type='calculation' OR id IN (3,4,5))")
 for row in claims:con.execute('INSERT INTO design_claims('+','.join(row)+') VALUES('+','.join('?' for _ in row)+')',list(row.values()))
 con.execute('DELETE FROM model_settings')
 for row in settings:con.execute('INSERT INTO model_settings VALUES(?,?,?)',list(row.values()))
 if new_source:
  con.execute('DELETE FROM design_claims WHERE source_id=?',(new_source,));con.execute('DELETE FROM sources WHERE id=?',(new_source,))
 con.execute('DELETE FROM project_audit WHERE id>?',(start_audit,))
 if target:con.execute('DELETE FROM users WHERE id=?',(target,))
 con.execute('UPDATE users SET role=?,team_id=? WHERE id=?',(user['role'],user['team_id'],user['id']));con.commit();con.close()
 request('/signout-with-chatgpt?return_to=%2F')
