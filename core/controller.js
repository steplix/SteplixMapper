'use strict';

const P = require('bluebird');
const deprecate = require('depd')('steplix-mapper');
const MediatorMapper = require('./mediator');

class Controller {
    handle (req, res, next) {
        return P.bind(this)
            .then(() => this.validate(req, res))
            .then(() => this.fetch(req, res))
            .then(mediator => this.build(mediator, req, res))
            .then(result => this.success(res, result))
            .catch(error => this.error(error, req, res, next));
    }

    validate () {
        return P.resolve();
    }

    fetch (req, res) {
        return MediatorMapper.fetch(this.props(req, res));
    }

    props () {
        return P.return({});
    }

    map (mediator) {
        deprecate('controller.map: Please use controller.build instead.');
        return this.build(mediator);
    }

    build (mediator) {
        return mediator.value();
    }

    success (res, result, statusCode = 200) {
        return res.status(statusCode).send(result);
    }

    error (err, req, res, next) {
        const code = (err && (err.statusCode || err.status)) || 500;
        return res.status(code).send({ code, error: `${err}` });
    }

    handlerize () {
        return this.handle.bind(this);
    }
}

module.exports = Controller;
