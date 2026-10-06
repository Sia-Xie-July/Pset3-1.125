"""Read-only public/anonymous production smoke checks; never sends a session or API secret."""
import json
import urllib.request
import urllib.error

origin='https://global-datacenter-design-explorer.tong-zhou.chatgpt.site'
def request(path,body=None,headers=None):
    values={'User-Agent':'Mozilla/5.0','Content-Type':'application/json','Origin':origin,**(headers or {})}
    req=urllib.request.Request(origin+path,data=None if body is None else json.dumps(body).encode(),headers=values)
    try:response=urllib.request.urlopen(req,timeout=30)
    except urllib.error.HTTPError as error:response=error
    with response:return response.status,response.read().decode()

for path,text in [('/','Kajaani'),('/country-comparison','Québec'),('/initial-design','Cooling'),('/evidence','Optional / inactive'),('/ask-the-adviser','Sign in with ChatGPT')]:
    status,html=request(path)
    assert status==200 and text in html,(path,status)
for action,body in [('adviser',{'question':'Anonymous acceptance check'}),('save-design',{}),('save-finance',{}),('add-evidence',{}),('assign-role',{}),('refresh',{'source_id':999})]:
    status,text=request('/api/'+action,body)
    assert status==401,(action,status,text)
status,text=request('/api/adviser',{'question':'Authentication header spoof check'}, {'oai-authenticated-user-id':'untrusted-test-visitor','oai-authenticated-user-email':'visitor@example.test'})
assert status==401,(status,text)
assert request('/api/adviser',{'question':'Origin check'},{'Origin':'https://example.test'})[0]==403
print('PASS: public production pages; anonymous adviser/edit/refresh rejection; platform strips spoofed identity headers; foreign-origin rejection.')
