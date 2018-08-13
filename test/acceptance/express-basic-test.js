const test = require('blue-tape');
const nf = require('node-fetch');
const log  = require('metalogger')();
const fp = require('fakepromise');

test('Basic Healthy Express Health Check', async t => {

  // avoid problems if this env var is already set from wherever test was run
  process.env.NODE_HEALTH_ENDPOINT_PATH = "";

  const server = require('../support/server').getServer();
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

    t.same(response.details["downStreamAPI:response"].metricValue, 250,
      'healthcheck endpoint details work for second check');

    const delay = await fp.promise(100, true); // slight delay to test caching below

    const res3 = await nf(`${baseuri}/health`);  
    t.equal(res3.status, 200, 'proper http status code for /health second call');
    const response3 = await res3.json();

    const cassandra_time_1 = response.details["cassandra:timeout"].time;
    const cassandra_time_2 = response3.details["cassandra:timeout"].time;
    const api_time_1 = response.details["downStreamAPI:response"].time;
    const api_time_2 = response.details["downStreamAPI:response"].time;
    
    // API time is throttled (cached) so two runs should produce
    // the same time, while Cassandra call is not cached, so it should change:
    t.ok((cassandra_time_1 !== cassandra_time_2 &&
          api_time_1 == api_time_2 ), "caching and throttling works properly");
  
  } catch (err) {
    t.fail(err);
  }
  server.close();
  
});
