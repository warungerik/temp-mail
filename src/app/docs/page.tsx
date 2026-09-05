"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface EndpointParam {
  name: string;
  type: string;
  required: boolean;
  defaultVal: string;
  description: string;
}

interface EndpointDef {
  id: string;
  method: "GET";
  path: string;
  title: string;
  description: string;
  params: EndpointParam[];
  sampleResponse: unknown;
}

const ENDPOINTS: EndpointDef[] = [
  {
    id: "domains",
    method: "GET",
    path: "/api/domains",
    title: "List Available Domains",
    description: "Fetches all currently active disposable email domains available for generating mailboxes.",
    params: [],
    sampleResponse: [
      { display: "owo-mailteam.bond", ascii: "owo-mailteam.bond", idn: false },
      { display: "inboxorigin.com", ascii: "inboxorigin.com", idn: false },
      { display: "quickmail.site", ascii: "quickmail.site", idn: false },
    ],
  },
  {
    id: "inbox",
    method: "GET",
    path: "/api/inbox",
    title: "Get Mailbox Inbox",
    description: "Retrieves incoming messages for a specific username and domain address.",
    params: [
      {
        name: "user",
        type: "string",
        required: true,
        defaultVal: "demo123",
        description: "The mailbox username (the part before @).",
      },
      {
        name: "domain",
        type: "string",
        required: true,
        defaultVal: "owo-mailteam.bond",
        description: "The mailbox domain (the part after @).",
      },
    ],
    sampleResponse: [
      {
        id: "msg-982341",
        from: "Security Team <verify@service.com>",
        subject: "Your verification code: 849201",
        time: "Just now",
        preview: "Here is your 6-digit confirmation code...",
        link: "https://tempmail-orcin.vercel.app/demo123@owo-mailteam.bond",
      },
    ],
  },
  {
    id: "mail",
    method: "GET",
    path: "/api/mail",
    title: "Get Email Content",
    description: "Fetches full email details including sanitized HTML body, plain text fallback, sender info, and timestamp.",
    params: [
      {
        name: "id",
        type: "string",
        required: true,
        defaultVal: "msg-982341",
        description: "The unique message ID returned by the inbox endpoint.",
      },
      {
        name: "user",
        type: "string",
        required: true,
        defaultVal: "demo123",
        description: "The mailbox username.",
      },
      {
        name: "domain",
        type: "string",
        required: true,
        defaultVal: "owo-mailteam.bond",
        description: "The mailbox domain.",
      },
    ],
    sampleResponse: {
      id: "msg-982341",
      from: "Security Team <verify@service.com>",
      to: "demo123@owo-mailteam.bond",
      subject: "Your verification code: 849201",
      date: "06 Sep 2026 02:30:15 +0700",
      html: "<div style='font-family:sans-serif;'><h2>Your OTP</h2><p>849201</p></div>",
      text: "Your OTP is 849201. Do not share this code.",
      avatar: "S",
    },
  },
  {
    id: "uptime",
    method: "GET",
    path: "/api/uptime",
    title: "Get Domain Uptime",
    description: "Checks real-time domain network health and age duration (e.g. 16 days).",
    params: [
      {
        name: "domain",
        type: "string",
        required: true,
        defaultVal: "owo-mailteam.bond",
        description: "The domain name to check status for.",
      },
      {
        name: "user",
        type: "string",
        required: false,
        defaultVal: "demo123",
        description: "Optional mailbox username to assist upstream query.",
      },
    ],
    sampleResponse: {
      domain: "owo-mailteam.bond",
      uptime: "16 days",
    },
  },
];

export default function DocsPage() {
  const [activeEndpoint, setActiveEndpoint] = useState<EndpointDef>(ENDPOINTS[0]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [snippetLang, setSnippetLang] = useState<"curl" | "js" | "python">("curl");
  const [loading, setLoading] = useState(false);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseLatency, setResponseLatency] = useState<number | null>(null);
  const [responseData, setResponseData] = useState<unknown>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedRes, setCopiedRes] = useState(false);
  const [origin, setOrigin] = useState("https://tempmail-orcin.vercel.app");

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.origin) {
      setOrigin(window.location.origin);
    }
  }, []);

  useEffect(() => {
    const initialParams: Record<string, string> = {};
    activeEndpoint.params.forEach((p) => {
      initialParams[p.name] = p.defaultVal;
    });
    setParamValues(initialParams);
    setResponseStatus(null);
    setResponseLatency(null);
    setResponseData(activeEndpoint.sampleResponse);
  }, [activeEndpoint]);

  function buildRequestUrl(): string {
    const search = new URLSearchParams();
    activeEndpoint.params.forEach((p) => {
      const val = paramValues[p.name];
      if (val) search.set(p.name, val);
    });
    const qs = search.toString();
    return `${origin}${activeEndpoint.path}${qs ? `?${qs}` : ""}`;
  }

  async function handleSendRequest() {
    setLoading(true);
    setResponseStatus(null);
    setResponseLatency(null);
    const start = performance.now();
    try {
      const url = buildRequestUrl();
      const res = await fetch(url, { method: "GET" });
      const duration = Math.round(performance.now() - start);
      setResponseStatus(res.status);
      setResponseLatency(duration);
      const data = await res.json();
      setResponseData(data);
    } catch (err: unknown) {
      const duration = Math.round(performance.now() - start);
      setResponseStatus(500);
      setResponseLatency(duration);
      setResponseData({
        error: "Request failed",
        message: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setLoading(false);
    }
  }

  function getSnippet(): string {
    const fullUrl = buildRequestUrl();
    if (snippetLang === "curl") {
      return `curl -X GET "${fullUrl}" \\
  -H "Accept: application/json"`;
    }
    if (snippetLang === "js") {
      return `const res = await fetch("${fullUrl}", {
  headers: { "Accept": "application/json" }
});
const data = await res.json();
console.log(data);`;
    }
    return `import requests

res = requests.get(
    "${fullUrl}",
    headers={"Accept": "application/json"}
)
print(res.json())`;
  }

  function copyText(text: string, isCode: boolean) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      if (isCode) {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      } else {
        setCopiedRes(true);
        setTimeout(() => setCopiedRes(false), 2000);
      }
    }
  }

  return (
    <div className="docs-page">
      <nav className="nav" role="navigation" aria-label="Main navigation">
        <div className="nav-inner">
          <Link href="/" className="nav-logo" aria-label="TempMail home">
            <img src="/logo-192.webp" alt="TempMail" width="32" height="32" loading="eager" decoding="async" />
            <span className="nav-logo-text">Temp<em>Mail</em></span>
          </Link>
          <div className="nav-links">
            <Link href="/#inbox" className="nav-link-item">Inbox</Link>
            <Link href="/#features" className="nav-link-item">Features</Link>
            <Link href="/docs" className="nav-link-item active">API Docs</Link>
          </div>
          <button
            className={`nav-burger${menuOpen ? " open" : ""}`}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span /><span /><span />
          </button>
        </div>
        {menuOpen && (
          <div className="nav-menu">
            <Link href="/#inbox" className="nav-menu-item" onClick={() => setMenuOpen(false)}>Inbox</Link>
            <Link href="/#features" className="nav-menu-item" onClick={() => setMenuOpen(false)}>Features</Link>
            <Link href="/docs" className="nav-menu-item" onClick={() => setMenuOpen(false)}>API Docs</Link>
            <Link href="/" className="nav-menu-item" onClick={() => setMenuOpen(false)}>New address</Link>
          </div>
        )}
      </nav>

      <div className="docs-mobile-bar">
        <div className="container docs-mobile-bar-inner">
          <div className="docs-mobile-pill-list">
            {ENDPOINTS.map((ep) => {
              const active = ep.id === activeEndpoint.id;
              return (
                <button
                  key={ep.id}
                  onClick={() => setActiveEndpoint(ep)}
                  className={`docs-mobile-pill${active ? " active" : ""}`}
                >
                  <span className="docs-method-tag">GET</span>
                  <span>{ep.path.replace("/api/", "/")}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="container docs-layout">
        <aside className="docs-sidebar">
          <div className="docs-sidebar-group">
            <div className="docs-sidebar-title">Base URL</div>
            <div className="docs-base-url-card">
              <span className="docs-base-url-label">Endpoint Prefix</span>
              <code>{origin}/api</code>
            </div>
          </div>

          <div className="docs-sidebar-group">
            <div className="docs-sidebar-title">Endpoints</div>
            <nav className="docs-nav-list">
              {ENDPOINTS.map((ep) => {
                const active = ep.id === activeEndpoint.id;
                return (
                  <button
                    key={ep.id}
                    onClick={() => setActiveEndpoint(ep)}
                    className={`docs-nav-btn${active ? " active" : ""}`}
                  >
                    <span className="docs-method-tag">GET</span>
                    <span className="docs-nav-label">{ep.path}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="docs-sidebar-group">
            <div className="docs-sidebar-title">Specs</div>
            <ul className="docs-specs-list">
              <li>✓ Format: JSON</li>
              <li>✓ Public Access: Open CORS</li>
              <li>✓ Live Sync: Real-time</li>
            </ul>
          </div>
        </aside>

        <main className="docs-content">
          <div className="docs-endpoint-header">
            <div className="docs-endpoint-title-row">
              <span className="docs-method-badge">{activeEndpoint.method}</span>
              <h1 className="docs-endpoint-path">{activeEndpoint.path}</h1>
            </div>
            <p className="docs-endpoint-desc">{activeEndpoint.description}</p>
          </div>

          <section className="docs-section">
            <h2 className="docs-section-title">Parameters</h2>
            {activeEndpoint.params.length === 0 ? (
              <p className="docs-no-params">No query parameters required for this endpoint.</p>
            ) : (
              <div className="docs-table-wrapper">
                <table className="docs-params-table">
                  <thead>
                    <tr>
                      <th>Param</th>
                      <th>Type</th>
                      <th>Requirement</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeEndpoint.params.map((p) => (
                      <tr key={p.name}>
                        <td><code>{p.name}</code></td>
                        <td><span className="docs-type-tag">{p.type}</span></td>
                        <td>
                          {p.required ? (
                            <span className="docs-req-tag">Required</span>
                          ) : (
                            <span className="docs-opt-tag">Optional</span>
                          )}
                        </td>
                        <td>{p.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="docs-section">
            <div className="docs-section-header-split">
              <h2 className="docs-section-title">Live Tester</h2>
              <button
                type="button"
                onClick={handleSendRequest}
                disabled={loading}
                className="docs-send-btn"
              >
                {loading ? "Testing..." : "▶ Send Request"}
              </button>
            </div>

            {activeEndpoint.params.length > 0 && (
              <div className="docs-inputs-card">
                <div className="docs-inputs-grid">
                  {activeEndpoint.params.map((p) => (
                    <label key={p.name} className="docs-field">
                      <span className="docs-field-label">
                        {p.name} {p.required && <span className="docs-field-req">*</span>}
                      </span>
                      <input
                        type="text"
                        value={paramValues[p.name] ?? ""}
                        onChange={(e) =>
                          setParamValues({ ...paramValues, [p.name]: e.target.value })
                        }
                        placeholder={p.defaultVal}
                        className="docs-input"
                      />
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="docs-code-container">
              <div className="docs-code-header">
                <div className="docs-lang-tabs">
                  {(["curl", "js", "python"] as const).map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setSnippetLang(lang)}
                      className={`docs-lang-tab${snippetLang === lang ? " active" : ""}`}
                    >
                      {lang === "curl" ? "cURL" : lang === "js" ? "JavaScript" : "Python"}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => copyText(getSnippet(), true)}
                  className="docs-copy-btn"
                >
                  {copiedCode ? "Copied!" : "Copy Snippet"}
                </button>
              </div>
              <pre className="docs-code-body">
                <code>{getSnippet()}</code>
              </pre>
            </div>
          </section>

          <section className="docs-section">
            <div className="docs-section-header-split">
              <div className="docs-res-title-group">
                <h2 className="docs-section-title">Response Output</h2>
                {responseStatus !== null && (
                  <span
                    className={`docs-status-badge ${
                      responseStatus >= 200 && responseStatus < 300
                        ? "success"
                        : "error"
                    }`}
                  >
                    {responseStatus}
                  </span>
                )}
                {responseLatency !== null && (
                  <span className="docs-latency-badge">{responseLatency} ms</span>
                )}
              </div>
              <button
                type="button"
                onClick={() =>
                  copyText(JSON.stringify(responseData, null, 2), false)
                }
                className="docs-copy-btn"
              >
                {copiedRes ? "Copied!" : "Copy JSON"}
              </button>
            </div>

            <pre className="docs-code-body docs-response-body">
              <code>{JSON.stringify(responseData, null, 2)}</code>
            </pre>
          </section>
        </main>
      </div>

      <footer>
        <div className="container footer">
          <span className="footer-logo">
            <img src="/logo-192.webp" alt="TempMail" width="28" height="28" loading="lazy" decoding="async" />
            <span>Temp<em>Mail</em></span>
          </span>
          <span className="footer-text">
            Powered by <a href="https://warungerik.com" target="_blank" rel="noopener noreferrer" style={{ color: "var(--gold)", textDecoration: "none" }}>warungerik.com</a> infrastructure
          </span>
        </div>
      </footer>
    </div>
  );
}
