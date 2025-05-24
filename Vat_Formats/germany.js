// Germany VAT number extraction script
// This script is injected into the active tab to extract VAT numbers in various formats.
// It listens for messages from the background script and executes the extraction logic.    
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "extractVAT" && message.tabId) {
    chrome.scripting.executeScript(
      {
        target: { tabId: message.tabId },
        func: () => {
          // Extract VAT number in formats: DExxxxxxxxx, DE xxxxxxxxx, DE xxx xxx xxx, or xxxxxxxxx
          let bodyText = document.body.innerText;
          let result = null;
          let regexes = [
            /\bDE\s?\d{9}\b/,           // DExxxxxxxxx or DE xxxxxxxxx
            /\bDE\s?\d{3}\s?\d{3}\s?\d{3}\b/, // DE xxx xxx xxx (with spaces)
            /\b\d{9}\b/                 // xxxxxxxxx
          ];
          for (let regex of regexes) {
            const match = bodyText.match(regex);
            if (match) {
              // Remove all spaces for consistency (DE xxx xxx xxx -> DExxxxxxxxx)
              result = match[0].replace(/\s+/g, '');
              break;
            }
          }
          return result ? `${result}` : 'VAT number not found on this page.';
        }
      },
      (results) => {
        sendResponse({ result: results && results[0] ? results[0].result : null });
      }
    );
    // Required for async response
    return true;
  }
});