# VAT Reader Chrome Extension

This Chrome extension allows users to extract VAT numbers from web pages in various formats (e.g., `DExxxxxxxxx`, `DE xxxxxxxxx`, `DE xxx xxx xxx`, or `xxxxxxxxx`). The extension features a simple popup UI and supports copying or clearing the extracted VAT number.

## Features

- Extract VAT numbers from the current web page in multiple formats.
- Clean and modern popup interface.
- Copy extracted VAT number to clipboard.
- Clear/Delete extracted result.
- Powered by P2P SPACE.

## How to Use

1. **Load the extension in Chrome:**
   - Open Chrome and navigate to `chrome://extensions/`.
   - Enable "Developer mode".
   - Click "Load unpacked" and select the project folder.

2. **Extract VAT Number:**
   - Click the extension icon in the Chrome toolbar.
   - Click the "Extract Data" button to extract the VAT number from the current page.
   - Use the "Copy" button to copy the result, or "Delete" to clear the output.

## Project Structure

/Code │ ├── manifest.json ├── popup.html ├── popup.js ├── background.js ├── styles.css ├── assets/ │ ├── icon.png │ ├── logo.png │ └── earth.jpg └── README.md

## File Descriptions

- **manifest.json**: Chrome extension manifest (MV3).
- **popup.html**: Popup UI for the extension.
- **popup.js**: Handles popup UI logic and messaging.
- **background.js**: Handles extraction logic and communication with content scripts.
- **styles.css**: Styles for the popup UI.
- **assets/**: Contains images and icons used in the extension.

## VAT Extraction Logic

The extension extracts VAT numbers in the following formats:
- `DExxxxxxxxx`
- `DE xxxxxxxxx`
- `DE xxx xxx xxx`
- `xxxxxxxxx`

All spaces are removed in the result for consistency.

## Libraries Used

- [Tesseract.js](https://github.com/naptha/tesseract.js) (planned/optional for OCR functionality).

---

**Powered by P2P SPACE**