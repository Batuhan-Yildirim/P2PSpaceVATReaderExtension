// extractors.js - Centralized VAT extraction logic for multiple countries

// Germany (DE) VAT extractor
function extractDEVAT(text) {
  const deRegexes = [
    /\bDE\s?\d{9}\b/,                // DExxxxxxxxx or DE xxxxxxxxx
    /\bDE\s?\d{3}\s?\d{3}\s?\d{3}\b/,// DE xxx xxx xxx (with spaces)
    /\b\d{9}\b/                      // xxxxxxxxx
  ];
  for (let regex of deRegexes) {
    const match = text.match(regex);
    if (match) return match[0].replace(/\s+/g, '');
  }
  return null;
}

// Switzerland (CHE) VAT extractor
function extractCHEVAT(text) {
  // Match: CHE123456789, CHE-123.456.789, CHE-123456789, CHE123.456.789
  const cheRegex = /\bCHE[-.\s]?\d{3}[-.\s]?\d{3}[-.\s]?\d{3}\b/;
  const match = text.match(cheRegex);
  if (match && match[0]) {
    // Remove all non-digit characters except CHE
    const digits = match[0].replace(/[^0-9]/g, '');
    if (digits.length === 9) {
      // Format as CHE-123.456.789
      return `CHE-${digits.slice(0,3)}.${digits.slice(3,6)}.${digits.slice(6,9)}`;
    }
  }
  return null;
}

// Add more country extractors here as needed...

// Centralized extractor
function extractVAT(text) {
  return extractDEVAT(text) || extractCHEVAT(text) || null;
}

// Export for use in content scripts (if needed)
if (typeof window !== "undefined") {
  window.extractVAT = extractVAT;
}