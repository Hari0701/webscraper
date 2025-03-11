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
  const [selectedElement, setSelectedElement] = useState<ElementData | null>(null);

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

  const filteredData = data.filter((el) => el.text.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-5 flex h-screen">
      <div className="w-1/2 border-r p-4">
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Enter website URL" className="border p-2 mb-4 w-full" />
        <button onClick={scrapeWebsite} className="bg-blue-500 text-white p-2 rounded mb-4 w-full cursor-pointer">
          Scrape
        </button>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search elements"
          className="border p-2 mb-4 w-full"
        />
        <ul className="list-disc pl-5">
          {filteredData.map((el, index) => (
            <li key={index} onClick={() => setSelectedElement(el)} className="cursor-pointer hover:bg-gray-200 p-2">
              {el.selector}
            </li>
          ))}
        </ul>
      </div>
      <div className="w-1/2 p-4">
        {selectedElement ? (
          <div className="border p-4 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-2">Selected Element</h2>
            <p>
              <strong>Selector:</strong> {selectedElement.selector}
            </p>
            <p>
              <strong>Text:</strong> {selectedElement.text}
            </p>
            <p>
              <strong>Attributes:</strong> {JSON.stringify(selectedElement.attributes, null, 2)}
            </p>
          </div>
        ) : (
          <p className="text-gray-500">Select an element to view details</p>
        )}
      </div>
    </div>
  );
}
