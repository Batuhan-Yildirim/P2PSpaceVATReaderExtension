console.log("pdf_reader.js loaded");

// Extract selectable text from PDF (PDF.js only, not OCR)
async function extractTextFromPdf(file) {
    if (!window['pdfjsLib']) {
        throw new Error('PDF.js not loaded');
    }

    // Set worker source path
    const workerSrc = chrome.runtime.getURL('scripts/pdfjs-5.2.133-dist/build/pdf.worker.mjs');
    window['pdfjsLib'].GlobalWorkerOptions.workerSrc = workerSrc;

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = async function(e) {
            try {
                const typedArray = new Uint8Array(e.target.result);
                const loadingTask = window['pdfjsLib'].getDocument({data: typedArray});
                const pdf = await loadingTask.promise;
                
                let fullText = '';
                
                // Extract text from each page
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const content = await page.getTextContent();
                    const pageText = content.items.map(item => item.str).join(' ');
                    fullText += pageText + '\n';
                }
                
                resolve(fullText.trim());
            } catch (err) {
                console.error('PDF processing failed:', err);
                reject(err);
            }
        };
        
        reader.onerror = (err) => {
            console.error('FileReader failed:', err);
            reject(err);
        };
        
        reader.readAsArrayBuffer(file);
    });
}

// Attach to window for popup.js usage
if (typeof window !== "undefined") {
    window.extractTextFromPdf = extractTextFromPdf;
}