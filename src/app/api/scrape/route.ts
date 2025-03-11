import puppeteer from "puppeteer";
import { NextRequest, NextResponse } from "next/server";

interface ElementData {
  cssSelector: string;
  xpathSelector: string;
  text: string;
  attributes: Record<string, string | null>;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

    const elements: ElementData[] = await page.evaluate(() => {
      const getXPath = (element: Element): string => {
        if (element.id) return `//*[@id="${element.id}"]`;
        const parts: string[] = [];
        let currentElement: Element | null = element;

        while (currentElement && currentElement.nodeType === Node.ELEMENT_NODE) {
          let index = 1;
          let sibling = currentElement.previousElementSibling as Element | null;

          while (sibling) {
            if (sibling.tagName === currentElement.tagName) index++;
            sibling = sibling.previousElementSibling as Element | null;
          }

          parts.unshift(`${currentElement.tagName.toLowerCase()}[${index}]`);
          currentElement = currentElement.parentElement;
        }
        return `/${parts.join("/")}`;
      };

      return Array.from(document.querySelectorAll("*"))
        .map((el) => {
          const tagName = el.tagName.toLowerCase();
          const id = el.id ? `#${el.id}` : "";
          const classList = el.classList.length ? `.${Array.from(el.classList).join(".")}` : "";
          const cssSelector = `${tagName}${id}${classList}`;
          const xpathSelector = getXPath(el);
          const text = el.textContent?.trim() || "";
          const attributes = el.getAttributeNames().reduce((acc, name) => {
            acc[name] = el.getAttribute(name);
            return acc;
          }, {} as Record<string, string | null>);

          return text ? { cssSelector, xpathSelector, text, attributes } : null;
        })
        .filter((el): el is ElementData => el !== null);
    });

    await browser.close();
    return NextResponse.json(elements);
  } catch (error) {
    console.error("Scraping Error:", error);
    return NextResponse.json({ error: "Failed to scrape the website", details: String(error) }, { status: 500 });
  }
}
