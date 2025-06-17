// Combined VAT extraction for Germany (DE) and Switzerland (CHE)
// Import extractors.js logic at the top (copy-paste or bundle during build)
function extractDEVAT(text) { /* ...as above... */ }
function extractCHEVAT(text) { /* ...as above... */ }
function extractVAT(text) { /* ...as above... */ }

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "extractVatNumber") {
    // Do something async
    someAsyncFunction().then(result => {
      sendResponse({ vat: result });
    }).catch(err => {
      sendResponse({ error: err.message });
    });
    return true; // <--- Only if you will call sendResponse later
  }
});