"""Local SIWC mock check; preserves any existing local mock registration."""
import http.cookiejar
import json
from pathlib import Path
import sqlite3
import sys
import urllib.error
import urllib.request

base = (sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:5173').rstrip('/')
assert base.startswith(('http://127.0.0.1:', 'http://localhost:')), 'Local preview only'
jar = http.cookiejar.CookieJar()
browser = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))

def request(path, body=None, origin=None, cookie=None):
    headers = {'Content-Type': 'application/json', 'Origin': origin or base}
    if cookie is not None:
        headers['Cookie'] = cookie
    req = urllib.request.Request(base + path, data=None if body is None else json.dumps(body).encode(), headers=headers)
    opener = urllib.request.build_opener() if cookie is not None else browser
    try:
        response = opener.open(req, timeout=30)
    except urllib.error.HTTPError as error:
        response = error
    with response:
        return response.status, response.read().decode()

for path, text in [('/', 'A decision before a datacenter'), ('/country-comparison', 'Québec'), ('/initial-design', 'Cooling'), ('/evidence', 'Fingrid'), ('/ask-the-adviser', 'Sign in with ChatGPT'), ('/register', 'Sign in and register'), ('/login', 'Sign in and register')]:
    status, html = request(path)
    assert status == 200 and text in html, (path, status)
    assert 'type="password"' not in html
    assert 'href="/signin-with-chatgpt?return_to=%2Fregister" target="_top"' in html
question = {'question': 'Why Finland?'}
assert request('/api/adviser', question)[0] == 401
assert request('/api/register', {})[0] == 401
assert request('/api/adviser', question, cookie='gdde_session=' + 'A'*43)[0] == 401
assert request('/api/login', {})[0] == 404
assert request('/api/logout', {})[0] == 404
# Temporarily move the local mock identity, without deleting its saved account.
dbs = [p for p in Path('.wrangler/state/v3/d1').rglob('*.sqlite') if p.name != 'metadata.sqlite']
assert len(dbs) == 1, 'Expected a single local D1 database'
db = sqlite3.connect(dbs[0])
backup = 'runtime-check:local_seedy'
assert db.execute('SELECT count(*) FROM users WHERE authenticated_user_id=?', (backup,)).fetchone()[0] == 0
db.execute('UPDATE users SET authenticated_user_id=? WHERE authenticated_user_id=?', (backup, 'local_seedy'))
db.commit()
try:
    status, html = request('/signin-with-chatgpt?return_to=%2Fregister')
    assert status == 200 and '2. Complete website registration' in html
    assert request('/api/adviser', question)[0] == 403
    assert request('/api/refresh', {'source_id': 6})[0] == 403
    assert request('/api/register', {}, origin='https://example.com')[0] == 403
    assert request('/api/register', {'role': 'team_admin', 'team_id': 1, 'authenticated_user_id': 'someone-else'})[0] == 200
    assert request('/api/register', {})[0] == 200
    row = db.execute('SELECT role,team_id,password_hash FROM users WHERE authenticated_user_id=?', ('local_seedy',)).fetchone()
    assert row == ('viewer', None, None), row
    assert db.execute('SELECT count(*) FROM users WHERE authenticated_user_id=?', ('local_seedy',)).fetchone()[0] == 1
    status, html = request('/account')
    assert status == 200 and 'seedy@sites.test' in html and 'viewer' in html
    assert request('/api/refresh', {'source_id': 6})[0] == 403
    status, response = request('/api/adviser', question)
    assert status == 503 and 'not connected yet' in response
    assert request('/api/adviser', {'question': ''})[0] == 400
    assert request('/signout-with-chatgpt?return_to=%2F')[0] == 200
    assert request('/api/adviser', question)[0] == 401
finally:
    request('/signout-with-chatgpt?return_to=%2F')
    db.execute('DELETE FROM users WHERE authenticated_user_id=?', ('local_seedy',))
    db.execute('UPDATE users SET authenticated_user_id=? WHERE authenticated_user_id=?', ('local_seedy', backup))
    db.commit()
    db.close()
print('PASS: public pages, SIWC sign-in/sign-out, separate D1 registration, anonymous/unregistered rejection, idempotency, ignored client permissions, viewer restrictions, origin checks and honest AI pending response.')
