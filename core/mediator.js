'use strict';

const _ = require('lodash');
const P = require('bluebird');
const R = require('request-promise');

const defaultOptions = {};

const defaultRequestOptions = {
    json: true,
    method: 'GET'
};

const comparisons = {
    '>': (a, b) => a > b,
    '<': (a, b) => a < b,
    '>=': (a, b) => a >= b,
    '<=': (a, b) => a <= b,
    '==': (a, b) => a == b, // eslint-disable-line eqeqeq
    '===': (a, b) => a === b,
    '!=': (a, b) => a != b, // eslint-disable-line eqeqeq
    '!==': (a, b) => a !== b,
    eq: (a, b) => a === b,
    notEq: (a, b) => a !== b,
    in: (a, b) => b.includes(a),
    notIn: (a, b) => !b.includes(a),
    startsWith: (a, b) => _.isString(a) && _.startsWith(a, b),
    endsWith: (a, b) => _.isString(a) && _.endsWith(a, b),
    match: (a, b) => _.isString(a) && b.test(a),
    is: (a, b) => _[`is${_.upperFirst(b)}`](a)
};

/**
 * Filter items with where conditions.
 *
 * @private
 * @param {array} items
 * @param {mixed} where - where conditions for filter items
 */
function _filter (items, where) {
    return _.filter(items, item => _match(item, where));
}

/**
 * Return if item match with where conditions
 *
 * @private
 * @param {object} item
 * @param {mixed} where - where conditions for filter items
 */
function _match (item, where, comparison = '===') {
    return _.every(where, (condition, key) => {
        const value = !comparison ? item : _.get(item, key);

        if (_.isObject(condition)) {
            return _match(value, condition, false);
        }
        else if (_.isFunction(condition)) {
            return condition(value, item);
        }

        const fn = comparisons[comparison || key];

        if (!fn) {
            throw new Error(`Comparison method ${comparison || key} not found. Please use: [${_.keys(comparisons).join(', ')}]`);
        }
        return fn(value, condition);
    });
}

/**
 * Resolve the property value
 *
 * @private
 * @param {string} fn - function name
 * @param {string} property - property name
 * @param {mixed} defaultValue - default property value
 */
function _resolveProperty (fn, property, defaultValue) {
    return _.get(this.lastProperty, property, defaultValue);
}

class MediatorMapper {
    constructor (data, options) {
        this.options = _.defaults({}, options || {}, defaultOptions);

        // It is the attributes available
        this.data = data;

        // It is the last attribute available
        this.lastProperty = null;

        // It is the last where condition
        this.lastWhere = null;
    }

    /**
     * Fetch model/s from remote uri
     *
     * @param {string|mixed} uri - Request URI or Request options
     * @return {MediatorMapper} this
     */
    static fetch (uri, options) {
        let opts = uri;
        let p;

        if (_.isString(uri)) {
            opts = _.defaultsDeep({}, { uri }, defaultRequestOptions);
        }

        // Handle simple object request.Example {uri: 'http://api.mysite.com/users/1'}
        if (opts.uri) {
            p = P.resolve().then(() => R(opts));
        }
        // Handle complex object request. Example {user: 'http://api.site.com/users/1', device: {uri: 'http://api.site.com/users/1/devices/1', method: 'POST'}}
        else {
            p = P.props(_.reduce(opts, (props, uri, name) => {
                props[name] = P.resolve().then(() => R(_.isString(uri) ? _.defaultsDeep({}, { uri }, defaultRequestOptions) : uri));
                return props;
            }, {}));
        }

        return p.then(data => new MediatorMapper(data, options));
    }

    select (key) {
        this.lastProperty = this.data;
        this.lastProperty = _resolveProperty.call(this, 'select', key);
        return this;
    }

    where (key, condition) {
        let where = {};

        // Handle simple where condition. Example: .where('id', 1)
        if (!_.isObject(key)) {
            where[key] = condition;
        }

        // Handle complex where condition. Example: .where({ id: 1, active: 1})
        else {
            where = key;
        }

        // Clean last where. It is use for: .where('id').equal(1)
        this.lastWhere = null;

        // Handle lazy where condition. Example: .where('id').equal(1)
        if (_.isString(key) && condition === undefined) {
            this.lastWhere = key;
            return this;
        }

        // Handle property does not exists
        if (!this.lastProperty) {
            return this;
        }

        // Handle array property
        if (_.isArray(this.lastProperty)) {
            this.lastProperty = _filter(this.lastProperty, where);
        }
        // Handle object property
        else {
            this.lastProperty = _.head(_filter([this.lastProperty], where));
        }
        return this;
    }

    /**
     * Resolve the where condition
     *
     * @private
     * @param {string} fn - function name
     * @param {mixed} condition - condition value
     */
    match (condition) {
        if (!this.lastWhere) {
            throw new Error('First use .where(<property-name>) and then use .match(<condition>)');
        }
        return this.where(this.lastWhere, condition);
    }

    model (model, options, previous) {
        this.lastProperty = model.buildSync(this.lastProperty, options, previous);
        return this;
    }

    take (number, ending = false) {
        if (_.isArray(this.lastProperty)) {
            this.lastProperty = ending ? _.takeRight(this.lastProperty, number) : _.take(this.lastProperty, number);
        }
        return this;
    }

    get (index, key, defaultValue) {
        if (_.isArray(this.lastProperty)) {
            this.lastProperty = this.lastProperty[index];
        }
        return this.value(key, defaultValue);
    }

    first (key, defaultValue) {
        if (_.isArray(this.lastProperty)) {
            this.lastProperty = _.first(this.lastProperty);
        }
        return this.value(key, defaultValue);
    }

    last (key, defaultValue) {
        if (_.isArray(this.lastProperty)) {
            this.lastProperty = _.last(this.lastProperty);
        }
        return this.value(key, defaultValue);
    }

    value (key, defaultValue) {
        const value = key ? _resolveProperty.call(this, 'val', key, defaultValue) : this.lastProperty;

        this.lastProperty = this.data;
        return value;
    }
}

// First alias
MediatorMapper.prototype.head = MediatorMapper.prototype.first;

module.exports = MediatorMapper;
