'use strict';

const _ = require('lodash');
const P = require('bluebird');
const moment = require('moment');
const numeral = require('numeral');
const { watch, unwatch } = require('watch-object');
const { normalizeAttributeName } = require('./helpers');

/**
 * Add one attribute model reference
 */
function one (data, result, options) {
    // Sets new attribute with the value.
    const value = _.get(data, options.normalizedName);

    // Verify if:
    //   value is undefined.
    //   attribute is required.
    //   fail when attribute value not exists.
    if (value === undefined && options.required && options.failOnNotExistsAttribute) {
        throw new Error(`No value found for attribute (one reference) "${options.normalizedName}"`);
    }

    // Sets attribute value.
    return P.bind(this)
        .then(() => options.mapper.build(value, options))
        .then(model => _.set(result, options.normalizedName, model))
        .then(() => result);
}

/**
 * Add many attribute model reference
 */
function many (data, result, options) {
    // Sets new attribute with the value.
    const value = _.get(data, options.normalizedName);

    // Verify if:
    //   value is undefined.
    //   attribute is required.
    //   fail when attribute value not exists.
    if (value === undefined && options.required && options.failOnNotExistsAttribute) {
        throw new Error(`No value found for attribute (many reference) "${options.normalizedName}"`);
    }

    // Sets attribute value.
    return P.bind(this)
        .then(() => options.mapper.build(value, options))
        .then(model => _.set(result, options.normalizedName, model))
        .then(() => result);
}

/**
 * Add attribute
 */
function attribute (data, result, options) {
    // Sets new attribute with the value.
    const value = _.get(data, options.normalizedName);

    // Verify if:
    //   value is undefined.
    //   attribute is required.
    //   fail when attribute value not exists.
    if (value === undefined && options.required && options.failOnNotExistsAttribute) {
        throw new Error(`No value found for attribute "${options.normalizedName}"`);
    }

    // Sets attribute value.
    _.set(result, options.normalizedName, value);

    if (options.as && (options.as !== options.name && options.as !== options.normalizeName)) {
        // Rename attribute.
        applyAs(result, options.as, options);
    }

    if (options.def) {
        // Sets attribute default value.
        applyDefault(result, options.def, options);
    }

    if (options.copy && (options.copy !== options.name && options.copy !== options.normalizeName)) {
        // Copy attribute value.
        applyCopy(result, options.copy, options);
    }

    if (options.type) {
        // Typed attribute value.
        applyType(result, options.type, options);
    }

    if (options.format) {
        // Apply format to attribute value.
        applyFormat(result, options.format, options);
    }
    return result;
}

/**
 * Rename attribute
 */
function applyAs (result, name, options) {
    // Normalized name (From "?firstName" to "firstName")
    const normalizedName = normalizeAttributeName(name);

    // Sets new attribute with the previous value.
    _.set(result, normalizedName, _.get(result, options.normalizedName));

    // Remove previous value.
    (function unset () {
        // Check if original attribute name if a nested attribute name.
        // Example:
        //    price is original attribute name
        //    price.value is copy attribute name
        //    We does not need delete the original attribute
        if (options.normalizedName.indexOf('.') === -1) {
            if (!normalizedName.split('.').includes(options.normalizedName)) {
                _.unset(result, options.normalizedName);
            }
            return;
        }

        // The original attribute name is a nested attribute name.
        _.unset(result, options.normalizedName);

        const parts = options.normalizedName.split(/\./).reverse();
        let history = '';

        parts.forEach((part, index) => {
            history = `${(index + 1) === parts.length ? '' : '.'}${part}` + history;

            const name = options.normalizedName.replace(history, '');

            if (name && _.isEmpty(_.get(result, name))) {
                return _.unset(result, name);
            }
            return false;
        });
    })();

    // Refresh options.
    options.normalizedName = normalizedName;
    options.name = name;

    return result;
}

/**
 * Default value attribute
 */
function applyDefault (result, value, options) {
    // Sets default attribute value only if necesary.
    _.set(result, options.normalizedName, _.get(result, options.normalizedName, value));
    return result;
}

/**
 * Typed attribute
 */
function applyType (result, type, options) {
    _.set(result, options.normalizedName, type(_.get(result, options.normalizedName)));
    return result;
}

/**
 * Copy attribute
 */
function applyCopy (result, original, options) {
    const originalName = normalizeAttributeName(original);
    const value = _.get(result, originalName);

    const apply = function (context, value) {
        // Sets attribute value.
        _.set(this, context.name, value);

        if (context.type) {
            // Typed attribute value.
            applyType(this, context.type, context.options);
        }

        if (context.format) {
            // Apply format to attribute value.
            applyFormat(this, context.format, context.options);
        }
    };

    // Copy by sync mode. (Already has value on source property)
    if (value !== undefined) {
        const context = {
            name: options.normalizedName,
            format: options.format,
            type: options.type,
            originalName,
            options
        };

        apply.call(result, context, value);
    }
    // Copy by async mode. (It does not yet have a value in the source property)
    else {
        const watchCopy = function (context, value) {
            // Apply copy
            apply.call(result, context, value);
            // Remove watch from original property name
            unwatch(this, context.originalName, watchCopy);
        }.bind(result, {
            name: options.normalizedName,
            format: options.format,
            type: options.type,
            originalName,
            options
        });

        // Attach watch to original property name
        watch(result, originalName, watchCopy);
    }
    return result;
}

/**
 * Format attribute value
 */
function applyFormat (result, format, options) {
    let value = _.get(result, options.normalizedName);

    if (_.isFunction(format)) {
        value = format(value, result);
    }
    else if (format.type === 'date') {
        value = moment(value, format.formatFrom).format(format.formatTo || format.format);
    }
    else /* if (format.type === 'number') */ {
        value = numeral(value).format(format.formatTo || format.format || format);
    }
    _.set(result, options.normalizedName, value);
    return result;
}

module.exports = {
    attribute,
    many,
    one
};
