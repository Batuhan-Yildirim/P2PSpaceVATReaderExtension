console.log("pdf_reader.js loaded");

// Extract selectable text from PDF (PDF.js only, not OCR)
async function extractTextFromPdf(file) {
  if (!window['pdfjsLib']) throw new Error('PDF.js not loaded');
  // Set the workerSrc before using PDF.js
  window['pdfjsLib'].GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('scripts/pdfjs-5.2.133-dist/build/pdf.worker.mjs');

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async function (e) {
      try {
        const typedArray = new Uint8Array(e.target.result);
        const pdf = await window['pdfjsLib'].getDocument({ data: typedArray }).promise;
        let extractedText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const pageText = content.items.map(item => item.str).join(' ');
          extractedText += pageText + '\n';
        }

        resolve(extractedText);
      } catch (err) {
        console.error("PDF extraction failed:", err);
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

// Attach to window for popup.js usage
if (typeof window !== "undefined") {
  window.extractTextFromPdf = extractTextFromPdf;
}