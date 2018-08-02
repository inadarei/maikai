const test = require('blue-tape');
const nf = require('node-fetch');
const log  = require('metalogger')();
const healthcheck = require("../../lib/health");

test('Basic Healthy Health Check', async t => {

  const server = require('../support/server').server;
  const util = require('../support/util');
  const baseuri = util.serverUri(server);

  try {
    const res = await nf(`${baseuri}/hello`);  
    t.equal(res.status, 200, 'proper http status code for /hello');
    t.same(await res.text(), 'Hello World!',
           'An API endpoint works');
  
    const res2 = await nf(`${baseuri}/health`);  
    t.equal(res2.status, 200, 'proper http status code for /health');
    t.equal(res2.headers.get('content-type'), 
            'application/health+json; charset=utf-8',
            'proper content type for health endpoint');
    const response = await res2.json();
    t.same(response.status, 'pass',
      'healthcheck endpoint status works');
    t.same(response.details["cassandra:timeout"].metricUnit, 'ms',
      'healthcheck endpoint details work');
  
  } catch (err) {
    t.fail(err);
  }
  server.close();
  
});