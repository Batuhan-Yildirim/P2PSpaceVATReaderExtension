// scripts/ocr_reader.js
// This file provides OCR functionality for images and PDFs using Tesseract.js

console.log("ocr_reader.js loaded");

// Set Tesseract.js worker path for Chrome extension CSP
if (window.Tesseract) {
  window.Tesseract.workerPath = chrome.runtime.getURL('scripts/tesseract.js-6.0.1/dist/worker.min.js');
}

// OCR on image file (Tesseract.js)
async function ocrImageFromFile(file) {
  if (!window.Tesseract) throw new Error('Tesseract.js not loaded');
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async function (e) {
      try {
        const { data: { text } } = await window.Tesseract.recognize(e.target.result, 'eng');
        resolve(text);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Extract selectable text from PDF (PDF.js only, not OCR)
async function extractTextFromPdf(file) {
  if (!window['pdfjsLib']) throw new Error('PDF.js not loaded');
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
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

// Attach to window for popup.js usage
if (typeof window !== "undefined") {
  window.ocrImageFromFile = ocrImageFromFile;
  window.extractTextFromPdf = extractTextFromPdf;
}