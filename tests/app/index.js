const http = require('http');
const Models = require('./models');
const { ModelMapper } = require('../../core/steplix');

const PORT = process.env.PORT || 8000;

function handle (req, res) {
    const response = new ModelMapper();

    console.time(req.url);

    response
        .has().attribute('?cryptocurrencies')
        .has().attribute('?country');

    response
        .fetchAll({
            'cryptocurrencies[0]': Models.bitcoin.fetchOne('https://api.coindesk.com/v1/bpi/currentprice.json'),
            'cryptocurrencies[1]': Models.ethereum.fetchOne('https://api.coinmarketcap.com/v1/ticker/ethereum/'),
            'country.currency': Models.currency.fetchOne('https://s3.amazonaws.com/dolartoday/data.json'),
            'country.stores': Models.store.fetch('http://api.olx.com/countries/www.olx.com.ar/states')
        })
        .then(response => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response), 'utf-8');
            console.timeEnd(req.url);
        })
        .catch(error => {
            const code = 500;

            res.writeHead(code, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ code, error: `${error}` }), 'utf-8');
            console.timeEnd(req.url);
        });
}

http.createServer(handle).listen(PORT);

console.log(`Testing server running at http://localhost:${PORT}`);
