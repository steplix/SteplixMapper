'use strict';

const _ = require('lodash');
const P = require('bluebird');
const R = require('request-promise');
const async = require('async');
const mapper = require('./mapper');
const { normalizeAttributeName, isRequiredAttribute } = require('./helpers');

const defaultOptions = {
    failOnNotExistsAttribute: true
};

/**
 * Registers the properties of a model-builder schema object
 *
 * @private
 * @param {string} func - Property name
 * @param {mixed} options - options for the function property
 */
function _register (fn, options) {
    const property = { name: options.normalizedName, fn, options };

    // Add property to the schema
    this.properties[property.name] = property;
    return property;
}

/**
 * Registers the properties modifiers of a model-builder schema object
 *
 * @private
 * @param {string} func - Property name
 * @param {mixed} options - options for the function property
 */
function _registerModifier (fn, options) {
    if (!this.lastProperty) {
        throw new Error(`First use .[attribute, one or many](<options>) and then use .${fn}(<options>)`);
    }
    _.merge(this.lastProperty.options, options);
    return this;
}

/**
 * Build model and return the result
 *
 * @param {mixed} data - JSON array or unique object
 * @return {mixed} Mixed value the property
 */
function _build (data, options, previous) {
    options = _.defaults({}, options || {}, this.options);

    // Returns the result of the build model
    return P.reduce(_.values(this.properties), (result, property) => {
        // Applies all validations defined in lib one by one
        return mapper[property.fn].apply(this, [data, result, _.defaults({}, property.options, options)]);
    }, previous || {});
}

class ModelMapper {
    /**
     * Generate a model mapper extend from parent model mapper
     *
     * @return {ModelMapper}
     */
    static extend (mapper) {
        const modelMapper = new ModelMapper(mapper.options);

        modelMapper.properties = _.merge({}, mapper.properties);
        return modelMapper;
    }

    constructor (options) {
        this.options = _.defaults({}, options || {}, defaultOptions);

        // Initialize a schema with no properties defined
        this.properties = {};

        // It is the last attribute available
        this.lastProperty = null;
    }

    /**
     * Build model and return the result
     *
     * @param {mixed} data - JSON array or unique object
     * @return {mixed} Mixed value the property
     */
    build (data, options, previous) {
        // Sets data
        this.data = data;

        // Check if has more one elements on data.
        if (_.isArray(this.data)) {
            return new P((resolve, reject) => {
                async.map(this.data, (d, next) => {
                    return P.bind(this)
                        .then(() => _build.call(this, d, options, previous))
                        .then(result => next(null, result))
                        .catch(next);
                }, (error, models) => {
                    if (error) return reject(error);
                    return resolve(models);
                });
            });
        }

        // Returns the result of the build model
        return new P((resolve, reject) => {
            return P.bind(this)
                .then(() => _build.call(this, data, options, previous))
                .then(resolve)
                .catch(reject);
        });
    }

    /**
     * Build one model and return the result
     *
     * @param {mixed} data - JSON array or unique object
     * @return {mixed} Mixed value the property
     */
    buildOne (data, options, previous) {
        return this.build(_.isArray(data) ? _.first(data) : data, options, previous).then(models => {
            if (_.isArray(models)) {
                return _.first(models);
            }
            return models;
        });
    }

    /**
     * Fetch model from remote uri
     *
     * @param {string|mixed} uri - Request URI or Request options
     * @return {mixed} Mixed value the properties
     */
    fetch (uri, options, previous) {
        let opts = uri;

        if (_.isString(uri)) {
            opts = {
                json: true,
                method: 'GET',
                uri
            };
        }

        return R(opts).then(data => this.build(data, options, previous));
    }

    /**
     * Fetch one model from remote uri
     *
     * @param {string|mixed} uri - Request URI or Request options
     * @return {mixed} Mixed value the properties
     */
    fetchOne (uri, options, previous) {
        return this.fetch(uri, options, previous).then(models => {
            if (_.isArray(models)) {
                return _.first(models);
            }
            return models;
        });
    }

    /**
     * Fetch one model from all remote uri's
     *
     * @param {mixed} properties - See: http://bluebirdjs.com/docs/api/promise.props.html
     * @return {mixed} Mixed value the properties
     */
    fetchAll (properties, options, previous) {
        return P.props(properties).then(props => this.build(_.reduce(props, (memo, value, name) => _.set(memo, name, value), {}), options, previous));
    }

    /**
     * It is used to make the api readable and chainable
     */
    has () {
        this.lastProperty = null;
        return this;
    }

    attribute (name) {
        let options = name;

        if (_.isString(name)) {
            options = {
                normalizedName: normalizeAttributeName(name),
                required: isRequiredAttribute(name),
                name
            };
        }

        this.lastProperty = _register.call(this, 'attribute', options);
        return this;
    }

    attributes (attributes) {
        _.each(attributes, (options, name) => {
            const opts = {
                normalizedName: normalizeAttributeName(name),
                required: isRequiredAttribute(name),
                name
            };

            if (_.isString(options)) {
                options = {
                    as: options
                };
            }

            this.attribute(_.merge(opts, options));
        });
        return this;
    }

    one (name, mapper) {
        let options = name;

        if (_.isString(name)) {
            options = {
                normalizedName: normalizeAttributeName(name),
                required: isRequiredAttribute(name),
                name
            };
        }

        options.mapper = options.mapper || mapper;

        this.lastProperty = _register.call(this, 'one', options);
        return this;
    }

    many (name, mapper) {
        let options = name;

        if (_.isString(name)) {
            options = {
                normalizedName: normalizeAttributeName(name),
                required: isRequiredAttribute(name),
                name
            };
        }

        options.mapper = options.mapper || mapper;

        this.lastProperty = _register.call(this, 'many', options);
        return this;
    }

    format (options) {
        return _registerModifier.call(this, 'format', {
            format: options
        });
    }

    copy (options) {
        return _registerModifier.call(this, 'copy', {
            copy: options
        });
    }

    type (options) {
        return _registerModifier.call(this, 'type', {
            type: options
        });
    }

    def (options) {
        return _registerModifier.call(this, 'def', {
            def: options
        });
    }

    as (options) {
        return _registerModifier.call(this, 'as', {
            as: options
        });
    }
}

module.exports = ModelMapper;
