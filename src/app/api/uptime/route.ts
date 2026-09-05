import { NextRequest, NextResponse } from "next/server";

const ORIGIN = "https://generator.email";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const user = (q.get("user") ?? "").trim();
  const domain = (q.get("domain") ?? "").trim();
  if (!user || !domain) {
    return NextResponse.json({ status: "bad", uptime: "0" }, { status: 400 });
  }
  try {
    const res = await fetch(`${ORIGIN}/uptime.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": UA,
        Referer: `${ORIGIN}/${domain}/${user}`,
      },
      body: `dmn=${encodeURIComponent(domain)}&usr=${encodeURIComponent(user)}`,
      cache: "no-store",
    });
    const text = await res.text();
    try {
      const data = JSON.parse(text);
      return NextResponse.json({ status: data.status ?? "bad", uptime: String(data.uptime ?? "0") });
    } catch {
      return NextResponse.json({ status: "bad", uptime: "0" });
    }
  } catch {
    return NextResponse.json({ status: "bad", uptime: "0" }, { status: 502 });
  }
}
