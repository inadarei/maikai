# Node Health Middleware

> Maikaʻi (Hawaiian) - (stative) to be well, fine, in a state of goodness

  [![NPM Version][npm-image]][npm-url]
  [![Build Status][travis-image]][travis-url]
  [![Coverage Status][coveralls-image]][coveralls-url]

Node health middleware is an unobtrusive module that you can easily integrate
into your API code written in Node. This module is targeting multiple frameworks, 
while currently supporting: Express.js.

Maikai has full support for Kubernetes Readiness and Liveness Probes, making
it a great solution for implementing healthchecks in your microservices.

While the module is extremely configurable, you can also use it out of the box,
with zero configuration. If you use default configuration, health check endpoint
will be mounted at `/health` URI path and will respond with HTTP 202 as long 
as your Node server is up. In more involved setups you can add all kinds of
custom health checks (e.g. database) and expose wide variety of metrics as
defined in the [healthcheck draft RFC](https://tools.ietf.org/html/draft-inadarei-api-health-check.html). 

## Implementation Status

### Immediate Priority

- [x] Express/Connect
- [x] Koa
- [ ] Pure Node, no frameworks

### Open to Community Contributions

- [ ] Sails.js
- [ ] hapi.js
- [ ] Restify


## Installation

```bash
> npm i -S maikai
```

## Usage

### Examples for Express.js

Basic Usage:

```javascript
const healthcheck = require('maikai');

// Add middleware to your Express app:
app.use(healthcheck().express());
app.listen(3535);
```

Advanced usage with custom health checker:

```javascript
const healthcheck = require('maikai');
const check = healthcheck();

// If you need/want to add custom health checker functions:
check.addCheck('cassandra', 'timeout', async () => {
    // Returning fake data here, for brevity, but you
    // could be making DB calls, to check its health, making
    // API calls to downstream dependencies, or anything else
    // that your health check logic requires.
    return {
        status : 'pass',
        metricValue: 250,
        metricUnit: "ms"
    };
});

// Add middleware to your Express app:
app.use(check.express());
app.listen(3535);
```

### Example for Koa.js

```javascript
const Koa = require('koa');
const app = new Koa();
const healthcheck = require("maikai");

const check = healthcheck();

app.use(check.koa());
app.listen(3535);
```

### Example for no-frameworks, pure Node implementation:

```javascript
const http = require('http');
const healthcheck = require('maikai');

http.createServer( (request, response) => {
  const check = healthcheck();
  const isHealthCheckCall = check.http(request, response);
  if (isHealthCheckCall) return;

  response.end("HELLO! This is pretty amaziiiiing");
}).listen(3535);
console.log('Server running on port 3535');
```

## Kubernetes Liveness and Readiness Probes

When implementing [Kubernetes Liveness and Readiness probes](https://cloudplatform.googleblog.com/2018/05/Kubernetes-best-practices-Setting-up-health-checks-with-readiness-and-liveness-probes.html) you may decide that each one of those
probes should be at different URI paths. Implementing this is very easy with
Maikai. Let's assume your liveness probe is deployed at '/health', while your
readiness probe is deployed at '/ping':

```javascript
const express = require('express');
const app = express();
const healthcheck = require("maikai");

// For Liveness Probe, defaults may be all you need. 
const livenessCheck = healthcheck();
app.use(livenessCheck.express());

// For Readiness probe, we override the path and provide more checks:
const readinessCheck = healthcheck({"path" : "/ping"});
readinessCheck.addCheck('cassandra', 'timeout', dbQueryCheck);
app.use(readinessCheck.express());

// Implementation of the dbQueryCheck:
async function dbQueryCheck() {
    // ... implementation of checking your database works
}

// -- rest of your server startup logic

function responder(req, res) {
    res.send('Hello Worldie!');
}

app.get('/', responder);

app.listen(3535, () => console.log('Example app listening on port 3535!'));

```

## Customizations

By default the health endpoint is mounted at the default `/health` path. However
you can modify it by setting `NODE_HEALTH_ENDPOINT_PATH` environmental variable
to anything you wish.

The biggest customization opportunity, when using Maikai, is the ability
to develop custom health checkers. The overall health of the service is
the sum of all checkers. Meaning: if all of them "pass" then the service
is "pass" (healthy) as well, if any of them is "warn" the overall health 
is "warn" as well and if any of them "fail", the health of the service
is a "fail" as well. Next section explains how you can
go about writing custom health checks.

### Writing Custom Health Checkers

Every APi and application is different. The kind of metrics you may need to track
can be different from what others do. This module is all about being flexible,
while being designed for consistency and RFC-compliance. Adding custom health 
checks is very easy. All you need to do is to call an `addCheck()` call with
the name of the component and metrics that the check is related to, as well
as an ES2018 async function that will be executed to retrieve the health values.

The return JSON object MUST have `status` field that is either 'pass', 'warn'
or 'fail' and MAY have following additional fields:

- componentId
- componentType
- metricValue
- metricUnit
- status
- time
- output

## Roadmap

1. Cached checks - expensive checks, like database calls, should not be called 
every time a monitoring service decides to invoke health check endpoint to 
prevent accidental self-denial-of-service outages. Ability to cache expensive
checks is important for a quality health check system.

2. Circuit Breaking - if health check is calling a downstream service and sees
it failing, circuit-breaking should be implemented to prevent cascading failures.

## License

[MIT](LICENSE)

[npm-image]: https://img.shields.io/npm/v/maikai.svg
[npm-url]: https://npmjs.org/package/maikai

[travis-image]: https://travis-ci.org/inadarei/maikai.svg?branch=master
[travis-url]: https://travis-ci.org/inadarei/maikai

[coveralls-image]: https://coveralls.io/repos/github/inadarei/maikai/badge.svg
[coveralls-url]: https://coveralls.io/github/inadarei/maikai
