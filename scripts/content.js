// content.js for Vat Reader Chrome Extension
// This script listens for messages to perform OCR or VAT extraction on the current page

// Listen for messages from popup.js or background.js
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.action === "extractVAT") {
    // Inject extractors.js if not already present
    if (!window.extractVAT) {
      const script = document.createElement('script');
      script.src = chrome.runtime.getURL('Vat_Formats/extractors.js');
      document.documentElement.appendChild(script);
      await new Promise(resolve => {
        script.onload = resolve;
      });
    }
    // Extract VAT from page text
    const bodyText = document.body.innerText;
    const result = window.extractVAT
      ? window.extractVAT(bodyText) || 'VAT number not found on this page.'
      : 'VAT extractor not loaded.';
    sendResponse({ result });
    return true;
  }

  if (message.action === "ocrImage" && message.imageDataUrl) {
    // Inject Tesseract.js if not already present
    if (!window.Tesseract) {
      const script = document.createElement('script');
      script.src = chrome.runtime.getURL('scripts/tesseract.min.js');
      document.documentElement.appendChild(script);
      await new Promise(resolve => {
        script.onload = resolve;
      });
    }
    // Run OCR on the provided image data URL
    if (window.Tesseract) {
      window.Tesseract.recognize(
        message.imageDataUrl,
        'eng'
      ).then(({ data: { text } }) => {
        sendResponse({ text });
      }).catch(() => {
        sendResponse({ text: 'OCR failed.' });
      });
      return true; // Keep the message channel open for async response
    } else {
      sendResponse({ text: 'Tesseract.js not loaded.' });
      return true;
    }
  }
});