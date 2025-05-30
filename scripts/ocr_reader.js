// scripts/ocr_reader.js
// This file provides OCR functionality for images and PDFs using Tesseract.js

console.log("ocr_reader.js loaded");

// Initialize Tesseract configuration
const initTesseract = () => {
  if (!window.Tesseract) {
    console.error('Tesseract.js not loaded');
    return false;
  }

  const workerPath = chrome.runtime.getURL('tesseract.js/dist/worker.min.js');
  const corePath = chrome.runtime.getURL('tesseract.js/dist/tesseract-core.wasm.js');
  
  console.log('Setting worker path:', workerPath);
  console.log('Setting core path:', corePath);

  window.Tesseract.workerPath = workerPath;
  window.Tesseract.corePath = corePath;
  return true;
};

// Create and configure Tesseract worker
async function createTesseractWorker() {
  if (!initTesseract()) throw new Error('Tesseract.js initialization failed');
  
  try {
    console.log('Creating worker...');
    const worker = await window.Tesseract.createWorker({
      workerPath: chrome.runtime.getURL('tesseract.js/dist/worker.min.js'),
      corePath: chrome.runtime.getURL('tesseract.js/dist/tesseract-core.wasm.js'),
      logger: m => console.log('Tesseract Worker:', m)
    });

    console.log('Loading worker...');
    await worker.load();
    console.log('Loading language...');
    await worker.loadLanguage('eng');
    console.log('Initializing worker...');
    await worker.initialize('eng');
    
    console.log('Worker ready!');
    return worker;
  } catch (error) {
    console.error('Worker creation failed:', error);
    throw error;
  }
}

// Screenshot capture functionality
async function captureVisibleTab() {
    return new Promise((resolve, reject) => {
        chrome.tabs.query({active: true, currentWindow: true}, tabs => {
            chrome.tabs.captureVisibleTab(null, {format: 'png'}, dataUrl => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                    return;
                }
                
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    resolve(canvas);
                };
                img.src = dataUrl;
            });
        });
    });
}

// Process selected area
async function processSelectedArea(canvas, selection) {
  const worker = await createTesseractWorker();
  
  try {
    // Create new canvas for selected area
    const areaCanvas = document.createElement('canvas');
    areaCanvas.width = selection.width;
    areaCanvas.height = selection.height;
    const ctx = areaCanvas.getContext('2d');
    
    // Draw only selected area
    ctx.drawImage(
      canvas, 
      selection.x, selection.y, 
      selection.width, selection.height,
      0, 0, 
      selection.width, selection.height
    );
    
    // Perform OCR on selected area
    const { data: { text } } = await worker.recognize(areaCanvas);
    await worker.terminate();
    return text;
  } catch (err) {
    if (worker) await worker.terminate();
    throw err;
  }
}

// Main screenshot OCR function
async function screenshotOCR() {
    try {
        const canvas = await captureVisibleTab();
        
        // Create selection overlay
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                z-index: 999999;
                cursor: crosshair;
            `;
            
            let isSelecting = false;
            let startX, startY;
            let selection = { x: 0, y: 0, width: 0, height: 0 };
            
            overlay.onmousedown = (e) => {
                isSelecting = true;
                startX = e.clientX;
                startY = e.clientY;
            };
            
            overlay.onmousemove = (e) => {
                if (!isSelecting) return;
                
                selection = {
                    x: Math.min(startX, e.clientX),
                    y: Math.min(startY, e.clientY),
                    width: Math.abs(e.clientX - startX),
                    height: Math.abs(e.clientY - startY)
                };
                
                // Update selection visual
                overlay.style.background = `
                    linear-gradient(rgba(0,0,0,0.5),rgba(0,0,0,0.5)) 0 0 / 100% 100%,
                    linear-gradient(transparent,transparent) ${selection.x}px ${selection.y}px / ${selection.width}px ${selection.height}px no-repeat
                `;
            };
            
            overlay.onmouseup = async () => {
                isSelecting = false;
                document.body.removeChild(overlay);
                const text = await processSelectedArea(canvas, selection);
                resolve(text);
            };
            
            document.body.appendChild(overlay);
        });
    } catch (err) {
        console.error('Screenshot OCR failed:', err);
        throw err;
    }
}

// Attach only screenshot OCR to window
if (typeof window !== "undefined") {
  window.screenshotOCR = screenshotOCR;
}