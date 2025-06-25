export default defineContentScript({
  matches: ["<all_urls>"],
  runAt: "document_end",
  main() {
    console.log("Page-to-MDX content script loaded on:", window.location.href);

    // Ensure the script is ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initializeScript);
    } else {
      initializeScript();
    }

    function initializeScript() {
      // Listen for messages from the popup
      browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
        console.log("Content script received message:", message);

        if (message.action === "getPageHTML") {
          try {
            // Get the full HTML of the page
            const html = document.documentElement.outerHTML;

            // Also get some metadata
            const pageData = {
              html: html,
              title: document.title,
              url: window.location.href,
              timestamp: new Date().toISOString(),
            };

            console.log("Sending page data back to popup");
            sendResponse({ success: true, data: pageData });
          } catch (error) {
            console.error("Error getting page HTML:", error);
            sendResponse({
              success: false,
              error: error instanceof Error ? error.message : "Unknown error",
            });
          }

          // Return true to indicate we'll send a response asynchronously
          return true;
        }
      });

      // Send a message to confirm the content script is ready (optional)
      browser.runtime
        .sendMessage({ action: "contentScriptReady" })
        .catch(() => {
          // Ignore errors if popup is not open
        });
    }
  },
});
