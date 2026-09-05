import { NextRequest, NextResponse } from "next/server";

const ORIGIN = "https://generator.email";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const link = (q.get("link") ?? "").replace(/^\/+/, "");
  const user = q.get("user") ?? "";
  const domain = q.get("domain") ?? "";
  if (!link && !(user && domain)) {
    return NextResponse.json({ error: "missing link" }, { status: 400 });
  }

  const segs = link.split("/").filter(Boolean);
  const cookies = new Set<string>();
  if (link) cookies.add(link);
  if (segs.length >= 2) cookies.add(`${segs[0]}/${segs[1]}/`);
  if (segs.length >= 2) cookies.add(`${segs[0]}/${segs[1]}`);

  const at = link.indexOf("@");
  if (at !== -1) {
    const u = link.slice(0, at);
    const d = link.slice(at + 1).split("/")[0];
    if (u && d) cookies.add(`${d}/${u}/`);
  }
  if (user && domain) {
    cookies.add(`${domain}/${user}/`);
    cookies.add(`${domain}/${user}`);
  }

  for (const ctx of cookies) {
    try {
      const res = await fetch(`${ORIGIN}/inbox1/`, {
        headers: {
          Referer: `${ORIGIN}/${link || `${domain}/${user}`}`,
          "User-Agent": UA,
          Accept: "text/html,application/xhtml+xml",
          "Accept-Language": "en-US,en;q=0.9",
          Cookie: `inbox_ctx=${encodeURIComponent(ctx)};`,
        },
      });
      if (!res.ok) continue;
      const html = await res.text();
      if (!html.includes("mess_bodiyy")) continue;

      const m =
        html.match(/mess_bodiyy[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<ins/i) ??
        html.match(/mess_bodiyy[^>]*>([\s\S]*?)<\/div>\s*<\/div>/i);
      if (!m) continue;

      const body = m[1]
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<ins[\s\S]*?<\/ins>/gi, "")
        .replace(/src="\//g, `src="${ORIGIN}/`)
        .replace(/href="\//g, `href="${ORIGIN}/`)
        .trim();
      if (!body) continue;

      return new NextResponse(body, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    } catch {

    }
  }

  return NextResponse.json({ error: "no-body" }, { status: 404 });
}
