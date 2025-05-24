/**
 * Copyright 2022-2025 NETCAT (www.netcat.pl)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @author NETCAT <firma@netcat.pl>
 * @copyright 2022-2025 NETCAT (www.netcat.pl)
 * @license http://www.apache.org/licenses/LICENSE-2.0
 */

'use strict';

const maxios = require('axios').default;
const murl = require('url');
const mcrypto = require('crypto');
const mxmldom = require('@xmldom/xmldom');
const mxpath = require('xpath');
const mdatefns = require('date-fns');

const Err = require('./error');
const Number = require('./number');
const LegalForm = require('./legalform');
const NIP = require('./nip');
const EUVAT = require('./euvat');
const AccountStatus = require('./accountstatus');
const NameComponents = require('./namecomponents');
const AddressComponents = require('./addresscomponents');
const VIESData = require('./viesdata');
const VIESError = require('./vieserror');
const BatchResult = require('./batchresult');

VIESAPIClient.prototype.VERSION = '1.3.1';

VIESAPIClient.prototype.PRODUCTION_URL = 'https://viesapi.eu/api';
VIESAPIClient.prototype.TEST_URL = 'https://viesapi.eu/api-test';

VIESAPIClient.prototype.TEST_ID = 'test_id';
VIESAPIClient.prototype.TEST_KEY = 'test_key';

/**
 * Construct new error object
 * @constructor
 * @param {int} code error code
 * @param {string} description error description
 */
function ViesError(code, description)
{
	this.message = (description + ' (code: ' + code + ')');
	this.code = code;
	this.description = description;
	this.stack = Error().stack;
}

ViesError.prototype = Object.create(Error.prototype);
ViesError.prototype.constructor = ViesError;

/**
 * Construct new service client object
 * @param {string} id API key identifier
 * @param {string} key API key
 * @constructor
 */
function VIESAPIClient(id = undefined, key = undefined)
{
	this.url = this.TEST_URL;
	this.id = this.TEST_ID;
	this.key = this.TEST_KEY;

	if (id && key) {
		this.url = this.PRODUCTION_URL;
		this.id = id;
		this.key = key;
	}

	this.app = '';
	this.errcode = 0;
	this.err = '';
}

/**
 * Clear error
 * @param {VIESAPIClient} viesapi client object
 */
function clear(viesapi)
{
	viesapi.errcode = 0;
	viesapi.err = '';
}

/**
 * Set error details
 * @param {VIESAPIClient} viesapi client object
 * @param {int} code error code
 * @param {string} err error message
 */
function set(viesapi, code, err = undefined)
{
	viesapi.errcode = code;
	viesapi.err = (err ? err : Err.message(code));
}

/**
 * Get path suffix
 * @param {VIESAPIClient} viesapi client object
 * @param {number} type search number type as Number::xxx value
 * @param {string} number search number value
 * @return {string} path suffix
 */
function getPathSuffix(viesapi, type, number)
{
	let path = undefined;

	if (type === Number.NIP) {
		if (!NIP.isValid(number)) {
			set(viesapi, Err.CLI_NIP);
			return undefined;
		}

		path = 'nip/' + NIP.normalize(number);
	} else if (type === Number.EUVAT) {
		if (!EUVAT.isValid(number)) {
			set(viesapi, Err.CLI_EUVAT);
			return undefined;
		}

		path = 'euvat/' + EUVAT.normalize(number);
	}

	return path;
}

/**
 * Get element content as text
 * @param {Document} doc XML document
 * @param {string} path xpath string
 * @return {string} element value
 */
function xpathString(doc, path)
{
	const nodes = mxpath.select(path, doc);

	if (!nodes) {
		return '';
	}

	if (nodes.length !== 1) {
		return '';
	}

	return nodes[0].toString().trim();
}

/**
 * Get element content as integer
 * @param {Document} doc XML document
 * @param {string} path xpath string
 * @return {number|undefined}
 */
function xpathInt(doc, path)
{
	const val = xpathString(doc, path);

	if (!val) {
		return undefined;
	}

	return parseInt(val);
}

/**
 * Get element content as float
 * @param {Document} doc XML document
 * @param {string} path xpath string
 * @return {number|undefined}
 */
function xpathFloat(doc, path)
{
	const val = xpathString(doc, path);

	if (!val) {
		return undefined;
	}

	return parseFloat(val);
}

/**
 * Get element content as date in format yyyy-mm-dd
 * @param {Document} doc XML document
 * @param {string} path xpath string
 * @return {Date} element value
 */
function xpathDate(doc, path)
{
	const val = xpathString(doc, path);

	if (!val) {
		return undefined;
	}

	return mdatefns.parseISO(val.substring(0, 10));
}

/**
 * Get element content as date in format yyyy-mm-dd hh:mm:ss
 * @param {Document} doc XML document
 * @param {string} path xpath string
 * @return {Date} element value
 */
function xpathDateTime(doc, path)
{
	const val = xpathString(doc, path);

	if (!val) {
		return undefined;
	}

	return mdatefns.parseISO(val);
}

/**
 * Convert date to yyyy-mm-dd string
 * @param {string|Date} date input date
 * @return {string} output string
 */
function toString(date)
{
	if (typeof date === 'string') {
		// verify & format
		const d = mdatefns.parse(date, 'yyyy-MM-dd', new Date());

		return mdatefns.format(d, 'yyyy-MM-dd');
	} else if (date && Object.prototype.toString.call(date) === "[object Date]" && !isNaN(date)) {
		// format
		return mdatefns.format(date, 'yyyy-MM-dd');
	}

	return undefined;
}

/**
 * Check if string is a valid guid
 * @param {string} uuid string to check
 * @return {boolean} true if string is a valid guid
 */
function isUuid(uuid)
{
	return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
}

/**
 * Prepare authorization header content
 * @param {VIESAPIClient} viesapi client object
 * @param {string} method HTTP method
 * @param {string} url target URL
 * @return {string} authorization header content
 */
function auth(viesapi, method, url)
{
	const u = murl.parse(url);

	if (!u.port) {
		u.port = u.protocol === 'https:' ? '443' : '80';
	}

	const nonce = mcrypto.randomBytes(4).toString('hex');
	const ts = Math.round(Date.now() / 1000);

	const str = "" + ts + "\n"
		+ nonce + "\n"
		+ method + "\n"
		+ u.path + "\n"
		+ u.hostname + "\n"
		+ u.port + "\n"
		+ "\n";

	const mac = mcrypto.createHmac('sha256', viesapi.key).update(str).digest('base64');

	return 'MAC id="' + viesapi.id + '", ts="' + ts + '", nonce="' + nonce + '", mac="' + mac + '"';
}

/**
 * Prepare user agent information header content
 * @param {VIESAPIClient} viesapi client object
 * @return {string} user agent header content
 */
function userAgent(viesapi)
{
	let ver = 'Unknown';

	if (typeof window !== 'undefined' && typeof window.document !== 'undefined') {
		ver = 'Browser' + window.navigator.userAgent;
	} else if (typeof process !== 'undefined' && process.versions != null && process.versions.node != null) {
		ver = 'NodeJS ' + process.version;
	}

	return (viesapi.app ? viesapi.app + ' ' : '') + 'VIESAPIClient/' + viesapi.VERSION + ' Javascript/' + ver;
}

/**
 * Parse XML response
 * @param {VIESAPIClient} viesapi client object
 * @param {any} data HTTP response
 * @returns {Document|null} XML document or null
 */
function parseXml(viesapi, data)
{
	try {
		const doc = new mxmldom.DOMParser().parseFromString(data, 'text/xml');
		const code = xpathString(doc, '/result/error/code/text()');

		if (code) {
			set(viesapi, parseInt(code), xpathString(doc, '/result/error/description/text()'));
			return null;
		}

		return doc;
	} catch (e) {
		set(viesapi, Err.CLI_EXCEPTION, e.message);
	}

	return null;
}

/**
 * Perform HTTP GET request
 * @param {VIESAPIClient} viesapi client object
 * @param {string} url target URL
 * @return {Promise<Document>} promise returning XML document on success
 */
function get(viesapi, url)
{
	const agent = userAgent(viesapi);

	return maxios.get(url, {
		headers: {
			'Accept': 'text/xml',
			'Authorization': auth(viesapi, 'GET', url),
			'User-Agent': agent,
			'X-VIESAPI-Client': agent
		}
	}).then(response => {
		const doc = parseXml(viesapi, response.data);
		if (!doc) {
			throw new ViesError(viesapi.getLastErrorCode(), viesapi.getLastError());
		}
		return doc;
	}).catch(e => {
		if (!(e instanceof ViesError) && !parseXml(viesapi, e.response.data)) {
			throw new ViesError(viesapi.getLastErrorCode(), viesapi.getLastError());
		}
		throw e;
	});
}

/**
 * Perform HTTP POST request
 * @param {VIESAPIClient} viesapi client object
 * @param {string} url target URL
 * @param {string} type content type
 * @param {string} content bytes
 * @return {Promise<Document>} promise returning XML document on success
 */
function post(viesapi, url, type, content)
{
	const agent = userAgent(viesapi);

	return maxios.post(url, content, {
		headers: {
			'Accept': 'text/xml',
			'Authorization': auth(viesapi, 'POST', url),
			'Content-Type': type,
			'User-Agent': agent,
			'X-VIESAPI-Client': agent
		}
	}).then(response => {
		const doc = parseXml(viesapi, response.data);
		if (!doc) {
			throw new ViesError(viesapi.getLastErrorCode(), viesapi.getLastError());
		}
		return doc;
	}).catch(e => {
		if (!(e instanceof ViesError) && !parseXml(viesapi, e.response.data)) {
			throw new ViesError(viesapi.getLastErrorCode(), viesapi.getLastError());
		}
		throw e;
	});
}

/**
 * Set non default service URL
 * @param {string} url service URL
 */
VIESAPIClient.prototype.setURL = function(url) {
	this.url = url;
};

/**
 * Set application info
 * @param {string} app app info
 */
VIESAPIClient.prototype.setApp = function(app) {
	this.app = app;
};

/**
 * Get VIES data for specified number
 * @param {string} euvat EU VAT number with 2-letter country prefix
 * @return {Promise<VIESData>} promise returning VIES data on success
 */
VIESAPIClient.prototype.getVIESData = function(euvat) {
	return new Promise((resolve, reject) => {
		// clear error
		clear(this);

		// validate number and construct path
		const suffix = getPathSuffix(this, Number.EUVAT, euvat);

		if (!suffix) {
			reject(new Error(this.getLastError()));
			return;
		}

		// send request
		get(this, this.url + '/get/vies/' + suffix).then((doc) => {
			const vd = new VIESData();

			vd.uid = xpathString(doc, '/result/vies/uid/text()');
			vd.countryCode = xpathString(doc, '/result/vies/countryCode/text()');
			vd.vatNumber = xpathString(doc, '/result/vies/vatNumber/text()');

			vd.valid = (xpathString(doc, '/result/vies/valid/text()') === 'true');

			vd.traderName = xpathString(doc, '/result/vies/traderName/text()');
			vd.traderCompanyType = xpathString(doc, '/result/vies/traderCompanyType/text()');
			vd.traderAddress = xpathString(doc, '/result/vies/traderAddress/text()');

			vd.id = xpathString(doc, '/result/vies/id/text()');
			vd.date = xpathDate(doc, '/result/vies/date/text()');
			vd.source = xpathString(doc, '/result/vies/source/text()');

			resolve(vd);
		}).catch((e) => {
			if (!(e instanceof ViesError)) {
				set(this, Err.CLI_EXCEPTION, e.message);
			}
			reject(e);
		});
	});
};

/**
 * Get VIES data returning parsed data for specified number
 * @param {string} euvat EU VAT number with 2-letter country prefix
 * @return {Promise<VIESData>} promise returning VIES data on success
 */
VIESAPIClient.prototype.getVIESDataParsed = function(euvat) {
	return new Promise((resolve, reject) => {
		// clear error
		clear(this);

		// validate number and construct path
		const suffix = getPathSuffix(this, Number.EUVAT, euvat);

		if (!suffix) {
			reject(new Error(this.getLastError()));
			return;
		}

		// send request
		get(this, this.url + '/get/vies/parsed/' + suffix).then((doc) => {
			const vd = new VIESData();

			vd.uid = xpathString(doc, '/result/vies/uid/text()');
			vd.countryCode = xpathString(doc, '/result/vies/countryCode/text()');
			vd.vatNumber = xpathString(doc, '/result/vies/vatNumber/text()');
			vd.valid = (xpathString(doc, '/result/vies/valid/text()') === 'true');
			vd.traderName = xpathString(doc, '/result/vies/traderName/text()');

			const name = xpathString(doc, '/result/vies/traderNameComponents/name/text()');

			if (name) {
				const nc = new NameComponents();
				nc.name = name;
				nc.legalForm = xpathString(doc, '/result/vies/traderNameComponents/legalForm/text()');
				nc.legalFormCanonicalId = xpathInt(doc, '/result/vies/traderNameComponents/legalFormCanonicalId/text()');
				nc.legalFormCanonicalName = xpathString(doc, '/result/vies/traderNameComponents/legalFormCanonicalName/text()');

				vd.traderNameComponents = nc;
			}

			vd.traderCompanyType = xpathString(doc, '/result/vies/traderCompanyType/text()');
			vd.traderAddress = xpathString(doc, '/result/vies/traderAddress/text()');

			const country = xpathString(doc, '/result/vies/traderAddressComponents/country/text()');

			if (country) {
				const ac = new AddressComponents();
				ac.country = country;
				ac.postalCode = xpathString(doc, '/result/vies/traderAddressComponents/postalCode/text()');
				ac.city = xpathString(doc, '/result/vies/traderAddressComponents/city/text()');
				ac.street = xpathString(doc, '/result/vies/traderAddressComponents/street/text()');
				ac.streetNumber = xpathString(doc, '/result/vies/traderAddressComponents/streetNumber/text()');
				ac.houseNumber = xpathString(doc, '/result/vies/traderAddressComponents/houseNumber/text()');

				vd.traderAddressComponents = ac;
			}

			vd.id = xpathString(doc, '/result/vies/id/text()');
			vd.date = xpathDate(doc, '/result/vies/date/text()');
			vd.source = xpathString(doc, '/result/vies/source/text()');

			resolve(vd);
		}).catch((e) => {
			if (!(e instanceof ViesError)) {
				set(this, Err.CLI_EXCEPTION, e.message);
			}
			reject(e);
		});
	});
};

/**
 * Upload batch of VAT numbers and get their current VAT statuses and traders data
 * @param {string[]} numbers Array of EU VAT numbers with 2-letter country prefix
 * @return {Promise<string>} promise returning Batch token for checking status and getting the result
 */
VIESAPIClient.prototype.getVIESDataAsync = function(numbers) {
	return new Promise((resolve, reject) => {
		// clear error
		clear(this);

		// validate input
		if (numbers.length < 2 || numbers.length > 99) {
			set(this, Err.CLI_BATCH_SIZE);
			reject(new Error(this.getLastError()));
			return;
		}

		// prepare request
		let xml = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\r\n"
			+ "<request>\r\n"
			+ "  <batch>\r\n"
			+ "    <numbers>\r\n";

		for (const number of numbers) {
			if (!EUVAT.isValid(number)) {
				set(this, Err.CLI_EUVAT);
				reject(new Error(this.getLastError()));
				return;
			}

			xml += "      <number>" + EUVAT.normalize(number) + "</number>\r\n";
		}

		xml += "    </numbers>\r\n"
			+ "  </batch>\r\n"
			+ "</request>";

		// send request
		post(this, this.url + '/batch/vies', 'text/xml; charset=UTF-8', xml).then((doc) => {
			const token= xpathString(doc, '/result/batch/token/text()');

			if (!token) {
				set(this, Err.CLI_RESPONSE);
				reject(new Error(this.getLastError()));
				return;
			}

			resolve(token);
		}).catch((e) => {
			if (!(e instanceof ViesError)) {
				set(this, Err.CLI_EXCEPTION, e.message);
			}
			reject(e);
		});
	});
};

/**
 * Check batch result and download data
 * @param {string} token Batch token received from getVIESDataAsync function
 * @return {Promise<BatchResult>} promise returning batch result on success
 */
VIESAPIClient.prototype.getVIESDataAsyncResult = function(token) {
	return new Promise((resolve, reject) => {
		// clear error
		clear(this);

		// validate input
		if (!token || !isUuid(token)) {
			set(this, Err.CLI_INPUT);
			reject(new Error(this.getLastError()));
			return;
		}

		// send request
		get(this, this.url + '/batch/vies/' + token).then((doc) => {
			const br = new BatchResult();

			for (let i = 1; ; i++) {
				const uid = xpathString(doc, "/result/batch/numbers/vies[" + i + "]/uid/text()");

				if (!uid) {
					break;
				}

				const vd = new VIESData();

				vd.uid = uid;
				vd.countryCode = xpathString(doc, "/result/batch/numbers/vies[" + i + "]/countryCode/text()");
				vd.vatNumber = xpathString(doc, "/result/batch/numbers/vies[" + i + "]/vatNumber/text()");
				vd.valid = (xpathString(doc, "/result/batch/numbers/vies[" + i + "]/valid/text()") === "true");
				vd.traderName = xpathString(doc, "/result/batch/numbers/vies[" + i + "]/traderName/text()");
				vd.traderCompanyType = xpathString(doc, "/result/batch/numbers/vies[" + i + "]/traderCompanyType/text()");
				vd.traderAddress = xpathString(doc, "/result/batch/numbers/vies[" + i + "]/traderAddress/text()");
				vd.id = xpathString(doc, "/result/batch/numbers/vies[" + i + "]/id/text()");
				vd.date = xpathDate(doc, "/result/batch/numbers/vies[" + i + "]/date/text()");
				vd.source = xpathString(doc, "/result/batch/numbers/vies[" + i + "]/source/text()");

				br.numbers.push(vd);
			}

			for (let i = 1; ; i++) {
				const uid = xpathString(doc, "/result/batch/errors/error[" + i + "]/uid/text()");

				if (!uid) {
					break;
				}

				const ve = new VIESError();

				ve.uid = uid;
				ve.countryCode = xpathString(doc, "/result/batch/errors/error[" + i + "]/countryCode/text()");
				ve.vatNumber = xpathString(doc, "/result/batch/errors/error[" + i + "]/vatNumber/text()");
				ve.error = xpathString(doc, "/result/batch/errors/error[" + i + "]/error/text()");
				ve.date = xpathDate(doc, "/result/batch/errors/error[" + i + "]/date/text()");
				ve.source = xpathString(doc, "/result/batch/errors/error[" + i + "]/source/text()");

				br.errors.push(ve);
			}

			resolve(br);
		}).catch((e) => {
			if (!(e instanceof ViesError)) {
				set(this, Err.CLI_EXCEPTION, e.message);
			}
			reject(e);
		});
	});
};

/**
 * Get current account status
 * @return {Promise<AccountStatus>} promise returning account status on success
 */
VIESAPIClient.prototype.getAccountStatus = function() {
	return new Promise((resolve, reject) => {
		// clear error
		clear(this);

		// send request
		get(this, this.url + '/check/account/status').then((doc) => {
			const as = new AccountStatus();

			as.uid = xpathString(doc, '/result/account/uid/text()');
			as.type = xpathString(doc, '/result/account/type/text()');
			as.validTo = xpathDateTime(doc, '/result/account/validTo/text()');
			as.billingPlanName = xpathString(doc, '/result/account/billingPlan/name/text()');

			as.subscriptionPrice = xpathFloat(doc, '/result/account/billingPlan/subscriptionPrice/text()');
			as.itemPrice = xpathFloat(doc, '/result/account/billingPlan/itemPrice/text()');
			as.itemPriceStatus = xpathFloat(doc, '/result/account/billingPlan/itemPriceCheckStatus/text()');
			as.itemPriceParsed = xpathFloat(doc, '/result/account/billingPlan/itemPriceStatusParsed/text()');

			as.limit = xpathInt(doc, '/result/account/billingPlan/limit/text()');
			as.requestDelay = xpathInt(doc, '/result/account/billingPlan/requestDelay/text()');
			as.domainLimit = xpathInt(doc, '/result/account/billingPlan/domainLimit/text()');
			as.overPlanAllowed = (xpathString(doc, '/result/account/billingPlan/overplanAllowed/text()') === 'true');

			as.excelAddIn = (xpathString(doc, '/result/account/billingPlan/excelAddin/text()') === 'true');
			as.app = (xpathString(doc, '/result/account/billingPlan/app/text()') === 'true');
			as.cli = (xpathString(doc, '/result/account/billingPlan/cli/text()') === 'true');
			as.stats = (xpathString(doc, '/result/account/billingPlan/stats/text()') === 'true');
			as.monitor = (xpathString(doc, '/result/account/billingPlan/monitor/text()') === 'true');

			as.funcGetVIESData = (xpathString(doc, '/result/account/billingPlan/funcGetVIESData/text()') === 'true');
			as.funcGetVIESDataParsed = (xpathString(doc, '/result/account/billingPlan/funcGetVIESDataParsed/text()') === 'true');

			as.viesDataCount = xpathInt(doc, '/result/account/requests/viesData/text()');
			as.viesDataParsedCount = xpathInt(doc, '/result/account/requests/viesDataParsed/text()');
			as.totalCount = xpathInt(doc, '/result/account/requests/total/text()');

			resolve(as);
		}).catch((e) => {
			if (!(e instanceof ViesError)) {
				set(this, Err.CLI_EXCEPTION, e.message);
			}
			reject(e);
		});
	});
};

/**
 * Get last error code
 * @returns {int} error code
 */
VIESAPIClient.prototype.getLastErrorCode = function () {
    return this.errcode;
};

/**
 * Get last error message
 * @returns {string} error message
 */
VIESAPIClient.prototype.getLastError = function () {
	return this.err;
};

module.exports = VIESAPIClient;
