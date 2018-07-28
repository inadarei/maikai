# Node Health Middleware

> Maikaʻi (Hawaiian) - (stative) to be well, fine, in a state of goodness

  [![NPM Version][npm-image]][npm-url]
  [![Coverage Status][coveralls-image]][coveralls-url]

Node health middleware is an unobtrusive module that you can easily integrate
into your API code written in Node. This module is targeting multiple frameworks, 
while currently supporting: Express.js.

While the module is extremely configurable, you can also use it out of the box,
with zero configuration. If you use default configuration, health check endpoint
will be mounted at `/health` URI path and will respond with HTTP 202 as long 
as your Node server is up. In more involved setups you can add all kinds of
custom health checks (e.g. database) and expose wide variety of metrics as
defined in the [healthcheck draft RFC](https://tools.ietf.org/html/draft-inadarei-api-health-check.html). 

## Implementation Status

- [x] Express/Connect
- [ ] Koa
- [ ] Sails.js
- [ ] hapi.js
- [ ] Restify
- [ ] Pure Node, no frameworks

## Installation

```bash
> npm i -S health-middleware
```

## Usage

Basic Usage:

```javascript
const healthcheck = require('health-middleware');

// Add middleware to your Express app:
app.use(healthcheck());
```

Advanced usage with custom health checker:

```javascript
const healthcheck = require('health-middleware');

// If you need/want to add custom health checker functions:
healthcheck.addCheck('cassandra', 'timeout', async () => {
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
app.use(healthcheck());
```

## Customizations

By default the health endpoint is mounted at the default `/health` path. However
you can modify it by setting `NODE_HEALTH_ENDPOINT_PATH` environmental variable
to anything you wish.

The biggest customization opportunity, when using Maikai, is the ability
to develop custom health checkers. The overall health of the service is
the some of all checkers. Meaning: if all of them "pass" then the service
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

Developing a PAR-certified CI/CD pipeline takes teams upwards of several weeks
or even months, in some cases. COVE team has been working hand-in-hand with the
Artemis PAR team to drastically decrease this lead time by developing a
streamlined COVE pipeline template, integrate it with the new PAR APIs for
self-service principles and collect evidence in a standard report for
non-automated principles, to speed-up even manual approval.

The vision is that for our target architecture of containerized microservices,
deployed on a kubernetes cluster, a PAR-certified CI/CD creating a brand new
pipeline should take at most couple days, from end to end, when deployed with
COVE.

[npm-image]: https://img.shields.io/npm/v/maikai.svg
[npm-url]: https://npmjs.org/package/maikai

[coveralls-image]: https://coveralls.io/repos/github/inadarei/maikai/badge.svg
[coveralls-url]: https://coveralls.io/github/inadarei/maikai