// content.js for Vat Reader Chrome Extension
// This script listens for messages to perform OCR or VAT extraction on the current page

console.log("Content script loaded");

// Listen for messages from the extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getScrollDimensions") {
        sendResponse({
            width: Math.max(
                document.documentElement.scrollWidth,
                document.body.scrollWidth,
                document.documentElement.clientWidth
            ),
            height: Math.max(
                document.documentElement.scrollHeight,
                document.body.scrollHeight,
                document.documentElement.clientHeight
            ),
            scrollX: window.scrollX,
            scrollY: window.scrollY
        });
    }

    if (request.action === "extractVAT") {
        chrome.tabs.query({ active: true, currentWindow: true }, async ([tab]) => {
            if (!tab.url.startsWith('http')) {
                // Show error to user
                document.getElementById('text-output').textContent = 'VAT extraction not supported on this page.';
                return;
            }

            const response = await chrome.tabs.sendMessage(tab.id, { action: "extractVatNumber" });
            sendResponse({ vatNumbers: response.vatNumbers });
        });
    }

    // Return true to indicate we will send a response asynchronously
    return true;
});