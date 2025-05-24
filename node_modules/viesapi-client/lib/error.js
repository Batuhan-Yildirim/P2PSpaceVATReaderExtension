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


const CLI_CONNECT         = 201;
const CLI_RESPONSE        = 202;
const CLI_NUMBER          = 203;
const CLI_NIP             = 204;
const CLI_EUVAT           = 205;
const CLI_EXCEPTION       = 206;
const CLI_DATEFORMAT      = 207;
const CLI_INPUT           = 208;
const CLI_BATCH_SIZE      = 209;

const codes = [
	/* CLI_CONNECT     */ 'Failed to connect to the VIES API service',
	/* CLI_RESPONSE    */ 'VIES API service response has invalid format',
	/* CLI_NUMBER      */ 'Invalid number type',
	/* CLI_NIP         */ 'NIP is invalid',
	/* CLI_EUVAT       */ 'EU VAT ID is invalid',
	/* CLI_EXCEPTION   */ 'Function generated an exception',
	/* CLI_DATEFORMAT  */ 'Date has an invalid format',
	/* CLI_INPUT       */ 'Invalid input parameter',
	/* CLI_BATCH_SIZE  */ 'Batch size limit exceeded [2-99]'
];

/**
 * Get error message
 * @param {int} code error code
 * @return {string|null} error message
 */
function message(code)
{
	if (code < CLI_CONNECT || code > CLI_INPUT) {
		return null;
	}

	return codes[code - CLI_CONNECT];
}

module.exports = {
	NIP_BAD               : 7,
	CONTENT_SYNTAX        : 8,
	INVALID_PATH          : 10,
	EXCEPTION             : 11,
	NO_PERMISSION         : 12,
	GEN_INVOICES          : 13,
	GEN_SPEC_INV          : 14,
	SEND_INVOICE          : 15,
	SEND_ANNOUNCEMENT     : 17,
	INVOICE_PAYMENT       : 18,
	SEARCH_KEY_EMPTY      : 20,
	EUVAT_BAD             : 22,
	VIES_SYNC             : 23,
	PLAN_FEATURE          : 26,
	SEARCH_TYPE           : 27,
	NIP_FEATURE           : 30,
	TEST_MODE             : 33,
	ACCESS_DENIED         : 35,
	MAINTENANCE           : 36,
	BILLING_PLANS         : 37,
	DOCUMENT_PDF          : 38,
	EXPORT_PDF            : 39,
	GROUP_CHECKS          : 42,
	CLIENT_COUNTERS       : 43,
	SEND_REMAINDER        : 47,
	EXPORT_JPK            : 48,
	GEN_ORDER_INV         : 49,
	SEND_EXPIRATION       : 50,
	ORDER_CANCEL          : 52,
	AUTH_TIMESTAMP        : 54,
	AUTH_MAC              : 55,
	SEND_MAIL             : 56,
	AUTH_KEY              : 57,
	VIES_TOO_MANY_REQ     : 58,
	VIES_UNAVAILABLE      : 59,
	GEOCODE               : 60,
	BATCH_SIZE            : 61,
	BATCH_PROCESSING      : 62,
	BATCH_REJECTED        : 63,

	DB_AUTH_IP			: 101,
	DB_AUTH_KEY_STATUS	: 102,
	DB_AUTH_KEY_VALUE	: 103,
	DB_AUTH_OVER_PLAN	: 104,
	DB_CLIENT_LOCKED	: 105,
	DB_CLIENT_TYPE		: 106,
	DB_CLIENT_NOT_PAID	: 107,
	DB_AUTH_KEYID_VALUE	: 108,

	CLI_CONNECT         : CLI_CONNECT,
	CLI_RESPONSE        : CLI_RESPONSE,
	CLI_NUMBER          : CLI_NUMBER,
	CLI_NIP             : CLI_NIP,
	CLI_EUVAT           : CLI_EUVAT,
	CLI_EXCEPTION       : CLI_EXCEPTION,
	CLI_DATEFORMAT      : CLI_DATEFORMAT,
	CLI_INPUT           : CLI_INPUT,
	CLI_BATCH_SIZE      : CLI_BATCH_SIZE,

	message: message
};
