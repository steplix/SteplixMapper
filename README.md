# Steplix Mapper

Steplix Mapper is a promise-based Node.js Remote Object Mapper.

## Index

* [Download & Install][install].
* [How is it used?][how_is_it_used].
* [Tests][tests].

## Download & Install

### NPM
```bash
$ npm install steplix-mapper
```

### Source code
```bash
$ git clone https://github.com/steplix/SteplixMapper.git
$ cd SteplixMapper
$ npm install
```

## How is it used?

### Chainable API, to use it let's look at the following example:

```js
const { ModelMapper } = require('steplix-mapper');
const mapper = new ModelMapper();

mapper
  .has().attribute('description')
  .has().attribute('first_name').as('firstName')
  .has().attribute('last_name').as('lastName')
  .has().attribute('?currency').def('USD')
  .has().attribute('birthdate').format({ type: 'date', format: 'DD/MM/YYYY' })
  .has().attribute('price').type(Number)
  .has().attribute('?formatted').copy('price').format('$0,0.00');
```

### To build a model manually, it would be the following

```js
mapper
  /* ... */
  .build({
    description: 'My Description',
    first_name: 'My First Name',
    last_name: 'My Last Name',
    birthdate: '1987-12-16',
    price: '1234.56'
  })
  .then(result => /* ... */)
  .catch(error => /* ... */);
```

### To build an array of models manually, it would be the following

```js
mapper
  /* ... */
  .build([{
    description: 'My Description',
    first_name: 'My First Name',
    last_name: 'My Last Name',
    birthdate: '1987-12-16',
    price: '1234.56'
  }, {
    description: 'My Description 2',
    first_name: 'My First Name 2',
    last_name: 'My Last Name 2',
    birthdate: '1987-12-17',
    price: '6543.21'
  }])
  .then(results => /* ... */)
  .catch(error => /* ... */);
```

### To build a single model from an array of models, it would be the following
> NOTE: Only the first element of the array will be taken.

```js
mapper
  /* ... */
  .buildOne([{
    description: 'My Description',
    first_name: 'My First Name',
    last_name: 'My Last Name',
    birthdate: '1987-12-16',
    price: '1234.56'
  }, {
    description: 'My Description 2',
    first_name: 'My First Name 2',
    last_name: 'My Last Name 2',
    birthdate: '1987-12-17',
    price: '6543.21'
  }])
  .then(result => /* ... */)
  .catch(error => /* ... */);
```

### To build a model based on a remote JSON, it would be the following
> NOTE: For more information on the request options look here: https://github.com/request/request#requestoptions-callback

```js
mapper
  /* ... */
  .fetch('https://mywebsite.com/persons.json')
  .then(results => /* ... */)
  .catch(error => /* ... */);
```

### To build a single model based on a remote JSON (with an array), it would be the following
> NOTE: For more information on the request options look here: https://github.com/request/request#requestoptions-callback

```js
mapper
  /* ... */
  .fetchOne('https://mywebsite.com/persons.json')
  .then(result => /* ... */)
  .catch(error => /* ... */);
```

## Tests

In order to see more concrete examples, **I INVITE YOU TO LOOK AT THE TESTS :)**

### Run the unit tests
```sh
npm test
```

### Run an application (server) with a more formal example.
```sh
npm run test-app
```

<!-- deep links -->
[install]: #download--install
[how_is_it_used]: #how-is-it-used
[tests]: #tests
