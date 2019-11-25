'use strict';

const P = require('bluebird');
const numeral = require('numeral');
const mockRequire = require('mock-require');

const responses = {
    'http://api.mysite.com/devices/1': {"id":1,"active":1,"created_at":"2019-10-08T16:10:33.000Z","updated_at":null,"type":{"id":1,"description":"lance-silobag","created_at":"2019-10-08T15:33:50.000Z"},"attributes":[{"id":1,"id_device":1,"id_attribute":15,"description":"008000000400412A","active":1,"created_at":"2019-10-08T16:15:26.000Z","updated_at":null},{"id":44,"id_device":1,"id_attribute":1,"description":"Lanza #1","active":1,"created_at":"2019-11-05T20:45:22.000Z","updated_at":null},{"id":45,"id_device":1,"id_attribute":10,"description":"1","active":1,"created_at":"2019-11-05T20:45:22.000Z","updated_at":null}]}, // eslint-disable-line
    'http://api.mysite.com/devices/1/measurements': [{"id":7,"id_device":1,"id_metric":1,"id_unit":1,"amount":42.9082,"created_at":"2019-10-08T16:33:57.000Z","metric":"humidity","unit":"%","id_date":"2019100816","average":42.9483},{"id":52,"id_device":1,"id_metric":1,"id_unit":1,"amount":43.2058,"created_at":"2019-10-08T17:02:03.000Z","metric":"humidity","unit":"%","id_date":"2019100817","average":43.39904444},{"id":154,"id_device":1,"id_metric":1,"id_unit":1,"amount":43.5415,"created_at":"2019-10-08T18:04:03.000Z","metric":"humidity","unit":"%","id_date":"2019100818","average":43.41262222},{"id":8,"id_device":1,"id_metric":2,"id_unit":2,"amount":24.3325,"created_at":"2019-10-08T16:34:01.000Z","metric":"temperature","unit":"Cº","id_date":"2019100816","average":24.3298},{"id":53,"id_device":1,"id_metric":2,"id_unit":2,"amount":24.3432,"created_at":"2019-10-08T17:02:07.000Z","metric":"temperature","unit":"Cº","id_date":"2019100817","average":24.41825556},{"id":155,"id_device":1,"id_metric":2,"id_unit":2,"amount":24.4719,"created_at":"2019-10-08T18:04:08.000Z","metric":"temperature","unit":"Cº","id_date":"2019100818","average":24.49226},{"id":6,"id_device":1,"id_metric":3,"id_unit":13,"amount":4760,"created_at":"2019-10-08T16:33:53.000Z","metric":"carbon_dioxide","unit":"ppm","id_date":"2019100816","average":6262.5},{"id":51,"id_device":1,"id_metric":3,"id_unit":13,"amount":8775,"created_at":"2019-10-08T17:01:59.000Z","metric":"carbon_dioxide","unit":"ppm","id_date":"2019100817","average":4979.5},{"id":153,"id_device":1,"id_metric":3,"id_unit":13,"amount":7781,"created_at":"2019-10-08T18:03:59.000Z","metric":"carbon_dioxide","unit":"ppm","id_date":"2019100818","average":5104.88888889},{"id":5,"id_device":1,"id_metric":5,"id_unit":14,"amount":3.897,"created_at":"2019-10-08T16:33:48.000Z","metric":"battery.voltage","unit":"V","id_date":"2019100816","average":3.8975},{"id":50,"id_device":1,"id_metric":5,"id_unit":14,"amount":3.895,"created_at":"2019-10-08T17:01:55.000Z","metric":"battery.voltage","unit":"V","id_date":"2019100817","average":3.895},{"id":152,"id_device":1,"id_metric":5,"id_unit":14,"amount":3.892,"created_at":"2019-10-08T18:03:55.000Z","metric":"battery.voltage","unit":"V","id_date":"2019100818","average":3.89166667},{"id":20664,"id_device":1,"id_metric":12,"id_unit":1,"amount":10.4629,"created_at":"2019-10-08T16:34:01.000Z","metric":"heg","unit":"%","id_date":"2019100816","average":10.468725},{"id":20668,"id_device":1,"id_metric":12,"id_unit":1,"amount":10.5048,"created_at":"2019-10-08T17:02:07.000Z","metric":"heg","unit":"%","id_date":"2019100817","average":10.52897778},{"id":20677,"id_device":1,"id_metric":12,"id_unit":1,"amount":10.5469,"created_at":"2019-10-08T18:04:08.000Z","metric":"heg","unit":"%","id_date":"2019100818","average":10.52761111}] // eslint-disable-line
};

const res = {
    status: function (code) {
        this.statusCode = code;
        return this;
    },
    send: function (data, statusCode = 200) {
        this.statusCode = this.statusCode || statusCode;
        this.data = data;
        return this;
    }
};

const req = {
    params: {
        id: 1
    }
};

let ControllerMapper;
let ModelMapper;
let controller;
let Chart;

before(done => {
    mockRequire('request-promise', options => P.resolve(options).then(options => responses[options.uri]));

    _cleanRequireCache();

    // This requires are here because need mock request-promise
    ControllerMapper = require('../core/controller');
    ModelMapper = require('../core/model');

    Chart = new ModelMapper()
        .has().attribute('id')
        .has().attribute('amount')
        .has().attribute('?human').copy('amount').format((value, model) => numeral(value / 100).format('0.00[%]'))
        .has().attribute('metric').as('metric.description')
        .has().attribute('id_metric').as('metric.id')
        .has().attribute('unit').as('unit.description')
        .has().attribute('id_unit').as('unit.id')
        .has().attribute('created_at').as('date');

    class TestController extends ControllerMapper {
        props () {
            return {
                device: 'http://api.mysite.com/devices/1',
                measurements: 'http://api.mysite.com/devices/1/measurements'
            };
        }

        build (mediator) {
            return {
                id: mediator.select('device').value('id'),
                fullname: mediator.select('device.attributes').where('id_attribute', 1).first('description'),
                hardware: mediator.select('device.attributes').where('id_attribute').match(10).first('description'),
                position: mediator.select('device.attributes').where({ id_attribute: 15 }).first('description'),

                date: mediator.select('device.created_at').value(),

                charts: {
                    humidity: mediator.select('measurements').where('id_metric', 1).model(Chart).value(),
                    temperature: mediator.select('measurements').where({ id_metric: 2 }).model(Chart).value(),
                    carbon_dioxide: mediator.select('measurements').where('id_metric').match(3).model(Chart).value(),
                    battery: mediator.select('measurements').where('id_metric').match(5).model(Chart).value(),
                    heg: mediator.select('measurements').where('id_metric').match(12).model(Chart).value()
                },

                latest: {
                    humidity: mediator.select('measurements').where('id_metric', 1).model(Chart).last(),
                    temperature: mediator.select('measurements').where('id_metric', 2).model(Chart).last(),
                    carbon_dioxide: mediator.select('measurements').where('id_metric', 3).model(Chart).last(),
                    battery: mediator.select('measurements').where('id_metric', 5).model(Chart).last(),
                    heg: mediator.select('measurements').where('id_metric', 12).model(Chart).last()
                }
            };
        }
    }

    controller = new TestController();

    done();
});

after(done => {
    mockRequire.stopAll();
    _cleanRequireCache();
    done();
});

function _cleanRequireCache () {
    delete require.cache[require.resolve('../core/steplix')];
    delete require.cache[require.resolve('../core/controller')];
    delete require.cache[require.resolve('../core/mediator')];
    delete require.cache[require.resolve('../core/model')];
}

describe('Controller', () => {
    describe('Mapper', () => {
        describe('#handle', () => {
            it('should return response result when use chainable api', done => {
                P
                    .resolve()
                    .then(() => controller.handle(req, res))
                    .then(() => {
                        const result = res.data;

                        expect(result).to.have.property('id');
                        expect(result).to.have.property('fullname');
                        expect(result).to.have.property('hardware');
                        expect(result).to.have.property('position');
                        expect(result).to.have.property('date');
                        expect(result).to.have.property('charts');
                        expect(result).to.have.property('latest');
                        expect(result.charts).to.have.property('humidity').to.be.an('array').to.not.be.empty; // eslint-disable-line no-unused-expressions
                        expect(result.charts).to.have.property('temperature').to.be.an('array').to.not.be.empty; // eslint-disable-line no-unused-expressions
                        expect(result.charts).to.have.property('carbon_dioxide').to.be.an('array').to.not.be.empty; // eslint-disable-line no-unused-expressions
                        expect(result.charts).to.have.property('battery').to.be.an('array').to.not.be.empty; // eslint-disable-line no-unused-expressions
                        expect(result.charts).to.have.property('heg').to.be.an('array').to.not.be.empty; // eslint-disable-line no-unused-expressions
                        expect(result.latest).to.have.property('humidity').to.be.an('object').to.have.property('amount');
                        expect(result.latest).to.have.property('temperature').to.be.an('object').to.have.property('amount');
                        expect(result.latest).to.have.property('carbon_dioxide').to.be.an('object').to.have.property('amount');
                        expect(result.latest).to.have.property('battery').to.be.an('object').to.have.property('amount');
                        expect(result.latest).to.have.property('heg').to.be.an('object').to.have.property('amount');

                        done();
                    })
                    .catch(done);
            });
        });
    });
});
