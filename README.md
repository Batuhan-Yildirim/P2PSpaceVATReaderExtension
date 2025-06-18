# VAT Reader Chrome Extension developed by P2P Space

**VAT Reader** is a Chrome extension that allows you to instantly extract and verify EU VAT numbers (with a focus on German and Swiss VAT formats) from any web page, PDF, or image using OCR.

---

## Features

- **Extract VAT numbers** from web pages, PDFs, and screenshots.
- **Supports German (DE) and Swiss (CHE) VAT formats**:
  - German: `DE` followed by exactly 9 digits (e.g., `DE123456789`)
  - Swiss: Accepts all common formats (e.g., `CHE-123.456.789`, `CHE123456789`, `CHE123.456.789`, etc.), always outputs as `CHE-123.456.789`
- **OCR support** for images using [Tesseract.js](https://github.com/naptha/tesseract.js).
- **Tab-based UI** for switching between extraction modes.
- **Delete/Clear buttons** for each section.
- **Responsive and modern popup UI**.

---

## Installation

1. **Clone or download this repository.**
2. **Install dependencies** (if you want to build or use OCR locally):
    ```sh
    npm install
    ```
3. **Build (optional):**
    - If you use a build system like Webpack, run `npm run build`.
    - For most users, you can use the files as-is.

4. **Load the extension in Chrome:**
    - Go to `chrome://extensions/`
    - Enable "Developer mode"
    - Click "Load unpacked"
    - Select the project folder

---

## Usage

1. Click the VAT Reader icon in your Chrome toolbar.
2. Use the tabs to:
    - **Read VAT:** Extract VAT numbers from the current web page.
    - **Read PDF VAT:** Upload a PDF and extract VAT numbers.
    - **Capture VAT:** Use OCR to extract VAT numbers from images/screenshots.
3. Use the **delete** buttons to clear results in each section.

---

## VAT Number Formats Supported

- **German VAT:**  
  - Format: `DE` followed by exactly 9 digits (e.g., `DE123456789`)
- **Swiss VAT:**  
  - Formats accepted:  
    - `CHE-123.456.789`
    - `CHE123456789`
    - `CHE123.456.789`
    - `CHE-123456789`
    - `CHE-123-456-789`
    - `CHE123-456-789`
    - `CHE.123.456.789`
  - Output is always normalized to: `CHE-123.456.789`

---

## Technologies Used

- [Tesseract.js](https://github.com/naptha/tesseract.js) for OCR
- [PDF.js](https://mozilla.github.io/pdf.js/) for PDF text extraction
- JavaScript, HTML, CSS

---

## File Structure

```
├── manifest.json
├── popup.html
├── styles/
│   └── styles.css
├── scripts/
│   ├── popup.js
│   ├── pdf_reader.js
│   ├── ocr_reader.js
│   └── pdfjs-5.2.133-dist/
│       └── build/
│           ├── pdf.js
│           └── pdf.worker.js
├── Vat_Formats/
│   └── extractors.js
├── image/
│   └── logo.png
└── README.md
```

---

## Development

- **OCR:** Uses Tesseract.js for extracting text from images/screenshots.
- **PDF Extraction:** Uses PDF.js to extract text from PDFs, then applies VAT extraction logic.
- **Centralized VAT Extraction:** All VAT extraction logic is in `Vat_Formats/extractors.js` for consistency.

---

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

---

## License

[MIT](LICENSE)

---

## Credits

- [Tesseract.js](https://github.com/naptha/tesseract.js)

## Future Updated

1) More Country Format  will be here! (FR -> GB -> IT -> ES -> PL ->.........)

2) Capture VAT number will replace with image VAT number extraction!

3) Design and Style will improve based on files logic!

4) Some VAT numbers extraction logic will develop!

> All Data is not saving in the database. When you close the application, data will disappear definitely!