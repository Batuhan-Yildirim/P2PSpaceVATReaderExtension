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


/**
 * Address components
 */
function AddressComponents()
{
    this.country = undefined;
    this.postalCode = undefined;
    this.city = undefined;
    this.street = undefined;
    this.streetNumber = undefined;
    this.houseNumber = undefined;
}

/**
 * String representation
 * @return {string} object info
 */
AddressComponents.prototype.toString = function() {
    return 'AddressComponents: [country = ' + this.country
        + ', postalCode = ' + this.postalCode
        + ', city = ' + this.city
        + ', street = ' + this.street
        + ', streetNumber = ' + this.streetNumber
        + ', houseNumber = ' + this.houseNumber
        + ']';
};

module.exports = AddressComponents;
