'use strict';

const { ModelMapper } = require('../core/steplix');

describe('Model', () => {
    describe('Mapper', () => {
        describe('#build single model', () => {
            it('should return mapper result when use chainable api', done => {
                const mapper = new ModelMapper();

                mapper
                    .has().attribute('description')
                    .has().attribute('first_name').as('firstName')
                    .has().attribute('last_name').as('lastName')
                    .has().attribute('?currency').def('USD')
                    .has().attribute('birthdate').format({ type: 'date', format: 'DD/MM/YYYY' })
                    .has().attribute('price').type(Number)
                    .has().attribute('?formatted').copy('price').format('$0,0.00')
                    .build({
                        description: 'My Description Test',
                        first_name: 'My First Name',
                        last_name: 'My Last Name',
                        birthdate: '1987-12-16',
                        price: '1234.56'
                    })
                    .then(result => {
                        expect(result).to.have.property('description');
                        expect(result).to.have.property('firstName');
                        expect(result).to.have.property('lastName');
                        expect(result).to.have.property('birthdate').equal('16/12/1987');
                        expect(result).to.have.property('currency').equal('USD');
                        expect(result).to.have.property('price').to.be.a('number');
                        expect(result).to.have.property('formatted').equal('$1,234.56');

                        done();
                    })
                    .catch(done);
            });

            it('should return mapper result when use json api', done => {
                const mapper = new ModelMapper();

                mapper
                    .has().attributes({
                        description: 'description',
                        first_name: 'firstName',
                        last_name: 'lastName',
                        price: {
                            type: Number
                        },
                        birthdate: {
                            format: { type: 'date', format: 'DD/MM/YYYY' }
                        },
                        '?currency': {
                            def: 'USD'
                        },
                        '?formatted': {
                            copy: 'price',
                            format: '$0,0.00'
                        }
                    })
                    .build({
                        description: 'My Description Test',
                        first_name: 'My First Name',
                        last_name: 'My Last Name',
                        birthdate: '1987-12-16',
                        price: 1234.56
                    })
                    .then(result => {
                        expect(result).to.have.property('description');
                        expect(result).to.have.property('firstName');
                        expect(result).to.have.property('lastName');
                        expect(result).to.have.property('birthdate').equal('16/12/1987');
                        expect(result).to.have.property('currency').equal('USD');
                        expect(result).to.have.property('price');
                        expect(result).to.have.property('formatted').equal('$1,234.56');

                        done();
                    })
                    .catch(done);
            });

            it('should fail when attribute "last_name" not found', done => {
                const mapper = new ModelMapper();

                const model = mapper
                    .has().attribute('description')
                    .has().attribute('first_name').as('firstName')
                    .has().attributes({
                        last_name: 'lastName'
                    });

                model
                    .build({
                        description: 'My Description Test',
                        first_name: 'My First Name'
                    })
                    .then(done)
                    .catch(error => {
                        expect(error).to.be.an.instanceof(Error).to.have.property('message').equal('No value found for attribute "last_name"');
                        done();
                    });
            });

            it('should not fail when attribute "last_name" not found and use option.failOnNotExistsAttribute on false', done => {
                const mapper = new ModelMapper({
                    failOnNotExistsAttribute: false
                });

                const model = mapper
                    .has().attribute('description')
                    .has().attribute('first_name').as('firstName')
                    .has().attributes({
                        last_name: 'lastName'
                    });

                model
                    .build({
                        description: 'My Description Test',
                        first_name: 'My First Name'
                    })
                    .then(result => {
                        expect(result).to.be.an('object');
                        done();
                    })
                    .catch(done);
            });

            it('should return mapper result when use nested attribute names', done => {
                const mapper = new ModelMapper();

                mapper
                    .has().attribute('description')
                    .has().attribute('first_name').as('firstName')
                    .has().attribute('last_name').as('lastName')
                    .has().attribute('?currency').def('USD')
                    .has().attribute('birthdate').format({ type: 'date', format: 'DD/MM/YYYY' })
                    .has().attribute('price').as('price.value').type(Number)
                    .has().attribute('?price.formatted').copy('price.value').format('$0,0.00')
                    .build({
                        description: 'My Description Test',
                        first_name: 'My First Name',
                        last_name: 'My Last Name',
                        birthdate: '1987-12-16',
                        price: '1234.56'
                    })
                    .then(result => {
                        expect(result).to.have.property('description');
                        expect(result).to.have.property('firstName');
                        expect(result).to.have.property('lastName');
                        expect(result).to.have.property('birthdate').equal('16/12/1987');
                        expect(result).to.have.property('currency').equal('USD');
                        expect(result).to.have.property('price');
                        expect(result.price).to.have.property('value').to.be.a('number');
                        expect(result.price).to.have.property('formatted').equal('$1,234.56');

                        done();
                    })
                    .catch(done);
            });
        });

        describe('#build composite model (by one reference)', () => {
            it('should return mapper result when use chainable api', done => {
                const currencyMapper = new ModelMapper();
                const countryMapper = new ModelMapper();

                const currency = currencyMapper
                    .has().attribute('symbol')
                    .has().attribute('price').type(Number)
                    .has().attribute('?formatted').copy('price').format('$0,0.00');

                const country = countryMapper
                    .has().attribute('description')
                    .has().one('currency', currency);

                country
                    .build({
                        description: 'My Description Test',
                        currency: {
                            symbol: 'USD',
                            price: '1234.56'
                        }
                    })
                    .then(result => {
                        expect(result).to.have.property('description');
                        expect(result).to.have.property('currency');
                        expect(result.currency).to.have.property('price');
                        expect(result.currency).to.have.property('formatted').equal('$1,234.56');

                        done();
                    })
                    .catch(done);
            });

            it('should return mapper result when use json api', done => {
                const currencyMapper = new ModelMapper();
                const countryMapper = new ModelMapper();

                const currency = currencyMapper
                    .has().attributes({
                        symbol: 'symbol',
                        price: {
                            type: Number
                        },
                        '?formatted': {
                            copy: 'price',
                            format: '$0,0.00'
                        }
                    });

                const country = countryMapper
                    .has().attributes({
                        description: 'description'
                    })
                    .has().one('currency', currency);

                country
                    .build({
                        description: 'My Description Test',
                        currency: {
                            symbol: 'USD',
                            price: '1234.56'
                        }
                    })
                    .then(result => {
                        expect(result).to.have.property('description');
                        expect(result).to.have.property('currency');
                        expect(result.currency).to.have.property('price');
                        expect(result.currency).to.have.property('formatted').equal('$1,234.56');

                        done();
                    })
                    .catch(done);
            });

            it('should fail when attribute "currency" not found', done => {
                const currencyMapper = new ModelMapper();
                const countryMapper = new ModelMapper();

                const currency = currencyMapper
                    .has().attribute('symbol')
                    .has().attribute('price').type(Number)
                    .has().attribute('?formatted').copy('price').format('$0,0.00');

                const country = countryMapper
                    .has().attribute('description')
                    .has().one('currency', currency);

                country
                    .build({
                        description: 'My Description Test'
                    })
                    .then(done)
                    .catch(error => {
                        expect(error).to.be.an.instanceof(Error).to.have.property('message').equal('No value found for attribute (one reference) "currency"');
                        done();
                    });
            });

            it('should not fail when attribute "currency" not found and use option.failOnNotExistsAttribute on false', done => {
                const currencyMapper = new ModelMapper();
                const countryMapper = new ModelMapper({
                    failOnNotExistsAttribute: false
                });

                const currency = currencyMapper
                    .has().attribute('symbol')
                    .has().attribute('price').type(Number)
                    .has().attribute('?formatted').copy('price').format('$0,0.00');

                const country = countryMapper
                    .has().attribute('description')
                    .has().one('currency', currency);

                country
                    .build({
                        description: 'My Description Test'
                    })
                    .then(result => {
                        expect(result).to.be.an('object');
                        done();
                    })
                    .catch(done);
            });
        });

        describe('#build composite model (by many reference)', () => {
            it('should return mapper result when use chainable api', done => {
                const storeMapper = new ModelMapper();
                const countryMapper = new ModelMapper();

                const store = storeMapper
                    .has().attribute('id').type(Number)
                    .has().attribute('description')
                    .has().attribute('url');

                const country = countryMapper
                    .has().attribute('description')
                    .has().many('stores', store);

                country
                    .build({
                        description: 'My Description Test',
                        stores: [
                            {
                                id: 1,
                                description: 'Buenos Aires',
                                url: 'buenosaires.store.com'
                            }, {
                                id: 2,
                                description: 'Catamarca',
                                url: 'catamarca.store.com'
                            }
                        ]
                    })
                    .then(result => {
                        expect(result).to.have.property('description');
                        expect(result).to.have.property('stores');
                        expect(result.stores).to.have.lengthOf(2);
                        expect(result.stores[0]).to.have.property('id');
                        expect(result.stores[0]).to.have.property('description');
                        expect(result.stores[0]).to.have.property('url');

                        done();
                    })
                    .catch(done);
            });

            it('should return mapper result when use json api', done => {
                const storeMapper = new ModelMapper();
                const countryMapper = new ModelMapper();

                const store = storeMapper
                    .has().attributes({
                        id: {
                            type: Number
                        },
                        description: 'description',
                        url: 'url'
                    });

                const country = countryMapper
                    .has().attributes({
                        description: 'description'
                    })
                    .has().many('stores', store);

                country
                    .build({
                        description: 'My Description Test',
                        stores: [
                            {
                                id: 1,
                                description: 'Buenos Aires',
                                url: 'buenosaires.store.com'
                            }, {
                                id: 2,
                                description: 'Catamarca',
                                url: 'catamarca.store.com'
                            }
                        ]
                    })
                    .then(result => {
                        expect(result).to.have.property('description');
                        expect(result).to.have.property('stores');
                        expect(result.stores).to.have.lengthOf(2);
                        expect(result.stores[0]).to.have.property('id');
                        expect(result.stores[0]).to.have.property('description');
                        expect(result.stores[0]).to.have.property('url');

                        done();
                    })
                    .catch(done);
            });

            it('should fail when attribute "stores" not found', done => {
                const storeMapper = new ModelMapper();
                const countryMapper = new ModelMapper();

                const store = storeMapper
                    .has().attribute('id').type(Number)
                    .has().attribute('description')
                    .has().attribute('url');

                const country = countryMapper
                    .has().attribute('description')
                    .has().many('stores', store);

                country
                    .build({
                        description: 'My Description Test'
                    })
                    .then(done)
                    .catch(error => {
                        expect(error).to.be.an.instanceof(Error).to.have.property('message').equal('No value found for attribute (many reference) "stores"');
                        done();
                    });
            });

            it('should not fail when attribute "stores" not found and use option.failOnNotExistsAttribute on false', done => {
                const storeMapper = new ModelMapper();
                const countryMapper = new ModelMapper({
                    failOnNotExistsAttribute: false
                });

                const store = storeMapper
                    .has().attribute('id').type(Number)
                    .has().attribute('description')
                    .has().attribute('url');

                const country = countryMapper
                    .has().attribute('description')
                    .has().many('stores', store);

                country
                    .build({
                        description: 'My Description Test'
                    })
                    .then(result => {
                        expect(result).to.be.an('object');
                        done();
                    })
                    .catch(done);
            });
        });
    });
});
