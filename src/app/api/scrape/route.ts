import puppeteer from "puppeteer";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  if (!url) return NextResponse.json({ error: "URL is required" }, { status: 400 });

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

    const elements = await page.evaluate(() => {
      let data: { selector: string; text: string; attributes: Record<string, string | null> }[] = [];
      document.querySelectorAll("*").forEach((el) => {
        const tagName = el.tagName.toLowerCase();
        const id = el.id ? `#${el.id}` : "";
        const classList = el.classList?.length ? `.${Array.from(el.classList).join(".")}` : "";
        const selector = `${tagName}${id}${classList}`;
        const text = el.textContent?.trim() || "";

        if (text) {
          // Only store elements with text content
          data.push({
            selector: selector,
            text: text,
            attributes: el.getAttributeNames().reduce((acc, name) => {
              acc[name] = el.getAttribute(name);
              return acc;
            }, {} as Record<string, string | null>),
          });
        }
      });
      return data;
    });

    await browser.close();
    return NextResponse.json(elements);
  } catch (error) {
    console.error("Scraping Error:", error);
    return NextResponse.json({ error: "Failed to scrape the website", details: String(error) }, { status: 500 });
  }
}
