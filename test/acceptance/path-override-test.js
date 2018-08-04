const test = require('blue-tape');
const nf = require('node-fetch');
const log  = require('metalogger')();

test('Overriding health endpoint URI', async t => {

  const OVERRIDEN_PATH = "/ping";
  process.env.NODE_HEALTH_ENDPOINT_PATH = OVERRIDEN_PATH;

  // Break cache to make sure we get fresh server
  delete require.cache[require.resolve('../support/server')]; 
  const server = require('../support/server').getServer();
  const util = require('../support/util');
  const baseuri = util.serverUri(server);

  try {
    const res2 = await nf(`${baseuri}${OVERRIDEN_PATH}`);  
    t.equal(res2.status, 200, `proper http status code for ${OVERRIDEN_PATH}`);
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
