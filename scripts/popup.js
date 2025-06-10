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
      document.getElementById('section-extract').style.display = 'block';
      document.getElementById('section-pdf').style.display = 'none';
      document.getElementById('section-screenshot').style.display = 'none';
    };
  }

  // Extract Data button logic (from web page)
  const extractBtnOld = document.getElementById('extract-button');
  if (extractBtnOld) {
    extractBtnOld.onclick = function () {
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

  // Extract Data button logic (using message passing)
  document.getElementById('extract-button').addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const response = await chrome.tabs.sendMessage(tab.id, { action: "extractVatNumber" });
      
      if (response.vatNumbers.length > 0) {
        document.getElementById('output').value = response.vatNumbers.join('\n');
      } else {
        document.getElementById('output').value = 'No German VAT numbers found';
      }
    } catch (err) {
      console.error('VAT extraction failed:', err);
      document.getElementById('output').value = 'Error: ' + err.message;
    }
  });

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
            script.src = chrome.runtime.getURL('tesseract.js/dist/worker.min.js');
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

  // PDF text extraction button logic
  const pdfTextBtn = document.getElementById('pdf-text-btn');
  const pdfTextInput = document.getElementById('pdf-text-input');
  
  if (pdfTextBtn && pdfTextInput) {
      pdfTextBtn.onclick = function() {
          pdfTextInput.value = '';
          pdfTextInput.click();
      };
      
      pdfTextInput.onchange = async function(e) {
          const file = e.target.files[0];
          if (file) {
              const pdfTextOutput = document.getElementById('pdf-text-output');
              pdfTextOutput.textContent = 'Processing PDF...';
              try {
                  const text = await window.extractTextFromPdf(file);
                  pdfTextOutput.textContent = text || 'No text found in PDF.';
              } catch (err) {
                  console.error('PDF text extraction failed:', err);
                  pdfTextOutput.textContent = 'PDF text extraction failed: ' + err.message;
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
      const text = document.getElementById('text-output').textContent;
      navigator.clipboard.writeText(text).then(() => {
        const status = document.getElementById('copy-status');
        status.style.display = 'inline-block';
        setTimeout(() => { status.style.display = 'none'; }, 1200);
      });
    };
  }

  // Delete button logic
  const deleteBtn = document.getElementById('delete-btn');
  if (deleteBtn) {
      deleteBtn.onclick = function() {
          const textOutput = document.getElementById('text-output');
          const screenshotPreview = document.getElementById('screenshot-preview');
          
          textOutput.textContent = 'Extracted text...';
          textOutput.style.display = 'block';
          screenshotPreview.src = '';
          screenshotPreview.style.display = 'none';
      };
  }
  
  // Copy button for PDF text
  const copyBtnPdf = document.getElementById('copy-btn-pdf');
  if (copyBtnPdf) {
    copyBtnPdf.onclick = function () {
      const text = document.getElementById('pdf-text-output').textContent;
      navigator.clipboard.writeText(text).then(() => {
        const status = document.getElementById('copy-status-pdf');
        status.style.display = 'inline-block';
        setTimeout(() => { status.style.display = 'none'; }, 1200);
      });
    };
  }

  // Keep other event listeners...
  document.getElementById('pdf-text-btn').addEventListener('click', async () => {
    const input = document.getElementById('pdf-text-input');
    const file = input.files[0];
    if (file) {
      try {
        const text = await window.extractTextFromPdf(file);
        document.getElementById('output').value = text;
      } catch (err) {
        console.error('PDF extraction failed:', err);
        document.getElementById('output').value = 'Error: ' + err.message;
      }
    }
  });

  // Screenshot capture button logic
  const captureBtn = document.getElementById('capture-btn');
  if (captureBtn) {
      captureBtn.addEventListener('click', async () => {
          try {
              const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
              
              if (!tab.url.startsWith('chrome://')) {
                  // Take screenshot
                  const dataUrl = await chrome.tabs.captureVisibleTab(null, {
                      format: 'png'
                  });
                  
                  // Display screenshot
                  const textOutput = document.getElementById('text-output');
                  const screenshotPreview = document.getElementById('screenshot-preview');
                  const screenshotTextOutput = document.getElementById('screenshot-text-output');
                  if (textOutput) textOutput.style.display = 'none';
                  if (screenshotPreview) {
                    screenshotPreview.style.display = 'block';
                    screenshotPreview.src = dataUrl;
                  }
                  if (screenshotTextOutput) screenshotTextOutput.style.display = 'none';
              } else {
                  throw new Error('Cannot capture screenshot of this page');
              }
          } catch (err) {
              console.error('Screenshot failed:', err);
              document.getElementById('text-output').textContent = 'Screenshot failed: ' + err.message;
          }
      });
  }

  // Extract Data button logic (consolidated)
  const extractBtn = document.getElementById('extract-button');
  if (extractBtn) {
      extractBtn.addEventListener('click', async () => {
          try {
              const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
              
              // First inject the extractors.js file
              await chrome.scripting.executeScript({
                  target: { tabId: tab.id },
                  files: ['Vat_Formats/extractors.js']
              });

              // Then execute the extraction
              const results = await chrome.scripting.executeScript({
                  target: { tabId: tab.id },
                  func: () => {
                      const bodyText = document.body.innerText;
                      return window.extractVAT 
                          ? window.extractVAT(bodyText)
                          : 'VAT extractor not loaded.';
                  }
              });

              // Display results
              const textOutput = document.getElementById('text-output');
              const screenshotPreview = document.getElementById('screenshot-preview');
              
              textOutput.style.display = 'block';
              screenshotPreview.style.display = 'none';
              
              textOutput.textContent = results && results[0]?.result 
                  ? results[0].result 
                  : 'No VAT numbers found';

          } catch (err) {
              console.error('VAT extraction failed:', err);
              document.getElementById('text-output').textContent = 'VAT extraction failed: ' + err.message;
          }
      });
  } else {
      console.error('Extract button not found in the DOM');
  }

  // Tab switching logic
  document.querySelectorAll('.vat-tab').forEach(tab => {
    tab.addEventListener('click', function() {
      document.querySelectorAll('.vat-tab').forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      document.getElementById('section-extract').style.display = 'none';
      document.getElementById('section-pdf').style.display = 'none';
      document.getElementById('section-screenshot').style.display = 'none';
      if (this.id === 'tab-extract') document.getElementById('section-extract').style.display = 'block';
      if (this.id === 'tab-pdf') document.getElementById('section-pdf').style.display = 'block';
      if (this.id === 'tab-screenshot') document.getElementById('section-screenshot').style.display = 'block';
    });
  });

  // Activate delete buttons for all sections
  const deleteExtractBtn = document.getElementById('delete-btn-extract');
  const deletePdfBtn = document.getElementById('delete-btn-pdf');
  const deleteScreenshotBtn = document.getElementById('delete-btn-screenshot');

  if (deleteExtractBtn) {
    deleteExtractBtn.addEventListener('click', () => {
      document.getElementById('output').textContent = ''; // Clear Extract section output
    });
  }

  if (deletePdfBtn) {
    deletePdfBtn.addEventListener('click', () => {
      document.getElementById('pdf-text-output').textContent = ''; // Clear PDF section output
    });
  }

  if (deleteScreenshotBtn) {
    deleteScreenshotBtn.addEventListener('click', () => {
      const screenshotPreview = document.getElementById('screenshot-preview');
      const screenshotTextOutput = document.getElementById('screenshot-text-output');
      if (screenshotPreview) screenshotPreview.src = ''; // Clear screenshot image
      if (screenshotPreview) screenshotPreview.style.display = 'none'; // Hide screenshot preview
      if (screenshotTextOutput) screenshotTextOutput.textContent = ''; // Clear screenshot text
    });
  }
});

// Set PDF.js worker source (UMD build, not .mjs)
if (window.pdfjsLib) {
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('scripts/pdfjs-5.2.133-dist/build/pdf.worker.js');
}

// PDF text extraction function (for button click)
async function extractTextFromPdf(file) {
  if (!file) throw new Error('No file selected');
  if (!window.pdfjsLib) throw new Error('PDF.js not loaded');

  const fileReader = new FileReader();
  fileReader.readAsArrayBuffer(file);

  return new Promise((resolve, reject) => {
    fileReader.onload = async function () {
      const typedArray = new Uint8Array(this.result);
      try {
        // Using PDF.js to extract text
        const pdf = await window.pdfjsLib.getDocument(typedArray).promise;
        let text = '';

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const pageText = content.items.map(item => item.str).join(' ');
          text += pageText + '\n';
        }

        // Normalize whitespace
        const normalizedText = text.replace(/\s+/g, ' ').trim();

        // Use centralized extractor if available
        let vatNumbers = [];
        if (typeof window.extractVatNumbers === "function") {
          vatNumbers = window.extractVatNumbers(normalizedText);
        } else {
          // Fallback to local extraction
          vatNumbers = extractVatNumbers(normalizedText);
        }

        resolve(
          vatNumbers.length > 0
            ? vatNumbers.join('\n')
            : 'No German or Swiss VAT numbers found.'
        );
      } catch (err) {
        reject(new Error('Error extracting text from PDF: ' + err.message));
      }
    };

    fileReader.onerror = function () {
      reject(new Error('File reading has failed'));
    };
  });
}

// Local fallback VAT extraction helper (only used if extractor is missing)
function extractVatNumbers(text) {
  if (!text) return [];
  // Germany VAT: DE followed by exactly 9 digits
  const vatRegexDE = /\bDE\s*(\d{9})\b/g;
  // Switzerland VAT: CHE-123.456.789, CHE123456789, CHE-123456789, CHE123.456.789
  const vatRegexCHE = /\bCHE[-\s]?(\d{3})[.\s]?(\d{3})[.\s]?(\d{3})\b/g;

  const matchesDE = [];
  let match;
  while ((match = vatRegexDE.exec(text)) !== null) {
    if (match[1].length === 9) {
      matchesDE.push(`DE${match[1]}`);
    }
  }

  const matchesCHE = [];
  while ((match = vatRegexCHE.exec(text)) !== null) {
    const digits = match.slice(1).join('');
    if (digits.length === 9) {
      matchesCHE.push(`CHE-${digits.slice(0,3)}.${digits.slice(3,6)}.${digits.slice(6,9)}`);
    }
  }

  return [...matchesDE, ...matchesCHE];
}