import puppeteer from "puppeteer";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  if (!url) return NextResponse.json({ error: "URL is required" }, { status: 400 });

  try {
    const browser = await puppeteer.launch({
      headless: true, // Use "new" mode to avoid issues
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 }); // Set 30s timeout

    const elements = await page.evaluate(() => {
      let data: { selector: string; text: string; attributes: Record<string, string | null> }[] = [];

      document.querySelectorAll("*").forEach((el) => {
        const tagName = el.tagName.toLowerCase();
        const id = el.id ? `#${el.id}` : "";
        const classList = el.classList?.length ? `.${Array.from(el.classList).join(".")}` : ""; // Ensure classList is a valid string

        const selector = `${tagName}${id}${classList}`;

        data.push({
          selector: selector,
          text: el.textContent?.trim() || "",
          attributes: el.getAttributeNames().reduce((acc, name) => {
            acc[name] = el.getAttribute(name);
            return acc;
          }, {} as Record<string, string | null>),
        });
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
