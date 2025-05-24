const VIESAPI = require('viesapi-client');

// Create client object and establish connection to the test system
const viesapi = new VIESAPI.VIESAPIClient();

const vat_id = 'PL7171642051';

// Get VIES data from VIES system and print only valid, company name, and address
viesapi.getVIESData(vat_id).then((vies) => {
  // Extract relevant fields
  const valid = vies.valid;
  const company = vies.traderName;
  const address = vies.traderAddress;
  const date = vies.date;
  console.log(`VAT valid: ${valid}`);
  console.log(`Company name: ${company}`);
  console.log(`Address: ${address}`);
  console.log(`Date: ${date}`);
}).catch((e) => {
  console.log(e.message);
});

/* Get current account status
viesapi.getAccountStatus().then((account) => {
  console.log(account.toString());
}).catch((e) => {
  console.log(e.message);
}); */

/* Get VIES data from VIES system
viesapi.getVIESData(vat_id).then((vies) => {
  console.log(vies.toString());
}).catch((e) => {
  console.log(e.message);
}); */

/* Get VIES data returning parsed trader name and address from VIES system
viesapi.getVIESDataParsed(vat_id).then((vies_parsed) => {
  console.log(vies_parsed.toString());
}).catch((e) => {
  console.log(e.message);
}); */

/* Upload batch of VAT numbers and get their current VAT statuses and traders data
const numbers = [
  vat_id,
  'DK56314210',
  'CZ7710043187'
];

viesapi.getVIESDataAsync(numbers).then((token) => {
  console.log('Batch token: ' + token);

  // Check batch result and download data (at production it usually takes 2-3 min for result to be ready)
  const looper = setInterval(() => {
    viesapi.getVIESDataAsyncResult(token).then((result) => {
      // Batch result is ready
      console.log(result.toString());
      clearInterval(looper);
    }).catch((e) => {
      console.log(e.message);
    });
  }, 10000);
}).catch((e) => {
  console.log(e.message);
}); */
