'use strict';

const P = require('bluebird');
const numeral = require('numeral');
const { ModelMapper } = require('../core/steplix');

describe('Real World', () => {
    describe('Mapper', () => {
        describe('#fetch bitcoin model', () => {
            it('should return mapper result when use chainable api', done => {
                const bitcoin = new ModelMapper();

                bitcoin
                    .has().attribute('?description').def('bitcoin')
                    .has().attribute('?formatted').copy('price').format('$0,0.00')
                    .has().attribute('bpi.USD.rate_float').as('price').type(Number)
                    .fetchOne('https://api.coindesk.com/v1/bpi/currentprice.json')
                    .then(result => {
                        expect(result).to.have.property('description').equal('bitcoin');
                        expect(result).to.have.property('price').to.be.a('number');
                        expect(result).to.have.property('formatted').equal(numeral(result.price).format('$0,0.00'));

                        done();
                    })
                    .catch(done);
            });
        });

        describe('#fetch ethereum model', () => {
            it('should return mapper result when use chainable api', done => {
                const ethereum = new ModelMapper();

                ethereum
                    .has().attribute('?description').def('ethereum')
                    .has().attribute('price_usd').as('price').type(Number)
                    .has().attribute('?formatted').copy('price').format('$0,0.00')
                    .fetchOne('https://api.coinmarketcap.com/v1/ticker/ethereum/')
                    .then(result => {
                        expect(result).to.have.property('description').equal('ethereum');
                        expect(result).to.have.property('price').to.be.a('number');
                        expect(result).to.have.property('formatted').equal(numeral(result.price).format('$0,0.00'));

                        done();
                    })
                    .catch(done);
            });
        });

        describe('#fetch criptocurrencies models', () => {
            it('should return mapper result when use chainable api', done => {
                const criptocurrency = new ModelMapper();

                criptocurrency
                    .has().attribute('?description')
                    .has().attribute('?formatted').copy('price').format('$0,0.00');

                const bitcoin = ModelMapper.extend(criptocurrency);
                const ethereum = ModelMapper.extend(criptocurrency);

                bitcoin
                    .has().attribute('?description').def('bitcoin')
                    .has().attribute('bpi.USD.rate_float').as('price').type(Number);

                ethereum
                    .has().attribute('?description').def('ethereum')
                    .has().attribute('price_usd').as('price').type(Number);

                P
                    .all([
                        bitcoin.fetchOne('https://api.coindesk.com/v1/bpi/currentprice.json'),
                        ethereum.fetchOne('https://api.coinmarketcap.com/v1/ticker/ethereum/')
                    ])
                    .spread((bitcoin, ethereum) => {
                        expect(bitcoin).to.have.property('description').equal('bitcoin');
                        expect(bitcoin).to.have.property('price').to.be.a('number');
                        expect(bitcoin).to.have.property('formatted').equal(numeral(bitcoin.price).format('$0,0.00'));

                        expect(ethereum).to.have.property('description').equal('ethereum');
                        expect(ethereum).to.have.property('price').to.be.a('number');
                        expect(ethereum).to.have.property('formatted').equal(numeral(ethereum.price).format('$0,0.00'));

                        done();
                    })
                    .catch(done);
            });
        });

        describe('#fetchAll country model', () => {
            it('should return mapper result when use chainable api', done => {
                const currency = new ModelMapper();

                currency
                    .has().attribute('?symbol').def('ARS')
                    .has().attribute('MISC.petroleo').as('price').type(Number)
                    .has().attribute('?formatted').copy('price').format(value => `ARS${numeral(value).format('0,0.00')}`);

                const store = new ModelMapper();

                store
                    .has().attribute('id')
                    .has().attribute('name').as('description')
                    .has().attribute('url');

                const country = new ModelMapper();

                country
                    .has().attribute('?description').def('Argentina')
                    .has().attribute('?stores')
                    .has().attribute('?currency')
                    .fetchAll({
                        stores: store.fetch('http://api.olx.com/countries/www.olx.com.ar/states'),
                        currency: currency.fetchOne('https://s3.amazonaws.com/dolartoday/data.json')
                    })
                    .then(result => {
                        expect(result).to.have.property('description').equal('Argentina');
                        expect(result).to.have.property('currency');
                        expect(result.currency).to.have.property('symbol').equal('ARS');
                        expect(result.currency).to.have.property('price').to.be.a('number');
                        expect(result.currency).to.have.property('formatted').equal(`ARS${numeral(result.currency.price).format('0,0.00')}`);
                        expect(result).to.have.property('stores').to.not.be.empty; // eslint-disable-line no-unused-expressions
                        expect(result.stores[0]).to.have.property('id');
                        expect(result.stores[0]).to.have.property('description');
                        expect(result.stores[0]).to.have.property('url');

                        done();
                    })
                    .catch(done);
            });
        });

        describe('#fetchAll very complex response model', () => {
            it('should return mapper result when use chainable api', done => {
                const criptocurrency = new ModelMapper();

                criptocurrency
                    .has().attribute('?description')
                    .has().attribute('?formatted').copy('price').format('$0,0.00');

                const bitcoin = ModelMapper.extend(criptocurrency);
                const ethereum = ModelMapper.extend(criptocurrency);

                bitcoin
                    .has().attribute('?description').def('bitcoin')
                    .has().attribute('bpi.USD.rate_float').as('price').type(Number);

                ethereum
                    .has().attribute('?description').def('ethereum')
                    .has().attribute('price_usd').as('price').type(Number);

                const currency = new ModelMapper();

                currency
                    .has().attribute('?symbol').def('ARS')
                    .has().attribute('MISC.petroleo').as('price').type(Number)
                    .has().attribute('?formatted').copy('price').format(value => `ARS${numeral(value).format('0,0.00')}`);

                const store = new ModelMapper();

                store
                    .has().attribute('id')
                    .has().attribute('name').as('description')
                    .has().attribute('url');

                const country = new ModelMapper();

                country
                    .has().attribute('?description').def('Argentina')
                    .has().attribute('?stores')
                    .has().attribute('?currency');

                const response = new ModelMapper();

                response
                    .has().attribute('?cryptocurrencies')
                    .has().attribute('?country');

                response
                    .fetchAll({
                        'cryptocurrencies[0]': bitcoin.fetchOne('https://api.coindesk.com/v1/bpi/currentprice.json'),
                        'cryptocurrencies[1]': ethereum.fetchOne('https://api.coinmarketcap.com/v1/ticker/ethereum/'),
                        'country.currency': currency.fetchOne('https://s3.amazonaws.com/dolartoday/data.json'),
                        'country.stores': store.fetch('http://api.olx.com/countries/www.olx.com.ar/states')
                    })
                    .then(result => {
                        expect(result).to.have.property('cryptocurrencies').to.be.lengthOf(2);
                        expect(result.cryptocurrencies[0]).to.have.property('description').equal('bitcoin');
                        expect(result.cryptocurrencies[0]).to.have.property('price').to.be.a('number');
                        expect(result.cryptocurrencies[0]).to.have.property('formatted').equal(numeral(result.cryptocurrencies[0].price).format('$0,0.00'));
                        expect(result.cryptocurrencies[1]).to.have.property('description').equal('ethereum');
                        expect(result.cryptocurrencies[1]).to.have.property('price').to.be.a('number');
                        expect(result.cryptocurrencies[1]).to.have.property('formatted').equal(numeral(result.cryptocurrencies[1].price).format('$0,0.00'));
                        expect(result).to.have.property('country');
                        expect(result.country).to.have.property('currency');
                        expect(result.country.currency).to.have.property('symbol').equal('ARS');
                        expect(result.country.currency).to.have.property('price').to.be.a('number');
                        expect(result.country.currency).to.have.property('formatted').equal(`ARS${numeral(result.country.currency.price).format('0,0.00')}`);
                        expect(result.country).to.have.property('stores').to.not.be.empty; // eslint-disable-line no-unused-expressions
                        expect(result.country.stores[0]).to.have.property('id');
                        expect(result.country.stores[0]).to.have.property('description');
                        expect(result.country.stores[0]).to.have.property('url');

                        done();
                    })
                    .catch(done);
            });
        });
    });
});
