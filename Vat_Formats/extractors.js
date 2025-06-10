// extractors.js - Centralized VAT extraction logic for multiple countries

// Germany (DE) VAT extractor
function extractDEVAT(text) {
  // Only match DE followed by exactly 9 digits (no more, no less)
  const deRegexes = [
    /\bDE\s?(\d{9})\b/,                // DExxxxxxxxx or DE xxxxxxxxx
    /\bDE\s?(\d{3})\s?(\d{3})\s?(\d{3})\b/, // DE xxx xxx xxx (with spaces)
    /\b(\d{9})\b/                      // xxxxxxxxx
  ];
  for (let regex of deRegexes) {
    const match = text.match(regex);
    if (match) {
      // Remove all spaces and ensure exactly 9 digits
      const digits = match.slice(1).join('') || match[1] || match[0].replace(/\D/g, '');
      if (digits.length === 9) {
        return `DE${digits}`;
      }
    }
  }
  return null;
}

// Switzerland (CHE) VAT extractor
function extractCHEVAT(text) {
  // Match: CHE123456789, CHE-123.456.789, CHE-123456789, CHE123.456.789
  const cheRegex = /\bCHE[-.\s]?(\d{3})[-.\s]?(\d{3})[-.\s]?(\d{3})\b/;
  const match = text.match(cheRegex);
  if (match) {
    const digits = match.slice(1).join('');
    if (digits.length === 9) {
      return `CHE-${digits.slice(0,3)}.${digits.slice(3,6)}.${digits.slice(6,9)}`;
    }
  }
  return null;
}

// Centralized extractor
function extractVAT(text) {
  return extractDEVAT(text) || extractCHEVAT(text) || null;
}

function extractVatNumbers(text) {
  if (!text) return [];
  // Normalize: collapse all whitespace to single spaces and remove spaces after DE
  const normalized = text.replace(/\s+/g, ' ').replace(/DE\s+(\d)/g, 'DE$1');

  // Strictly match DE followed by exactly 9 digits (no more, no less)
  const vatRegexDE = /\bDE\s*(\d{9})\b/g;
  // Switzerland VAT: CHE-123.456.789, CHE123456789, CHE-123456789, CHE123.456.789
  const vatRegexCHE = /\bCHE[-\s]?(\d{3})[.\s]?(\d{3})[.\s]?(\d{3})\b/g;

  // Collect all valid German VATs
  const matchesDE = [];
  let match;
  while ((match = vatRegexDE.exec(normalized)) !== null) {
    if (match[1].length === 9) {
      matchesDE.push(`DE${match[1]}`);
    }
  }

  // Collect all valid Swiss VATs
  const matchesCHE = [];
  while ((match = vatRegexCHE.exec(normalized)) !== null) {
    const digits = match.slice(1).join('');
    if (digits.length === 9) {
      matchesCHE.push(`CHE-${digits.slice(0,3)}.${digits.slice(3,6)}.${digits.slice(6,9)}`);
    }
  }

  return [...matchesDE, ...matchesCHE];
}

// Export for use in content scripts (if needed)
if (typeof window !== "undefined") {
  window.extractVAT = extractVAT;
  window.extractVatNumbers = extractVatNumbers;
}