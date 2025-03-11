"use client";
import { useState, useRef, useEffect } from "react";
import { FaGithub } from "react-icons/fa"; // Import GitHub icon

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
  const [iframeLoaded, setIframeLoaded] = useState<boolean>(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const formatUrl = (inputUrl: string) => {
    if (!inputUrl.startsWith("http://") && !inputUrl.startsWith("https://")) {
      return `https://${inputUrl}`;
    }
    return inputUrl;
  };

  const scrapeWebsite = async () => {
    if (!url) return alert("Enter a valid URL");
    const formattedUrl = formatUrl(url);
    setData([]);
    setLoading(true);
    try {
      const response = await fetch(`/api/scrape?url=${encodeURIComponent(formattedUrl)}`);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const result: ElementData[] = await response.json();
      setData(result);
    } catch (error) {
      console.error("Fetch error:", error);
      alert("Failed to fetch data. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  const injectHighlightStyles = () => {
    if (!iframeRef.current || !iframeRef.current.contentDocument) return;
    const iframeDoc = iframeRef.current.contentDocument;
    if (!iframeDoc.getElementById("highlight-style")) {
      const style = iframeDoc.createElement("style");
      style.id = "highlight-style";
      style.innerHTML = `
        .highlighted-selector {
          outline: 4px solid red !important;
          background-color: rgba(255, 0, 0, 0.2) !important;
        }
      `;
      iframeDoc.head.appendChild(style);
    }
  };

  const observeIframeMutations = () => {
    if (!iframeRef.current || !iframeRef.current.contentDocument) return;
    const iframeDoc = iframeRef.current.contentDocument;
    const observer = new MutationObserver(() => injectHighlightStyles());
    observer.observe(iframeDoc, { childList: true, subtree: true });
  };

  const handleIframeLoad = () => {
    setIframeLoaded(true);
    setTimeout(() => {
      injectHighlightStyles();
      observeIframeMutations();
    }, 1000);
  };

  const handleSelection = (element: ElementData) => {
    setSelectedElement(element);
    setTimeout(() => {
      if (!iframeRef.current || !iframeRef.current.contentDocument) return;
      const iframeDoc = iframeRef.current.contentDocument;
      iframeDoc.querySelectorAll(".highlighted-selector").forEach((el) => el.classList.remove("highlighted-selector"));
      const targetElement = iframeDoc.querySelector(element.cssSelector);
      if (targetElement) {
        targetElement.classList.add("highlighted-selector");
        targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 500);
  };

  useEffect(() => {
    if (iframeLoaded) injectHighlightStyles();
  }, [iframeLoaded]);

  const filteredData = data.filter((el) => el.text.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="h-screen flex flex-col">
      <nav className="bg-[#174e4f] text-[#f3efc3] p-4 flex justify-between items-center shadow-md">
        <span className="text-xl font-bold">WebScraper</span>
        <a href="https://github.com/Hari0701/webscraper" target="_blank" rel="noopener noreferrer">
          <FaGithub className="text-2xl hover:text-gray-300 transition" />
        </a>
      </nav>

      {/* Main Content */}
      <div className="flex flex-grow relative">
        <div className="w-1/3 border-r p-6 relative">
          {loading && (
            <div className="absolute inset-0 flex justify-center items-center z-10">
              <div className="spinner"></div>{" "}
            </div>
          )}
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Enter website URL" className="border p-2 mb-4 w-full" />
          <button onClick={scrapeWebsite} className="bg-[#174e4f] text-[#f3efc3] p-2 rounded mb-4 w-full cursor-pointer">
            Scrape
          </button>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search elements"
            className="border p-2 mb-4 w-full"
          />
          <div className="relative max-h-[70vh] overflow-auto">
            {loading && (
              <div className="absolute inset-0 flex justify-center items-center z-10">
                <div className="border-t-4 border-blue-500 rounded-full w-6 h-6 animate-spin"></div>
              </div>
            )}
            <ul className="list-disc pl-5">
              {filteredData.map((el, index) => (
                <li
                  key={index}
                  onClick={() => handleSelection(el)}
                  className={`cursor-pointer p-2 transition ${
                    selectedElement?.cssSelector === el.cssSelector ? "bg-[#f3efc3]" : "hover:bg-gray-200"
                  }`}
                >
                  {el.cssSelector}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="w-2/3 p-4 flex flex-col">
          {url && (
            <iframe ref={iframeRef} src={formatUrl(url)} className="w-full h-3/4 border rounded-sm" onLoad={handleIframeLoad}></iframe>
          )}
          {selectedElement ? (
            <div className="border p-4 rounded-sm shadow-lg mt-4 max-h-60 overflow-auto">
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
              <strong>Attributes:</strong>
              <pre className="bg-gray-100 p-2 rounded mt-2 overflow-auto">{JSON.stringify(selectedElement.attributes, null, 2)}</pre>
            </div>
          ) : (
            <p className="text-gray-500 mt-4">Select an element to view details</p>
          )}
        </div>
      </div>
    </div>
  );
}
