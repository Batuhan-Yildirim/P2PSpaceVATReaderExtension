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
        chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
            if (!tab.url.startsWith('http')) {
                // Show error to user
                document.getElementById('text-output').textContent = 'VAT extraction not supported on this page.';
                return;
            }

            const text = document.body.innerText;
            // German VAT number pattern
            const vatPatternDE = /\bDE\s?\d{9}\b/g;
            // Swiss VAT number pattern
            const vatPatternCHE = /\bCHE-?\d{3}\.?\d{3}\.?\d{3}\b/g;
            
            const matches = [];
            let match;

            while ((match = vatPatternDE.exec(text)) !== null) {
                matches.push(match[0].replace(/\s/g, ''));
            }

            while ((match = vatPatternCHE.exec(text)) !== null) {
                matches.push(match[0].replace(/[.\-\s]/g, ''));
            }

            sendResponse({ vatNumbers: matches });
        });
    }

    // Return true to indicate we will send a response asynchronously
    return true;
});