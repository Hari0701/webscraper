"use client";
import { useState, useRef, useEffect } from "react";

interface ElementData {
  cssSelector: string;
  xpathSelector: string;
  text: string;
  attributes: Record<string, string | null>;
}

export default function Home() {
  const [url, setUrl] = useState<string>("");
  const [data, setData] = useState<ElementData[]>([]);
  const [search, setSearch] = useState<string>("");
  const [selectedElement, setSelectedElement] = useState<ElementData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const scrapeWebsite = async () => {
    if (!url) return alert("Enter a valid URL");
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (iframeRef.current && selectedElement) {
      const iframeDoc = iframeRef.current.contentDocument;
      if (!iframeDoc) return;
      iframeDoc.querySelectorAll(".highlighted-selector").forEach((el) => el.classList.remove("highlighted-selector"));

      const targetElement = iframeDoc.querySelector(selectedElement.cssSelector);
      if (targetElement) {
        targetElement.classList.add("highlighted-selector");
        targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [selectedElement]);

  const filteredData = data.filter((el) => el.text.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-5 flex h-screen relative">
      {loading && (
        <div className="absolute inset-0 bg-gray-800 bg-opacity-30 flex justify-center items-center z-50">
          <div className="loader border-t-4 border-blue-500 rounded-full w-12 h-12 animate-spin"></div>
        </div>
      )}
      <div className="w-1/3 border-r p-4">
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
        <ul className="list-disc pl-5 max-h-[70vh] overflow-auto">
          {filteredData.map((el, index) => (
            <li key={index} onClick={() => setSelectedElement(el)} className="cursor-pointer hover:bg-gray-200 p-2">
              {el.cssSelector}
            </li>
          ))}
        </ul>
      </div>
      <div className="w-2/3 p-4 flex flex-col">
        {url && <iframe ref={iframeRef} src={url} className="w-full h-3/4 border"></iframe>}
        {selectedElement ? (
          <div className="border p-4 rounded-lg shadow-lg mt-4 max-h-60 overflow-auto">
            <h2 className="text-xl font-bold mb-2">Selected Element</h2>
            <p>
              <strong>CSS Selector:</strong> {selectedElement.cssSelector}
            </p>
            <p>
              <strong>XPath Selector:</strong> {selectedElement.xpathSelector}
            </p>
            <p>
              <strong>Text:</strong> {selectedElement.text}
            </p>
            <p>
              <strong>Attributes:</strong>
              <pre className="bg-gray-100 p-2 rounded mt-2 overflow-auto">{JSON.stringify(selectedElement.attributes, null, 2)}</pre>
            </p>
          </div>
        ) : (
          <p className="text-gray-500 mt-4">Select an element to view details</p>
        )}
      </div>
    </div>
  );
}
