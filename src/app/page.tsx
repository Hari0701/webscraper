"use client";
import { useState } from "react";

interface ElementData {
  selector: string;
  text: string;
  attributes: Record<string, string | null>;
}

export default function Home() {
  const [url, setUrl] = useState<string>("");
  const [data, setData] = useState<ElementData[]>([]);
  const [search, setSearch] = useState<string>("");

  const scrapeWebsite = async () => {
    if (!url) return alert("Enter a valid URL");

    try {
      const response = await fetch(`/api/scrape?url=${encodeURIComponent(url)}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error Response:", errorText);
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result: ElementData[] = await response.json();
      setData(result);
    } catch (error) {
      console.error("Fetch error:", error);
      alert("Failed to fetch data. Check console for details.");
    }
  };
  const filteredData = data.filter((el) => el.selector.includes(search) || el.text.includes(search));

  return (
    <div className="p-5">
      <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Enter website URL" className="border p-2 mb-4 w-full" />
      <button onClick={scrapeWebsite} className="bg-blue-500 text-white p-2 rounded mb-4 w-full cursor-pointer">
        Scrape
      </button>
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search elements" className="border p-2 mb-4 w-full" />
      <ul className="list-disc pl-5">
        {filteredData.map((el, index) => (
          <li
            key={index}
            onClick={() => alert(`Selector: ${el.selector}\nText: ${el.text}\nAttributes: ${JSON.stringify(el.attributes)}`)}
            className="cursor-pointer hover:bg-gray-200 p-2"
          >
            {el.selector}
          </li>
        ))}
      </ul>
    </div>
  );
}
