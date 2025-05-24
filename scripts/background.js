// Combined VAT extraction for Germany (DE) and Switzerland (CHE)
// Import extractors.js logic at the top (copy-paste or bundle during build)
function extractDEVAT(text) { /* ...as above... */ }
function extractCHEVAT(text) { /* ...as above... */ }
function extractVAT(text) { /* ...as above... */ }

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "extractVAT" && message.tabId) {
    chrome.scripting.executeScript(
      {
        target: { tabId: message.tabId },
        func: () => {
          let bodyText = document.body.innerText;
          // Use the centralized extractVAT function
          return extractVAT(bodyText) || 'VAT number not found on this page.';
        }
      },
      (results) => {
        sendResponse({ result: results && results[0] ? results[0].result : null });
      }
    );
    return true;
  }
});