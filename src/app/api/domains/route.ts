import { NextResponse } from "next/server";

const ORIGIN = "https://generator.email";

async function getApiToken(): Promise<string> {
  const res = await fetch(ORIGIN, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Accept": "text/html",
    },

    next: { revalidate: 600 },
  });
  const html = await res.text();
  const match = html.match(/<meta[^>]+name="api-token"[^>]+content="([^"]+)"/);
  return match?.[1] ?? "";
}

export async function GET() {
  try {
    const token = await getApiToken();
    const res = await fetch(`${ORIGIN}/api/domains.php`, {
      headers: {
        "X-API-Token": token,
        "X-Requested-With": "XMLHttpRequest",
        "Referer": ORIGIN,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      next: { revalidate: 300 },
    });

    if (res.status === 403) {

      const freshToken = await getApiToken();
      const retry = await fetch(`${ORIGIN}/api/domains.php`, {
        headers: {
          "X-API-Token": freshToken,
          "X-Requested-With": "XMLHttpRequest",
          "Referer": ORIGIN,
          "User-Agent": "Mozilla/5.0",
        },
      });
      if (!retry.ok) throw new Error(`upstream ${retry.status}`);
      return NextResponse.json(await retry.json());
    }

    if (!res.ok) throw new Error(`upstream ${res.status}`);
    return NextResponse.json(await res.json());
  } catch (e) {
    console.error("[/api/domains]", e);

    return NextResponse.json([
      { display: "gmail-xsniper.site", ascii: "gmail-xsniper.site" },
      { display: "guerrillamail.com", ascii: "guerrillamail.com" },
      { display: "sharklasers.com", ascii: "sharklasers.com" },
      { display: "guerrillamailblock.com", ascii: "guerrillamailblock.com" },
      { display: "grr.la", ascii: "grr.la" },
      { display: "guerrillamail.info", ascii: "guerrillamail.info" },
      { display: "spam4.me", ascii: "spam4.me" },
    ]);
  }
}
