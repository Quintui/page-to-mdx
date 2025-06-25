import { useState } from "react";
import { htmlToMdx, ConversionOptions } from "../../utils/htmlToMdx";
import {
  Code2,
  Copy,
  Check,
  Expand,
  Minimize,
  RotateCcw,
  FileType2,
} from "lucide-react";

interface PageData {
  html: string;
  title: string;
  url: string;
  timestamp: string;
}

function App() {
  const [mdxContent, setMdxContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [conversionOptions, setConversionOptions] = useState<ConversionOptions>(
    {
      preserveImages: true,
      preserveLinks: true,
      includeMetadata: true,
    }
  );

  const transformToMdx = async () => {
    setIsLoading(true);
    setError("");
    setMdxContent("");

    try {
      // Get the current tab
      const [tab] = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab.id) {
        throw new Error("No active tab found");
      }

      // Send message to content script to get page HTML
      const response = await browser.tabs.sendMessage(tab.id, {
        action: "getPageHTML",
      });

      if (!response.success) {
        throw new Error(response.error || "Failed to get page HTML");
      }

      setPageData(response.data);

      // Convert HTML to MDX
      const mdx = htmlToMdx(response.data.html, conversionOptions);
      setMdxContent(mdx);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(mdxContent);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  };

  const resetApp = () => {
    setMdxContent("");
    setError("");
    setPageData(null);
    setIsExpanded(false);
  };

  return (
    <div className="w-[400px] p-5 font-sans bg-white">
      {/* Main Content - Initial State */}
      {!mdxContent && !isLoading && (
        <div className="space-y-6">
          {/* Description Card */}
          <div className="relative border border-slate-200 rounded-lg bg-slate-50 p-6 shadow-2xs">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br bg-slate-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                <FileType2 className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-slate-800 mb-2">
                Transform Pages to MDX
              </h2>
              <p className="text-sm text-slate-600  leading-relaxed">
                Convert pages to markdown for LLMs: better understanding, fewer
                tokens than HTML, cleaner structure than manual copying.
              </p>
            </div>
          </div>

          {/* Action Button */}
          <button
            className="w-full inline-flex cursor-pointer items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-slate-900 text-slate-50 hover:bg-slate-900/90 h-11 px-8"
            onClick={transformToMdx}
            disabled={isLoading}
          >
            <Code2 className="w-5 h-5 mr-2" />
            Transform to MDX
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-10 px-5">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Converting page to MDX...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center mt-4">
          <p className="text-red-700 mb-3">{error}</p>
          <button
            onClick={resetApp}
            className="inline-flex cursor-pointer items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-red-500 text-slate-50 hover:bg-red-500/90 h-9 px-3"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Try Again
          </button>
        </div>
      )}

      {/* Results */}
      {mdxContent && (
        <div className="text-left">
          {/* Page Info */}
          {pageData && (
            <div className="mb-4 p-3 bg-slate-50 rounded-md border-l-4 border-slate-700">
              <h3 className="text-sm font-medium text-slate-800 mb-2 m-0 leading-tight">
                {pageData.title}
              </h3>
              <p className="text-xs text-slate-500 m-0 break-all leading-relaxed">
                {pageData.url}
              </p>
            </div>
          )}

          <div className="my-4 border-t border-slate-200"></div>

          {/* Preview Section */}
          <div className="space-y-4">
            {/* Preview Header */}
            <div className="flex items-center justify-between">
              <h4 className="text-base font-medium text-slate-800 m-0">
                Preview
              </h4>
              <div className="flex gap-2">
                <button
                  onClick={copyToClipboard}
                  className="inline-flex cursor-pointer items-center justify-center rounded-md text-xs font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-900 h-9 px-3"
                >
                  {copySuccess ? (
                    <>
                      <Check className="w-3 h-3 mr-1" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Preview Container */}
            <div className="relative">
              <div
                className={`
                relative border border-slate-200 rounded-lg bg-slate-50 overflow-hidden
                ${isExpanded ? "h-80" : "h-48"}
                transition-all duration-300 ease-in-out
              `}
              >
                {isExpanded ? (
                  <div className="h-full overflow-auto">
                    <pre className="p-4 text-xs leading-relaxed font-mono text-slate-700 whitespace-pre-wrap">
                      {mdxContent}
                    </pre>
                  </div>
                ) : (
                  <div className="h-full overflow-hidden">
                    <pre className="p-4 text-xs leading-relaxed font-mono text-slate-700 whitespace-pre-wrap">
                      {mdxContent}
                    </pre>
                  </div>
                )}

                {/* Fade Overlay with Expand Button - only show when collapsed */}
                {!isExpanded && (
                  <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-50 via-slate-50/80 to-transparent pointer-events-none">
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 pointer-events-auto">
                      <button
                        onClick={() => setIsExpanded(true)}
                        className="inline-flex cursor-pointer items-center justify-center rounded-md text-xs font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-slate-200 bg-white/90 backdrop-blur-sm hover:bg-white shadow-sm h-9 px-3"
                      >
                        <Expand className="w-3 h-3 mr-1" />
                        Expand
                      </button>
                    </div>
                  </div>
                )}

                {/* Collapse Button - only show when expanded */}
                {isExpanded && (
                  <div className="absolute top-4 right-4">
                    <button
                      onClick={() => setIsExpanded(false)}
                      className="inline-flex items-center cursor-pointer justify-center rounded-md text-xs font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-slate-200 bg-white/90 backdrop-blur-sm hover:bg-white shadow-sm h-9 px-3"
                    >
                      <Minimize className="w-3 h-3 mr-1" />
                      Collapse
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
