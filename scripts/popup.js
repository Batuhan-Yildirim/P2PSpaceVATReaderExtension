document.addEventListener('DOMContentLoaded', function () {
  // Welcome page logic
  const startBtn = document.getElementById('start-btn');
  if (startBtn) {
    startBtn.onclick = function () {
      document.getElementById('welcome-page').style.display = 'none';
      document.getElementById('extract-page').style.display = 'flex';
    };
  }

  // Extract Data button logic
  const extractBtn = document.getElementById('extract-button');
  if (extractBtn) {
    extractBtn.onclick = function () {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        // First, inject extractors.js if not already present
        chrome.scripting.executeScript(
          {
            target: { tabId: tabs[0].id },
            files: ['Vat_Formats/extractors.js']
          },
          (injectResults) => {
            if (chrome.runtime.lastError) {
              console.error('Error injecting extractors.js:', chrome.runtime.lastError);
              document.getElementById('output').value = 'Failed to load VAT extractor.';
              return;
            }
            // Now run the extraction in the page context
            chrome.scripting.executeScript(
              {
                target: { tabId: tabs[0].id },
                func: () => {
                  // extractVAT is now available in the page context
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

  // Copy button logic
  const copyBtn = document.getElementById('copy-btn-main');
  if (copyBtn) {
    copyBtn.onclick = function () {
      const output = document.getElementById('output');
      output.select();
      document.execCommand('copy');
    };
  }

  // Delete button logic
  const restartBtn = document.getElementById('restart-btn');
  if (restartBtn) {
    restartBtn.onclick = function () {
      document.getElementById('output').value = '';
    };
  }
});