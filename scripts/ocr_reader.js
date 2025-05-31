// scripts/screen_capture.js
// This file provides screenshot capture functionality

console.log("screen_capture.js loaded");

// Capture the visible tab and return a canvas of the full page
async function captureVisibleTab() {
    return new Promise((resolve, reject) => {
        chrome.tabs.query({active: true, currentWindow: true}, async (tabs) => {
            const activeTab = tabs[0];
            try {
                const dimensions = await chrome.tabs.sendMessage(activeTab.id, {
                    action: "getScrollDimensions"
                });
                chrome.tabs.captureVisibleTab(null, {format: 'png'}, (dataUrl) => {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError);
                        return;
                    }
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        canvas.width = dimensions.width;
                        canvas.height = dimensions.height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, -dimensions.scrollX, -dimensions.scrollY);
                        resolve(canvas);
                    };
                    img.src = dataUrl;
                });
            } catch (err) {
                reject(err);
            }
        });
    });
}

// Main screenshot function with area selection
async function captureScreenshot() {
    try {
        const popup = chrome.extension.getViews({type: 'popup'})[0];
        if (popup) popup.close();

        const canvas = await captureVisibleTab();
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(0,0,0,0.5);
                z-index: 2147483647;
                cursor: crosshair;
            `;
            const selectionBox = document.createElement('div');
            selectionBox.style.cssText = `
                position: fixed;
                border: 2px solid #4285f4;
                background: rgba(66, 133, 244, 0.2);
                display: none;
                pointer-events: none;
            `;
            overlay.appendChild(selectionBox);

            let isSelecting = false;
            let startX, startY;

            overlay.onmousedown = (e) => {
                isSelecting = true;
                startX = e.clientX;
                startY = e.clientY;
                selectionBox.style.display = 'block';
            };

            overlay.onmousemove = (e) => {
                if (!isSelecting) return;
                const currentX = e.clientX;
                const currentY = e.clientY;
                const left = Math.min(startX, currentX);
                const top = Math.min(startY, currentY);
                const width = Math.abs(currentX - startX);
                const height = Math.abs(currentY - startY);
                selectionBox.style.left = `${left}px`;
                selectionBox.style.top = `${top}px`;
                selectionBox.style.width = `${width}px`;
                selectionBox.style.height = `${height}px`;
            };

            overlay.onmouseup = () => {
                isSelecting = false;
                const rect = selectionBox.getBoundingClientRect();
                document.body.removeChild(overlay);
                const captureCanvas = document.createElement('canvas');
                captureCanvas.width = rect.width;
                captureCanvas.height = rect.height;
                const ctx = captureCanvas.getContext('2d');
                ctx.drawImage(
                    canvas,
                    rect.left + window.scrollX, rect.top + window.scrollY,
                    rect.width, rect.height,
                    0, 0,
                    rect.width, rect.height
                );
                resolve(captureCanvas.toDataURL('image/png'));
            };

            document.body.appendChild(overlay);
        });
    } catch (err) {
        console.error('Screenshot capture failed:', err);
        throw err;
    }
}

if (typeof window !== "undefined") {
    window.captureScreenshot = captureScreenshot;
}