// Switzerland VAT number extraction script
// Extracts Swiss VAT numbers in any common format and outputs as CHE-123.456.789

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "extractVAT" && message.tabId) {
    chrome.scripting.executeScript(
      {
        target: { tabId: message.tabId },
        func: () => {
          // Match: CHE123456789, CHE-123.456.789, CHE-123456789, CHE123.456.789
          let bodyText = document.body.innerText;
          let result = null;
          // Find any CHE followed by 9 digits, with optional hyphens or dots
          const regex = /\bCHE[-.\s]?\d{3}[-.\s]?\d{3}[-.\s]?\d{3}\b/g;
          const match = bodyText.match(regex);
          if (match && match[0]) {
            // Remove all non-digit characters except CHE
            const digits = match[0].replace(/[^0-9]/g, '');
            if (digits.length === 9) {
              // Format as CHE-123.456.789
              result = `CHE-${digits.slice(0,3)}.${digits.slice(3,6)}.${digits.slice(6,9)}`;
            }
          }
          return result ? result : 'Swiss VAT number not found on this page.';
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