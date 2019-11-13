'use strict';

const REGEXP_NORMALIZE_NAME = /\?/;
const REQUIRED_SYMBOL = '?';

/**
 * Normalized attribute name.
 *
 * @param {string} name - Attribute name
 * @return {string} From "?firstName" to "firstName"
 */
function normalizeAttributeName (name) {
    return name.replace(REGEXP_NORMALIZE_NAME, '');
}

/**
 * If name starts with "?" is not required.
 *
 * @param {string} name - Attribute name
 * @return {boolean} Is required?
 */
function isRequiredAttribute (name) {
    return name.charAt(0) !== REQUIRED_SYMBOL;
}

module.exports = {
    normalizeAttributeName,
    isRequiredAttribute
};
