const numeral = require('numeral');
const { ModelMapper } = require('../../core/steplix');

// BEGIN :: CREATE criptocurrency BASE MODEL
const criptocurrency = new ModelMapper();

module.exports.criptocurrency = criptocurrency
    .has().attribute('?description')
    .has().attribute('?formatted').copy('price').format('$0,0.00');
// END :: CREATE criptocurrency BASE MODEL

// ------------------------------------------------------------------------------------------------

// BEGIN :: CREATE criptocurrency bitcoin MODEL
const bitcoin = ModelMapper.extend(criptocurrency);

module.exports.bitcoin = bitcoin
    .has().attribute('?description').def('bitcoin')
    .has().attribute('bpi.USD.rate_float').as('price').type(Number);
// END :: CREATE criptocurrency bitcoin MODEL

// ------------------------------------------------------------------------------------------------

// BEGIN :: CREATE criptocurrency ethereum MODEL
const ethereum = ModelMapper.extend(criptocurrency);

module.exports.ethereum = ethereum
    .has().attribute('?description').def('ethereum')
    .has().attribute('price_usd').as('price').type(Number);
// END :: CREATE criptocurrency ethereum MODEL

// ------------------------------------------------------------------------------------------------

// BEGIN :: CREATE currency MODEL
const currency = new ModelMapper();

module.exports.currency = currency
    .has().attribute('?symbol').def('ARS')
    .has().attribute('MISC.petroleo').as('price').format(value => Number(value.replace(',', '.')))
    .has().attribute('?formatted').copy('price').format(value => `ARS${numeral(value).format('0,0.00')}`);
// END :: CREATE currency MODEL

// ------------------------------------------------------------------------------------------------

// BEGIN :: CREATE store MODEL
const store = new ModelMapper();

module.exports.store = store
    .has().attribute('id')
    .has().attribute('name').as('description')
    .has().attribute('url');
// END :: CREATE store MODEL

// ------------------------------------------------------------------------------------------------

// BEGIN :: CREATE country MODEL
const country = new ModelMapper();

module.exports.country = country
    .has().attribute('?description').def('Argentina')
    .has().attribute('?stores')
    .has().attribute('?currency');
// END :: CREATE country MODEL
