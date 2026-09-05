"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";

interface Domain {
  display: string;
  ascii: string;
  idn?: boolean;
}

interface EmailMessage {
  id: string;
  from: string;
  subject: string;
  date: string;
  link: string;
  isNew?: boolean;
}

interface EmailDetail {
  from: string;
  subject: string;
  date: string;
  link: string;
  body: string;
  bodyType: "html" | "text";
}

function randomUsername(): string {
  const adj = ["silent", "quick", "dark", "swift", "calm", "bright", "bold", "crisp"];
  const noun = ["fox", "wolf", "hawk", "bear", "pine", "reed", "stone", "peak"];
  const num = Math.floor(Math.random() * 900 + 100);
  return `${adj[Math.floor(Math.random() * adj.length)]}${noun[Math.floor(Math.random() * noun.length)]}${num}`;
}

function formatTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    return isToday
      ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : d.toLocaleDateString([], { month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

const WS_URL = "wss://generator.email/notificon/ws";

export default function Home() {
  const [username, setUsername] = useState("");
  const [domain, setDomain] = useState("gmail-xsniper.site");
  const [mounted, setMounted] = useState(false);
  const [domains, setDomains] = useState<Domain[]>([]);

  const [messages, setMessages] = useState<EmailMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [wsState, setWsState] = useState<"online" | "connecting" | "offline">("connecting");
  const [uptime, setUptime] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [detail, setDetail] = useState<EmailDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const domainRef = useRef(domain);
  useEffect(() => { domainRef.current = domain; }, [domain]);

  const email = `${username}@${domain}`.toLowerCase();

  const params = useParams<{ mailbox?: string }>();

  useEffect(() => {
    const raw = decodeURIComponent(params?.mailbox ?? "");
    const at = raw.indexOf("@");
    if (at > 0) {
      const u = raw.slice(0, at).toLowerCase().replace(/[^a-z0-9._-]/g, "");
      const d = raw.slice(at + 1).toLowerCase();
      if (u && d.includes(".")) {
        setUsername(u.slice(0, 25));
        setDomain(d);
        setMounted(true);
        return;
      }
    }
    setUsername(randomUsername());
    setMounted(true);

  }, []);

  useEffect(() => {
    fetch("/api/domains")
      .then((r) => r.json())
      .then((data: Domain[]) => {
        if (Array.isArray(data) && data.length) {
          setDomains((prev) => {
            const cur = domainRef.current;
            const has = data.some((d) => d.ascii === cur);
            return has ? data : [{ display: cur, ascii: cur }, ...data];
          });
        }
      })
      .catch(() => { });

  }, []);

  useEffect(() => {
    if (!username || !domain) return;
    let cancelled = false;
    setUptime(null);
    fetch(`/api/uptime?user=${encodeURIComponent(username)}&domain=${encodeURIComponent(domain)}`)
      .then((r) => r.json())
      .then((d: { status?: string; uptime?: string }) => {
        if (!cancelled && d?.status === "good" && d.uptime) setUptime(d.uptime);
      })
      .catch(() => { });
    return () => { cancelled = true; };
  }, [username, domain]);

  const connectWs = useCallback((emailAddr: string) => {
    if (wsRef.current) wsRef.current.close(1000);
    setWsState("connecting");

    const ws = new WebSocket(`${WS_URL}?email=${encodeURIComponent(emailAddr)}`);
    wsRef.current = ws;

    ws.onopen = () => setWsState("online");

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        const incoming: EmailMessage = {
          id: msg.link ?? String(Date.now()),
          from: msg.from ?? "Unknown",
          subject: msg.subject ?? "(no subject)",
          date: msg.date ?? new Date().toISOString(),
          link: msg.link ?? "",
          isNew: true,
        };

        setMessages((prev) => {
          const dup = prev.some(
            (m) => m.from === incoming.from && m.subject === incoming.subject && m.date === incoming.date
          );
          return dup ? prev : [incoming, ...prev];
        });
      } catch { }
    };

    ws.onclose = (e) => {
      if (e.code === 1000) return;
      setWsState("offline");
      reconnectTimer.current = setTimeout(() => connectWs(emailAddr), 6000);
    };
  }, []);

  const loadInbox = useCallback(async (user: string, dom: string) => {
    if (!user || !dom) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/inbox?user=${encodeURIComponent(user)}&domain=${encodeURIComponent(dom)}`);
      const data: EmailMessage[] = await res.json();
      if (!Array.isArray(data)) return;
      setMessages((prev) => {
        const wsOnly = prev.filter((m) => m.isNew);
        const merged = [...wsOnly];
        for (const m of data) {
          const dup = merged.some((x) => x.from === m.from && x.subject === m.subject && x.date === m.date);
          if (!dup) merged.push(m);
        }
        return merged;
      });
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    connectWs(email);
    setMessages([]);
    loadInbox(username, domain);
    const t = setInterval(() => loadInbox(username, domain), 7000);
    return () => {
      clearInterval(t);
      if (wsRef.current) wsRef.current.close(1000);
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
  }, [email, username, domain, connectWs, loadInbox]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  function copyEmail() {
    navigator.clipboard.writeText(email).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function generateNew() {
    setUsername(randomUsername());
    setMessages([]);

    setDomains((list) => {
      if (list.length) setDomain(list[Math.floor(Math.random() * list.length)].ascii);
      return list;
    });
  }

  async function openMessage(msg: EmailMessage) {
    setDetailLoading(true);
    setDetail({
      from: msg.from,
      subject: msg.subject,
      date: msg.date,
      link: msg.link,
      body: "",
      bodyType: "html",
    });

    setMessages((prev) =>
      prev.map((m) => (m.id === msg.id ? { ...m, isNew: false } : m))
    );
    try {
      const res = await fetch(
        `/api/mail?link=${encodeURIComponent(msg.link)}&user=${encodeURIComponent(username)}&domain=${encodeURIComponent(domain)}`
      );
      if (!res.ok) throw new Error("no-body");
      const body = await res.text();
      setDetail((d) => d ? { ...d, body, bodyType: "html" } : null);
    } catch {
      setDetail((d) => d ? { ...d, body: "<p style='color:#666'>Isi pesan tidak bisa dimuat saat ini. Coba buka lagi.</p>", bodyType: "html" } : null);
    } finally {
      setDetailLoading(false);
    }
  }

  const features = [
    {
      icon: (
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      title: "Real-time delivery",
      text: "Messages arrive the instant they're sent. No refresh. A live WebSocket connection keeps your inbox open.",
    },
    {
      icon: (
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <rect x="3" y="11" width="18" height="11" rx="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      title: "Zero registration",
      text: "No name, no phone, no password. The mailbox exists before you do anything. Completely anonymous by design.",
    },
    {
      icon: (
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      title: "Hundreds of domains",
      text: "Pick from a large catalog of live domains. Search, filter, or let the generator choose one at random.",
    },
    {
      icon: (
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path d="M15.172 7l-6.586 6.586a2 2 0 1 0 2.828 2.828l6.414-6.586a4 4 0 1 0-5.656-5.656l-6.415 6.585a6 6 0 1 0 8.486 8.486L20.5 13" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      title: "Attachments included",
      text: "Tickets, invoices, PDFs — any attachment that arrives is accessible directly from the message.",
    },
    {
      icon: (
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="9" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      title: "Custom username",
      text: "Type any name you like before the @ to claim that address on the chosen domain.",
    },
  ];

  return (
    <>
      {}
      <nav className="nav" role="navigation" aria-label="Main navigation">
        <div className="nav-inner">
          <a href="/" className="nav-logo" aria-label="TempMail home">
            <img src="/logo-192.webp" alt="TempMail" width="32" height="32" loading="eager" decoding="async" />
            <span className="nav-logo-text">Temp<em>Mail</em></span>
          </a>
          <div className="nav-links">
            <a href="#inbox" className="nav-link-item">Inbox</a>
            <a href="#features" className="nav-link-item">Features</a>
            <a href="/docs" className="nav-link-item">API Docs</a>
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
            <a href="#inbox" className="nav-menu-item" onClick={() => setMenuOpen(false)}>Inbox</a>
            <a href="#features" className="nav-menu-item" onClick={() => setMenuOpen(false)}>Features</a>
            <a href="/docs" className="nav-menu-item" onClick={() => setMenuOpen(false)}>API Docs</a>
            <a href="/" className="nav-menu-item" onClick={() => setMenuOpen(false)}>New address</a>
          </div>
        )}
      </nav>

      {}
      <section className="hero" id="top">
        <div className="container">
          <div className="hero-eyebrow">
            <span className="hero-eyebrow-dot" />
            Free · No registration · Instant
          </div>

          <h1 className="hero-title">
            Disposable email,{" "}
            <em>ready now</em>
          </h1>

          <p className="hero-subtitle">
            A working inbox appears the moment you land. Copy the address, use it anywhere, read what arrives — no sign-up, no phone, no trace.
          </p>

          {}
          <div className="email-card-shell">
            <div className="email-card-core">
              <div className="email-display" aria-label="Your temporary email address" id="email-address">
                <span>{username}</span>
                <span className="domain">@{domain}</span>
              </div>

              {}
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: 0, flexWrap: "wrap" }}>
                <div className="input-group" style={{ marginBottom: "1rem" }}>
                  <input
                    id="username-input"
                    className="email-input"
                    value={username}
                    maxLength={25}
                    spellCheck={false}
                    autoComplete="off"
                    aria-label="Email username"
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ""))}
                    style={{ paddingLeft: "0.875rem" }}
                  />
                  <span className="input-group-at">@</span>
                </div>

                <div className="select-wrap">
                  <select
                    id="domain-select"
                    className="domain-select"
                    value={domain}
                    aria-label="Email domain"
                    onChange={(e) => setDomain(e.target.value)}
                  >
                    {domains.length === 0 ? (
                      <option value={domain}>{domain}</option>
                    ) : (
                      domains.map((d) => (
                        <option key={d.ascii} value={d.ascii}>
                          {d.display}
                        </option>
                      ))
                    )}
                  </select>
                  <svg className="select-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>

              {}
              <div className="email-controls">
                <button id="copy-btn" className="btn btn-primary" onClick={copyEmail} aria-label="Copy email address">
                  <span>{copied ? "Copied!" : "Copy address"}</span>
                  <span className="btn-icon" aria-hidden="true">
                    {copied ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <rect x="9" y="9" width="13" height="13" rx="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" strokeLinecap="round" />
                      </svg>
                    )}
                  </span>
                </button>
                <button id="generate-btn" className="btn btn-secondary" onClick={generateNew} aria-label="Generate new random email">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 4v6h-6M1 20v-6h6" />
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                  </svg>
                  New random
                </button>
              </div>

              {}
              <div className="status-bar" role="status" aria-live="polite">
                <span className={`ws-dot ${wsState}`} aria-hidden="true" />
                <span>
                  {wsState === "online"
                    ? `Listening for mail${uptime ? ` · uptime ${uptime} day${uptime === "1" ? "" : "s"}` : ""}`
                    : wsState === "connecting" ? "Connecting…" : "Offline — reconnecting"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {}
      <section className="inbox-section" id="inbox">
        <div className="container">
          <p className="section-eyebrow" aria-hidden="true">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="4" />
            </svg>
            Live Inbox
          </p>
          <h2 className="inbox-section-title reveal">Your messages</h2>
          <p className="inbox-count reveal reveal-delay-1">
            {messages.length === 0 ? "No messages yet" : `${messages.length} message${messages.length !== 1 ? "s" : ""}`}
          </p>

          <div className="inbox-shell reveal reveal-delay-2">
            <div className="inbox-core">
              {}
              <div className="inbox-toolbar">
                <div className="inbox-toolbar-left">
                  <button
                    id="refresh-btn"
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      connectWs(email);
                      loadInbox(username, domain);
                    }}
                    aria-label="Refresh inbox"
                  >
                    <svg className={`refresh-icon${loading ? " spinning" : ""}`} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 4v6h-6M1 20v-6h6" />
                      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                    </svg>
                    Refresh
                  </button>
                </div>
                {messages.length > 0 && (
                  <button
                    id="clear-btn"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setMessages([])}
                    aria-label="Clear all messages"
                    style={{ color: "var(--red)", opacity: 0.7 }}
                  >
                    Clear all
                  </button>
                )}
              </div>

              {}
              <div className="inbox-header" role="row">
                <span className="inbox-header-cell" role="columnheader">From</span>
                <span className="inbox-header-cell" role="columnheader">Subject</span>
                <span className="inbox-header-cell" role="columnheader" style={{ textAlign: "right" }}>Time</span>
              </div>

              {}
              {loading ? (
                [1, 2, 3].map((i) => (
                  <div className="skeleton-row" key={i} aria-hidden="true">
                    <div className="skeleton" style={{ width: "120px" }} />
                    <div className="skeleton" style={{ flex: 1 }} />
                    <div className="skeleton" style={{ width: "50px" }} />
                  </div>
                ))
              ) : messages.length === 0 ? (
                <div className="inbox-empty" role="status">
                  <svg className="inbox-empty-icon" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="6" y="10" width="36" height="28" rx="3" />
                    <path d="M6 16l18 12 18-12" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p className="inbox-empty-title">Waiting for mail</p>
                  <p className="inbox-empty-sub">
                    Copy the address above and use it anywhere.<br />
                    New messages appear here in seconds.
                  </p>
                </div>
              ) : (
                <div role="list" aria-label="Email messages">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      role="listitem"
                      className={`email-row${msg.isNew ? " unread" : ""}`}
                      onClick={() => openMessage(msg)}
                      tabIndex={0}
                      onKeyDown={(e) => e.key === "Enter" && openMessage(msg)}
                      aria-label={`Email from ${msg.from}: ${msg.subject}`}
                    >
                      <span className="email-row-from">{msg.from}</span>
                      <span className="email-row-subject">{msg.subject}</span>
                      <span className="email-row-time">{formatTime(msg.date)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {}
      <section className="features" id="features">
        <div className="container">
          <p className="section-eyebrow reveal">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="4" /></svg>
            Features
          </p>
          <h2 className="section-title reveal reveal-delay-1">Built for speed, privacy, and zero friction</h2>
          <p className="section-sub reveal reveal-delay-2">
            Every design decision points at one thing: getting a working inbox in front of you with as few steps as possible.
          </p>

          <div className="bento" aria-label="Features">
            {features.map((f, i) => (
              <div key={i} className={`bento-card reveal reveal-delay-${Math.min(i + 1, 4)}`}>
                <div className="bento-card-inner">
                  <div className="bento-icon" aria-hidden="true">{f.icon}</div>
                  <h3 className="bento-title">{f.title}</h3>
                  <p className="bento-text">{f.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {}
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

      {}
      {detail && (
        <div
          className="email-detail-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Email message"
        >
          <div
            className="email-detail-backdrop"
            onClick={() => setDetail(null)}
          />
          <div className="email-detail-panel">
            <button
              className="email-detail-close"
              onClick={() => setDetail(null)}
              aria-label="Close email"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div className="email-detail-inner">
              <div className="email-detail-head">
                <h2 className="email-detail-subject">{detail.subject || "(no subject)"}</h2>
                <div className="email-meta">
                  <div className="email-meta-row">
                    <span className="email-meta-label">From</span>
                    <span className="email-meta-value">{detail.from}</span>
                  </div>
                  <div className="email-meta-row">
                    <span className="email-meta-label">To</span>
                    <span className="email-meta-value">{email}</span>
                  </div>
                  <div className="email-meta-row">
                    <span className="email-meta-label">Date</span>
                    <span className="email-meta-value" style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.8125rem" }}>
                      {detail.date}
                    </span>
                  </div>
                </div>
              </div>
              <div className="email-detail-body">
                {detailLoading ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="skeleton" style={{ height: "1rem", width: `${[80, 65, 90, 55][i - 1]}%` }} />
                    ))}
                  </div>
                ) : detail.bodyType === "html" ? (
                  <div dangerouslySetInnerHTML={{ __html: detail.body }} />
                ) : (
                  <pre>{detail.body}</pre>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
