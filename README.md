# trier-promise

A promise based trier

Do one thing and do it well many times.

# Installation

npm install trier-promise

# Interface

## Require

```javascript
var tp = require('trier-promise');

```

## Try something for 10 seconds at 1 second intervals

```javascript
tp({
    action: someFunctionThatReturnsAPromise,
    timeout: 10000,
    interval: 1000
  })
  .then(function(value) {
    // the value from the first success
  })
  .catch(function(error) {
    // error.message === 'TIMEOUT'
  });
```

## Try something for 10 seconds but guarantee 1 second sleep time between calls

If the asynchronous function takes a while, you may not want overlapping calls. 

```javascript
tp({
    action: aFunctionWithStdAsyncSignature,
    timeout: 10000,
    sleep: 1000,
    async: true   // note: this is needed so that tp knows to call with callback and wait
  })
  .then(function(value) {
    // the value from the first success
  })
  .catch(function(error) {
    // error.message === 'TIMEOUT'
  });
```

## Try something 10 times, no matter the time

```javascript
tp({
    action: aFunctionThatReturnsImmediately,
    limit: 10,
    sleep: 1000
  })
  .then(function(value) {
    // the value from the first success
  })
  .catch(function(error) {
    // error.message === 'LIMIT'
  });
```

## Try something until some condition

```javascript
tp({
    action: someFunctionThatReturnsAPromise,
    until: function() { return Math.random() < 0.1 },
    sleep: 1000
  })
  .then(function(value) {
    // the value from the first success
  })
  .catch(function(error) {
    // error.message === 'UNTIL'
  });
```


## Exponentially growing interval

Sometimes you want to start polling rapidly but slow down for subsequent calls.

So instead of using a Number value as the interval (or sleep), specify a function that returns a Number.

```javascript
var interval = 10;
tp({
    action: aFunctionWithStdAsyncSignature,
    timeout: 600000, // 10 minutes
    interval: function() { return interval *= 2; },
    async: true   // note: this is needed so that tp knows to call with callback and wait
  })
  .then(function(value) {
    // the value from the first success
  })
  .catch(function(error) {
    // error.message === 'TIMEOUT'
  });
```

