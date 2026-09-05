import { NextRequest, NextResponse } from "next/server";

const ORIGIN = "https://generator.email";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const user = (q.get("user") ?? "").trim();
  const domain = (q.get("domain") ?? "").trim();
  if (!user || !domain) {
    return NextResponse.json({ error: "missing user/domain" }, { status: 400 });
  }

  const ctxShapes = [`${domain}/${user}/`, `${domain}/${user}`];

  for (const ctx of ctxShapes) {
    try {
      const res = await fetch(`${ORIGIN}/inbox1/`, {
        headers: {
          Referer: `${ORIGIN}/${domain}/${user}`,
          "User-Agent": UA,
          Accept: "text/html,application/xhtml+xml",
          "Accept-Language": "en-US,en;q=0.9",
          Cookie: `inbox_ctx=${encodeURIComponent(ctx)};`,
        },
        cache: "no-store",
      });
      if (!res.ok) continue;
      const html = await res.text();
      if (!html.includes("email-table")) continue;

      const tableStart = html.indexOf('id="email-table"');
      const tableEnd = html.indexOf('id="markodile"', tableStart);
      const table = html.substring(tableStart, tableEnd === -1 ? tableStart + 60000 : tableEnd);

      const rows = [...table.matchAll(/from_div_45g45gg">([^<]*)<\/div>\s*<div[^>]*subj_div_45g45gg">([^<]*)<\/div>\s*<div[^>]*time_div_45g45gg">([^<]*)<\/div>/g)];
      const link = `${domain}/${user}`;

      const messages = rows
        .filter((m) => m[1].trim() && m[1].trim().toLowerCase() !== "from")
        .map((m, i) => ({
          id: `${link}#${i}`,
          from: m[1].trim(),
          subject: m[2].trim() || "(no subject)",
          date: m[3].trim(),
          link,
          isNew: false,
        }));

      return NextResponse.json(messages);
    } catch {

    }
  }

  return NextResponse.json([]);
}
