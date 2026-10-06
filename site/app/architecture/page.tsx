export const metadata = { title: 'Website Architecture | Global Datacenter Design Explorer' };

const steps = [
  ['Send a question', 'A registered user asks about the current PUE. The browser sends the question and bounded conversation history to POST /api/adviser.'],
  ['Check access', 'The backend uses the trusted ChatGPT identity, looks up the D1 registration, validates the request and reserves a rate-limit slot. Public pages remain available without registration.'],
  ['Retrieve evidence and run tools', 'The backend retrieves the saved design and relevant claims with their source records. OpenAI can request allowlisted tools; the server executes D1 lookups, deterministic energy or investment calculations, and approved API reads. Tool results return to the model.'],
  ['Build the sourced response', 'The model returns typed statements. The backend renders classifications and source links from the retrieved D1 records, flags unsupported citation identifiers and records request status and token usage. Citation warnings are advisory; source links alone do not establish factual accuracy.'],
  ['Show the answer', 'The browser displays the answer, citations, assumptions, calculations, decisions, uncertainties and any warnings. At the reference 20 MW IT load and PUE 1.25, application code calculates 25 MW and 219 GWh at 8,760 hours. A hypothetical calculation does not save a new design.'],
];

export default function Architecture() {
  return <>
    <div className="page-heading"><div><p className="eyebrow">Engineering evidence · Assignment Steps 24 and 26</p><h1>Website Architecture</h1><p>Follow a question from the browser through access checks, stored evidence and controlled AI tools, then back to a cited answer.</p></div></div>
    <div className="architecture-links"><a className="button" href="https://drive.google.com/file/d/1A_Gr7akfuBEPiqKxJvKpkcRP76397HWV/view?usp=share_link" target="_blank" rel="noopener noreferrer">Watch demonstration video</a><a className="button" href="/deliverables/architecture-diagram.pdf">Download one-page PDF</a><a className="button secondary" href="/deliverables/architecture-diagram.svg" target="_blank" rel="noreferrer">Open full-size diagram</a><a href="/initial-design">View the physical datacenter design</a></div>
    <figure className="architecture-figure">
      <div className="architecture-canvas" tabIndex={0} role="region" aria-label="Architecture diagram; scroll horizontally on small screens">
      <a href="/deliverables/architecture-diagram.svg" target="_blank" rel="noreferrer" aria-label="Open the website architecture diagram at full size">
        {/* A static SVG keeps the public diagram sharp, portable and independent of D1 or AI availability. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/deliverables/architecture-diagram.svg" width="1320" height="1160" alt="Browser to Sites backend to D1 and OpenAI, with access checks, server-executed tools, cited answers and a separate protected evidence-refresh flow. A complete text explanation follows." />
      </a>
      </div>
      <figcaption>Blue arrows show the adviser request and response; teal arrows show data and tool access. The shaded area is the application backend. On small screens, scroll the diagram sideways or open it at full size. A complete text walkthrough follows.</figcaption>
    </figure>
    <section className="panel section" aria-labelledby="request-trace"><h2 id="request-trace">One request, explained</h2><p>A worked example for the individual request-flow explanation. Each team member should explain the same flow in their own words.</p><ol className="architecture-steps">{steps.map(([title,body])=><li key={title}><h3>{title}</h3><p>{body}</p></li>)}</ol></section>
    <div className="two-column architecture-notes">
      <section className="panel"><h2>Updating the evidence</h2><p>An editor or administrator requests a protected refresh. The backend fetches an enabled API, validates the complete response, then saves new observations and timestamps to D1 in a transaction.</p><p>On retrieval or validation failure, the last valid observations remain available and the source receives a visible failure status. An adviser tool read is separate from this saved refresh.</p><p>Editors may add reviewed evidence; administrators may also save design and financial assumptions or assign roles. The server checks these permissions and records management changes in the audit log.</p></section>
      <section className="panel"><h2>Trust and credentials</h2><p>OpenAI and Fingrid credentials stay on the server. Browser-supplied identities and roles are not authoritative. Neither the browser nor the model connects directly to D1.</p><p>Tool arguments cannot contain arbitrary SQL or arbitrary URLs. Retrieved source text and conversation history are treated as untrusted evidence, not system instructions. The adviser may still omit details or make mistakes; inspect its supporting evidence and uncertainty.</p></section>
    </div>
    <section className="panel section"><h2>Related project evidence</h2><p><a href="/evidence">Sources and refresh status</a> · <a href="/decision">Decision dossier and deliverables</a> · <a href="/deliverables/submission-guide.pdf">Request-flow guide</a></p><p className="footnote">This diagram documents the website and AI application. The separate datacenter diagram describes grid power, backup, cooling, networking and physical failure paths.</p></section>
  </>;
}
