"""Build the shared website/README diagram and its one-page PDF.

Run with Python + reportlab. SVG and PDF use the same drawing instructions.
The diagram documents application behavior; it contains no credentials.
"""
from pathlib import Path
from html import escape
import math
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'site/public/deliverables'
OUT.mkdir(parents=True, exist_ok=True)
W, H = 1320, 1160
pdf = canvas.Canvas(str(OUT / 'architecture-diagram.pdf'), pagesize=(W, H))
pdf.setTitle('Website and AI architecture - Global Datacenter Design Explorer')
pdf.setAuthor('Global Datacenter Design Explorer')
parts = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" role="img" aria-labelledby="title desc">',
         '<title id="title">Website and AI architecture</title>',
         '<desc id="desc">A browser sends a question to the Sites backend. The backend verifies platform identity, D1 registration and rate limits, retrieves evidence and runs controlled tools, calls OpenAI, and returns classified answers with real source links. A separate authorized refresh validates approved API data before saving to D1; failures retain prior observations. Secrets stay on the server.</desc>']
INK, MUTED, BLUE, TEAL, AMBER = '#172D49', '#50657B', '#285AA5', '#087C78', '#965D19'

def rect(x, y, w, h, fill, stroke=None, radius=14):
    parts.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{radius}" fill="{fill}" stroke="{stroke or fill}"/>')
    pdf.setFillColor(HexColor(fill)); pdf.setStrokeColor(HexColor(stroke or fill))
    pdf.roundRect(x, H-y-h, w, h, radius, fill=1, stroke=1)

def text(x, y, value, size=20, color=INK, bold=False):
    parts.append(f'<text x="{x}" y="{y}" fill="{color}" font-family="Arial, Helvetica, sans-serif" font-size="{size}" font-weight="{700 if bold else 400}">{escape(value)}</text>')
    pdf.setFillColor(HexColor(color)); pdf.setFont('Helvetica-Bold' if bold else 'Helvetica', size)
    pdf.drawString(x, H-y, value)

def lines(x, y, values, size=18, color=MUTED, leading=25):
    for i, value in enumerate(values): text(x, y+i*leading, value, size, color)

def arrow(points, color=BLUE, dashed=False, both=False):
    coords=' '.join(f'{x},{y}' for x,y in points)
    dash=' stroke-dasharray="7 6"' if dashed else ''
    parts.append(f'<polyline points="{coords}" fill="none" stroke="{color}" stroke-width="2.5" stroke-linejoin="round"{dash}/>')
    pdf.setStrokeColor(HexColor(color)); pdf.setLineWidth(2.5); pdf.setDash([7,6] if dashed else [])
    path=pdf.beginPath(); path.moveTo(points[0][0],H-points[0][1])
    for x,y in points[1:]:path.lineTo(x,H-y)
    pdf.drawPath(path); pdf.setDash([])
    def head(a,b):
        angle=math.atan2(b[1]-a[1],b[0]-a[0])
        verts=[b,(b[0]-10*math.cos(angle-.42),b[1]-10*math.sin(angle-.42)),(b[0]-10*math.cos(angle+.42),b[1]-10*math.sin(angle+.42))]
        parts.append(f'<polygon points="{" ".join(f"{x},{y}" for x,y in verts)}" fill="{color}"/>')
        p=pdf.beginPath();p.moveTo(verts[0][0],H-verts[0][1])
        for x,y in verts[1:]:p.lineTo(x,H-y)
        p.close();pdf.setFillColor(HexColor(color));pdf.drawPath(p,fill=1,stroke=0)
    head(points[-2],points[-1])
    if both:head(points[1],points[0])

def card(x,y,w,h,title,body,number=None,accent=BLUE):
    rect(x,y,w,h,'#FFFFFF','#CCD8E4')
    if number:
        rect(x+18,y+18,32,32,accent,radius=9)
        text(x+27,y+41,str(number),19,'#FFFFFF',True)
    text(x+(64 if number else 20),y+42,title,20,INK,True)
    lines(x+20,y+76,body)

rect(0,0,W,H,'#F5F8FC',radius=0)
rect(0,0,W,144,INK,radius=0)
text(40,42,'GLOBAL DATACENTER DESIGN EXPLORER',15,'#9DD8E5',True)
text(40,88,'Website and AI architecture',37,'#FFFFFF',True)
text(40,121,'Current application flow  /  Evidence in D1  /  Server-controlled access and tools',19,'#D5E2EF')

text(40,186,'BROWSER',16,MUTED,True)
text(375,186,'SITES BACKEND',16,BLUE,True)
text(1010,186,'DATA AND SERVICES',16,MUTED,True)
rect(350,202,630,607,'#E9F0F9','#B8CEE8',20)

card(40,225,270,148,'Ask a question',['Question + bounded history','Public pages need no login.','Adviser requires registration.'],1)
card(375,225,580,148,'Check access',['Trusted platform identity + D1 users / roles','Validate origin and request; reserve rate-limit slot.','Anonymous 401  /  unregistered 403  /  limit 429'],2)
arrow([(310,275),(375,275)])
card(40,413,270,142,'Sign in with ChatGPT',['Platform authenticates user.','Site registration creates','a separate D1 users row.'])
arrow([(175,413),(175,373)],dashed=True)

card(1010,225,270,158,'Cloudflare D1',['Design + financial settings','Claims, metrics + sources','Users, audit + request usage'])
arrow([(955,287),(1010,287)],both=True)
card(375,426,580,180,'Retrieve and reason',['Load current design, relevant claims and real sources.','Server executes allowlisted tools for the model:','D1 lookups, energy and financial calculations,','or an approved API read with saved-data fallback.'],3)
arrow([(660,373),(660,426)])
arrow([(1110,383),(1110,403),(930,403),(930,426)],color=TEAL)
card(1010,426,270,180,'OpenAI Responses',['Receives scoped evidence.','May request controlled tools.','Backend returns tool results.','Model returns typed claims.'])
arrow([(955,485),(1010,485)],both=True)

card(1010,651,270,137,'Approved APIs',['Hydro-Quebec / data.gov.sg','Fingrid consumption (S11)','Fixed URLs; validated data.'])
arrow([(935,606),(935,624),(1145,624),(1145,651)],color=TEAL,both=True)
card(375,651,530,137,'Return a sourced answer',['Render classifications and real D1 source links.','Unmatched citations get an advisory warning.','Record token usage and request outcome.'],4)
arrow([(660,606),(660,651)])
card(40,623,270,165,'Read the response',['Answer + citations','Assumptions + calculations','Decisions + uncertainties','Warnings where needed.'],5)
arrow([(375,720),(310,720)])

text(40,852,'SEPARATE FLOW  /  AUTHORIZED EVIDENCE REFRESH',16,TEAL,True)
card(40,872,270,110,'Editor / administrator',['Requests protected refresh.'],accent=TEAL)
card(350,872,300,110,'Backend fetch + validate',['Approved API; check all records.'],accent=TEAL)
card(690,872,300,110,'Atomic D1 save',['Append data + refresh timestamp.'],accent=TEAL)
card(1030,872,250,110,'Updated page',['Show data + provenance.'],accent=TEAL)
for a,b in [(310,350),(650,690),(990,1030)]:arrow([(a,929),(b,929)],color=TEAL)
text(350,1017,'If retrieval or validation fails: retain last valid observations and record a visible failure.',20,AMBER)

rect(40,1052,1240,74,'#E7EEF5',radius=10)
text(60,1081,'SERVER BOUNDARY',15,BLUE,True)
text(254,1081,'API keys stay server-side. Browsers and models have no direct D1 access.',19,INK)
text(60,1111,'Retrieved text and history are untrusted evidence. Valid citations do not guarantee a complete or correct answer.',19,MUTED)
text(40,1148,'Assignment Steps 14, 16-24 and 26  |  Application architecture; physical datacenter design is a separate diagram.',16,MUTED)

parts.append('</svg>')
(OUT/'architecture-diagram.svg').write_text('\n'.join(parts)+'\n')
pdf.showPage();pdf.save()
print(f'Created {OUT}/architecture-diagram.svg and .pdf')
