// extractors.js - Centralized VAT extraction logic for multiple countries

// Switzerland (CHE) VAT extractor
function extractCHEVAT(text) {
  // Accepts: CHE-123.456.789, CHE123456789, CHE123.456.789, CHE-123456789, CHE-123-456-789, CHE123-456-789, CHE.123.456.789
  const cheRegex = /\bCHE[-.\s]?(\d{3})[-.\s]?(\d{3})[-.\s]?(\d{3})\b/g;
  let match;
  const results = [];
  while ((match = cheRegex.exec(text)) !== null) {
    const digits = match.slice(1).join('');
    if (digits.length === 9) {
      results.push(`CHE-${digits.slice(0,3)}.${digits.slice(3,6)}.${digits.slice(6,9)}`);
    }
  }
  return results;
}

// Germany (DE) VAT extractor
function extractDEVAT(text) {
  // Only match DE followed by exactly 9 digits (no more, no less)
  const deRegexes = [
    /\bDE\s?(\d{9})\b/g,                // DExxxxxxxxx or DE xxxxxxxxx
    /\bDE\s?(\d{3})\s?(\d{3})\s?(\d{3})\b/g, // DE xxx xxx xxx (with spaces)
    /\b(\d{9})\b/g                      // xxxxxxxxx
  ];
  let results = [];
  for (let regex of deRegexes) {
    let match;
    while ((match = regex.exec(text)) !== null) {
      const digits = match.slice(1).join('') || match[1] || match[0].replace(/\D/g, '');
      if (digits.length === 9) {
        results.push(`DE${digits}`);
      }
    }
  }
  // Remove duplicates
  return [...new Set(results)];
}

// Centralized extractor
function extractVAT(text) {
  return extractDEVAT(text)[0] || extractCHEVAT(text)[0] || null;
}

function extractVatNumbers(text) {
  if (!text) return [];
  // Normalize: collapse all whitespace to single spaces and remove spaces after DE
  const normalized = text.replace(/\s+/g, ' ').replace(/DE\s+(\d)/g, 'DE$1');
  return [
    ...extractDEVAT(normalized),
    ...extractCHEVAT(normalized)
  ];
}

// Export for use in content scripts (if needed)
if (typeof window !== "undefined") {
  window.extractVAT = extractVAT;
  window.extractVatNumbers = extractVatNumbers;
}