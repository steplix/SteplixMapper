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

### Model mapper

#### Chainable API, to use it let's look at the following example:

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

#### To build a model manually, it would be the following

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

#### To build an array of models manually, it would be the following

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

#### To build a single model from an array of models, it would be the following
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

#### To build a model based on a remote JSON, it would be the following
> NOTE: For more information on the request options look here: https://github.com/request/request#requestoptions-callback

```js
mapper
  /* ... */
  .fetch('https://mywebsite.com/persons.json')
  .then(results => /* ... */)
  .catch(error => /* ... */);
```

#### To build a single model based on a remote JSON (with an array), it would be the following
> NOTE: For more information on the request options look here: https://github.com/request/request#requestoptions-callback

```js
mapper
  /* ... */
  .fetchOne('https://mywebsite.com/persons.json')
  .then(result => /* ... */)
  .catch(error => /* ... */);
```

### Mediator mapper

#### Chainable API, to use it let's look at the following example:

```js
const { MediatorMapper } = require('steplix-mapper');
MediatorMapper
  .fetch({
    device: 'http://api.mysite.com/devices/1',
    measurements: 'http://api.mysite.com/devices/1/measurements'
  })
  .then(mediator => {
    const response = {};
    
    response.id = mediator.select('device').value('id');
    response.fullname = mediator.select('device.attributes').where('id_attribute', 1).first('description');
    response.hardware = mediator.select('device.attributes').where('id_attribute').match(10).first('description');
    response.position = mediator.select('device.attributes').where({ id_attribute: 15 }).first('description');
    response.position = mediator.select('device.attributes').where({
      id_attribute: {
        is: 'number',
        eq: 20
      }
    }).first('description');
    response.position = mediator.select('device.attributes').where({
      id_attribute: { '==': '25' }
    }).first('description');
    response.position = mediator.select('device.attributes').where({
      id_attribute: { '===': 30 }
    }).first('description');

    response.date = mediator.select('device.created_at').value();

    response.charts = {};
    response.charts.humidity = mediator.select('measurements').where('id_metric', 1).model(chart).value();
    response.charts.temperature = mediator.select('measurements').where({'id_metric' : 2}).model(chart).value();
    response.charts.carbon_dioxide = mediator.select('measurements').where('id_metric').match(3).model(chart).value();
    response.charts.battery = mediator.select('measurements').where('id_metric').match(5).model(chart).value();
    response.charts.heg = mediator.select('measurements').where('id_metric').match(12).model(chart).value();

    response.latest = {};
    response.latest.humidity = mediator.select('measurements').where('id_metric', 1).model(chart).last();
    response.latest.temperature = mediator.select('measurements').where('id_metric', 2).model(chart).last();
    response.latest.carbon_dioxide = mediator.select('measurements').where('id_metric', 3).model(chart).last();
    response.latest.battery = mediator.select('measurements').where('id_metric', 5).model(chart).last();
    response.latest.heg = mediator.select('measurements').where('id_metric', 12).model(chart).last();

    return response;
  });
```

#### `mediator.select`

The `select` function is positioned on the specified `property`.
```js
// BEFORE: Mediator context { id: 1, device: { id: 100, name: 'Android' } }
mediator.select('device');
// AFTER: Mediator context { id: 100, name: 'Android' }
```

#### `mediator.where`

The `where` function filters the properties if possible.
```js
// BEFORE: Mediator context { id: 1, device: [{ id: 100, name: 'Android' }, { id: 101, name: 'IOS' }] }
mediator.select('device').where('name', 'Android');
// OR: mediator.select('device').where('name').match('Android');
// OR: mediator.select('device').where({ name: 'Android' });
// AFTER: Mediator context [{ id: 100, name: 'Android' }]
```
Other example:
```js
// BEFORE: Mediator context { id: 1, device: { id: 100, name: 'Android' } }
mediator.select('device').where('name', 'IOS');
// AFTER: Mediator context {}
```

#### `mediator.value`

The `value` function returns the element on context or the specified value of it.
```js
// Mediator context { id: 1, device: { id: 100, name: 'Android' } }
mediator.select('device').value();
// Return { id: 100, name: 'Android' }
```
Only read `property` value:
```js
// Mediator context { id: 1, device: { id: 100, name: 'Android' } }
mediator.select('device').value('name');
// Return 'Android'
```
Read non-existent value:
```js
// Mediator context { id: 1, device: { id: 100, name: 'Android' } }
mediator.select('device').where('name', 'WindowPhone').value('name');
// Return undefined
```
Use `defaultValue`:
```js
// Mediator context { id: 1, device: { id: 100, name: 'Android' } }
mediator.select('device').where('name', 'WindowPhone').value('name', 'Others');
// Return 'Others'
```

#### `mediator.first`

The `first` function returns the first element on context or the specified value of it.
```js
// Mediator context { id: 1, device: [{ id: 100, name: 'Android' }, { id: 101, name: 'IOS' }] }
mediator.select('device').where('name', 'Android').first();
// Return { id: 100, name: 'Android' }
```
Only read `property` value:
```js
// Mediator context { id: 1, device: [{ id: 100, name: 'Android' }, { id: 101, name: 'IOS' }] }
mediator.select('device').where('name', 'Android').first('name');
// Return 'Android'
```
Read non-existent value:
```js
// Mediator context { id: 1, device: [{ id: 100, name: 'Android' }, { id: 101, name: 'IOS' }] }
mediator.select('device').where('name', 'WindowPhone').first('name');
// Return undefined
```
Use `defaultValue`:
```js
// Mediator context { id: 1, device: [{ id: 100, name: 'Android' }, { id: 101, name: 'IOS' }] }
mediator.select('device').where('name', 'WindowPhone').first('name', 'Others');
// Return 'Others'
```

> Aliases: `mediator.head`

#### `mediator.last`

Same functionality as `first`, but based on the `last` element.
```js
// Mediator context { id: 1, device: [{ id: 100, name: 'Android' }, { id: 101, name: 'IOS' }] }
mediator.select('device').where('name', 'Android').last();
// Return { id: 100, name: 'Android' }
```

#### `mediator.get`

Same functionality as `first`, but based on the `get(index)` element.
```js
// Mediator context { id: 1, device: [{ id: 100, name: 'Android' }, { id: 101, name: 'IOS' }] }
mediator.select('device').get(1);
// Return { id: 101, name: 'IOS' }
```

#### `mediator.take`

The `take` function is positioned on the specified slice of array with n elements taken from the beginning or ending.
```js
// BEFORE: Mediator context { id: 1, device: [{ id: 100, name: 'Android' }, { id: 101, name: 'IOS' }, { id: 102, name: 'WindowPhone' }] }
mediator.select('device').take(2);
// AFTER: Mediator context [{ id: 100, name: 'Android' }, { id: 101, name: 'IOS' }]
```
From ending:
```js
// BEFORE: Mediator context { id: 1, device: [{ id: 100, name: 'Android' }, { id: 101, name: 'IOS' }, { id: 102, name: 'WindowPhone' }] }
mediator.select('device').take(2, /* flag ending */ true);
// AFTER: Mediator context [{ id: 101, name: 'IOS' }, { id: 102, name: 'WindowPhone' }]
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
