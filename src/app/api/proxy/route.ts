import { NextRequest, NextResponse } from "next/server";
import fetch from "node-fetch";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing URL parameter" }, { status: 400 });
  }

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch site" }, { status: response.status });
    }

    let html = await response.text();

    // Rewrite relative URLs (CSS, JS, images) to go through the proxy
    const baseUrl = new URL(url);
    html = html.replace(/(href|src)="([^"]+)"/g, (match, attr, path) => {
      if (path.startsWith("http") || path.startsWith("//")) return match; // Keep absolute URLs
      const proxiedPath = new URL(path, baseUrl).href;
      return `${attr}="/api/proxy?url=${encodeURIComponent(proxiedPath)}"`;
    });

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Proxy Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
