// Ensure ocr_reader.js is loaded before this script in popup.html:
// <script src="scripts/tesseract.js-6.0.1/dist/browser/tesseract.min.js"></script>
// <script src="scripts/ocr_reader.js"></script>
// <script src="scripts/popup.js"></script>

document.addEventListener('DOMContentLoaded', function () {
  // Welcome page logic
  const startBtn = document.getElementById('start-btn');
  if (startBtn) {
    startBtn.onclick = function () {
      document.getElementById('welcome-page').style.display = 'none';
      document.getElementById('extract-page').style.display = 'flex';
    };
  }

  // Extract Data button logic (from web page)
  const extractBtn = document.getElementById('extract-button');
  if (extractBtn) {
    extractBtn.onclick = function () {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript(
          {
            target: { tabId: tabs[0].id },
            files: ['Vat_Formats/extractors.js']
          },
          (injectResults) => {
            if (chrome.runtime.lastError) {
              document.getElementById('output').value = 'Failed to load VAT extractor.';
              return;
            }
            chrome.scripting.executeScript(
              {
                target: { tabId: tabs[0].id },
                func: () => {
                  const bodyText = document.body.innerText;
                  return window.extractVAT
                    ? window.extractVAT(bodyText) || 'VAT number not found on this page.'
                    : 'VAT extractor not loaded.';
                }
              },
              function (results) {
                document.getElementById('output').value =
                  results && results[0] && results[0].result
                    ? results[0].result
                    : 'VAT number not found on this page.';
              }
            );
          }
        );
      });
    };
  }

  // OCR button logic for images
  const ocrBtn = document.getElementById('ocr-btn');
  const ocrInput = document.getElementById('ocr-image-input');
  if (ocrBtn && ocrInput) {
    ocrBtn.onclick = function () {
      ocrInput.value = '';
      ocrInput.click();
    };
    ocrInput.onchange = async function (e) {
      const file = e.target.files[0];
      if (file) {
        const output = document.getElementById('output');
        output.value = 'Processing OCR for image...';
        try {
          if (!window.Tesseract) {
            const script = document.createElement('script');
            script.src = chrome.runtime.getURL('https://cdn.jsdelivr.net/npm/tesseract.js@v5.0.0/dist/worker.min.js');
            document.head.appendChild(script);
            await new Promise(resolve => { script.onload = resolve; });
          }
          // Resize image before OCR
          const resizedImageFile = await resizeImage(file, 800);
          const text = await window.ocrImageFromFile(resizedImageFile);
          output.value = text || 'No text found in image.';
          // Extract VAT numbers from OCR result
          const vatNumbers = extractVatNumbers(text);
          output.value = vatNumbers.length > 0 ? vatNumbers.join('\n') : 'No VAT numbers found in image.';
        } catch (err) {
          output.value = 'OCR failed: ' + err.message;
        }
      }
    };
  }

  // Extract selectable text from PDF
  const pdfTextBtn = document.getElementById('pdf-text-btn');
  const pdfTextInput = document.getElementById('pdf-text-input');
  if (pdfTextBtn && pdfTextInput) {
    pdfTextBtn.onclick = function () {
      pdfTextInput.value = '';
      pdfTextInput.click();
    };
    pdfTextInput.onchange = async function (e) {
      const file = e.target.files[0];
      if (file) {
        const output = document.getElementById('output');
        output.value = 'Extracting selectable text from PDF...';
        try {
          const text = await window.extractTextFromPdf(file);
          output.value = text || 'No selectable text found in PDF.';
        } catch (err) {
          output.value = 'PDF text extraction failed: ' + err.message;
        }
      }
    };
  }

  // OCR PDF logic (for scanned/image PDFs)
  const pdfOcrBtn = document.getElementById('ocr-pdf-btn');
  const pdfInput = document.getElementById('ocr-pdf-input');
  if (pdfOcrBtn && pdfInput) {
    pdfOcrBtn.onclick = function () {
      pdfInput.value = '';
      pdfInput.click();
    };
    pdfInput.onchange = async function (e) {
      const file = e.target.files[0];
      if (file) {
        const output = document.getElementById('output');
        output.value = 'Processing OCR for PDF...';
        try {
          const text = await window.ocrPdfFromFile(file);
          output.value = text || 'No text found in PDF.';
        } catch (err) {
          output.value = 'PDF OCR failed: ' + err.message;
        }
      }
    };
  }

  // Extract DE and CHE VAT numbers from text (as in background.js)
  function extractVatNumbers(text) {
    if (!text) return [];
    // Germany VAT: DE123456789, DE 123456789, DE 123 456 789, 123456789
    const vatRegexDE = /\bDE\s?\d{9}\b|\bDE\s?\d{3}\s?\d{3}\s?\d{3}\b|\b\d{9}\b/gi;
    // Switzerland VAT: CHE-123.456.789, CHE123456789, CHE-123456789, CHE123.456.789
    const vatRegexCHE = /\bCHE[-\s]?\d{3}[.\s]?\d{3}[.\s]?\d{3}\b/gi;

    const matchesDE = text.match(vatRegexDE) || [];
    const matchesCHE = text.match(vatRegexCHE) || [];

    // Normalize CHE format to CHE-123.456.789
    const normalizedCHE = matchesCHE.map(vat => {
      const digits = vat.replace(/[^\d]/g, '');
      return digits.length === 9 ? `CHE-${digits.slice(0,3)}.${digits.slice(3,6)}.${digits.slice(6,9)}` : vat;
    });

    return [...matchesDE, ...normalizedCHE];
  }

  // Copy button logic
  const copyBtn = document.getElementById('copy-btn-main');
  if (copyBtn) {
    copyBtn.onclick = function () {
      const output = document.getElementById('output');
      output.select();
      document.execCommand('copy');
      output.blur();
      const status = document.getElementById('copy-status');
      status.style.display = 'inline-block';
      setTimeout(() => { status.style.display = 'none'; }, 1200);
    };
  }

  // Delete button logic
  const restartBtn = document.getElementById('restart-btn');
  if (restartBtn) {
    restartBtn.onclick = function () {
      document.getElementById('output').value = '';
    };
  }
});

function resizeImage(file, maxWidth = 800) {
  return new Promise((resolve) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = (e) => {
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(resolve, 'image/png');
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}