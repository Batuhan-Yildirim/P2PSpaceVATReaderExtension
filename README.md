# VAT Reader Chrome Extension

This Chrome extension allows users to extract VAT numbers from web pages in various formats (e.g., `DExxxxxxxxx`, `DE xxxxxxxxx`, `DE xxx xxx xxx`, `xxxxxxxxx`, `CHE-123.456.789`, `CHE123456789`, etc.). The extension features a modern popup UI, supports OCR extraction from images using Tesseract.js, and enables copying or clearing the extracted VAT number.

## Features

- Extract VAT numbers from the current web page in multiple formats (supports Germany, Switzerland, and more).
- OCR: Extract VAT numbers from images using Tesseract.js.
- Clean and modern popup interface with a welcome page.
- Copy extracted VAT number to clipboard.
- Clear/Delete extracted result.
- Editable extract area.
- Powered by P2P SPACE.

## How to Use

1. **Load the extension in Chrome:**
   - Open Chrome and navigate to `chrome://extensions/`.
   - Enable "Developer mode".
   - Click "Load unpacked" and select the `P2PSpace` project folder.

2. **Extract VAT Number from a Web Page:**
   - Click the extension icon in the Chrome toolbar.
   - On the welcome page, click "Start VAT Reader".
   - Click the "Extract Data" button to extract the VAT number from the current page.
   - Use the "Copy" button to copy the result, or "Delete" to clear the output.

3. **!Coming Soon! - Extract VAT Number from an Image (OCR):**
   - Click the "OCR from Image" button.
   - Select an image file containing a VAT number.
   - The extracted text will appear in the extract area.

## Project Structure


/P2PSpace │ ├── manifest.json ├── popup.html ├── scripts/ │ ├── popup.js │ ├── content.js │ ├── background.js │ └── tesseract.min.js ├── styles/ │ └── styles.css ├── Vat_Formats/ │ └── extractors.js ├── assets/ │ ├── icon.png │ ├── logo.png │ └── earth.jpg └── README.md

#
## File Descriptions

- **manifest.json**: Chrome extension manifest (MV3).
- **popup.html**: Popup UI for the extension (welcome and extract pages).
- **scripts/popup.js**: Handles popup UI logic and messaging.
- **scripts/content.js**: Handles extraction and OCR logic in the context of the web page.
- **scripts/background.js**: Handles communication and script injection.
- **scripts/tesseract.min.js**: Tesseract.js library for OCR.
- **styles/styles.css**: Styles for the popup UI.
- **Vat_Formats/extractors.js**: Centralized VAT extraction logic for multiple countries.
- **assets/**: Contains images and icons used in the extension.

## VAT Extraction Logic

The extension extracts VAT numbers in the following formats:
- Germany: `DExxxxxxxxx`, `DE xxxxxxxxx`, `DE xxx xxx xxx`, `xxxxxxxxx`
- Switzerland: `CHE-123.456.789`, `CHE123456789`, `CHE-123456789`, `CHE123.456.789` (always outputs as `CHE-123.456.789`)
- More countries can be added in `Vat_Formats/extractors.js`.

All spaces, hyphens, and periods are normalized in the result for consistency.

## OCR Functionality

- Uses [Tesseract.js](https://github.com/naptha/tesseract.js) to extract text (including VAT numbers) from images.
- Accessible via the "OCR from Image" button in the popup.

## Libraries Used

- [Tesseract.js](https://github.com/naptha/tesseract.js) for OCR functionality.

---

**Powered by P2P SPACE**