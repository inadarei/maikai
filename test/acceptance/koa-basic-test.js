const test = require('blue-tape');
const nf = require('node-fetch');

test('Basic Healthy Koa Health Check', async t => {

  // avoid problems if this env var is already set from wherever test was run
  process.env.NODE_HEALTH_ENDPOINT_PATH = "";

  const server = getServer();
  const util = require('../support/util');
  const baseuri = util.serverUri(server);

  try {
    const res = await nf(`${baseuri}/hello`);
  
    const res2 = await nf(`${baseuri}/health`);  
    t.equal(res2.status, 200, 'proper http status code for /health');
    t.equal(res2.headers.get('content-type'), 
            'application/health+json; charset=utf-8',
            'proper content type for health endpoint');
    const response = await res2.json();
    t.same(response.status, 'pass',
      'healthcheck endpoint status works');
    //t.same(response.details["cassandra:timeout"].metricUnit, 'ms',
    //  'healthcheck endpoint details work');
  
  } catch (err) {
    t.fail(err);
  }

  server.close();
  
});

function getServer() {
  const http = require('http');
  const Koa = require('koa');
  const app = new Koa();

  const healthcheck  = require('../../lib/health')();
  
  healthcheck.addCheck('backend', 'koa-downstream', async() => {
    return {
        status : 'pass',
        metricValue: 17,
        metricUnit: "units"
    };
  });

  app.use(healthcheck.koa());

  const server = http.createServer(app.callback());

  server.listen(0, function(err) {
    if (err) console.error(err) && process.exit(1);
    const port = server.address().port;
    //console.log(`Test server listening at port ${port} \n`);
  });

  return server;
}
