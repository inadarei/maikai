const test = require('blue-tape');
const nf = require('node-fetch');

test('Basic Failing Koa Health Check', async t => {

  // avoid problems if this env var is already set from wherever test was run
  process.env.NODE_HEALTH_ENDPOINT_PATH = "";

  const server = getServer();
  const util = require('../support/util');
  const baseuri = util.serverUri(server);

  try {
    const res2 = await nf(`${baseuri}/health`);  
    t.equal(res2.status, 503, 'proper http status code for /health');
    t.equal(res2.headers.get('content-type'), 
            'application/health+json; charset=utf-8',
            'proper content type for health endpoint');
    const response = await res2.json();
    t.same(response.status, 'fail',
      'healthcheck endpoint status works');
  
  } catch (err) {
    t.fail(err);
  }

  server.close();
  
});

function getServer() {
  const http = require('http');
  const Koa = require('koa');
  const app = new Koa();
  const Router = require('koa-router');
  const router = new Router();
  
  router.get('/', (ctx, next) => {
    ctx.body = 'Hello, World!';
  });

  const healthcheck  = require('../../lib/health')();
  
  healthcheck.addCheck('backend', 'koa-downstream', async() => {
    const status = {
        status : 'fail',
    };

    const fakepromise = require('fakepromise');
    return fakepromise.promise(50, status);
  });

  app
  .use(healthcheck.koa())
  .use(router.routes())
  .use(router.allowedMethods());  

  const server = http.createServer(app.callback());

  server.listen(0, function(err) {
    if (err) console.error(err) && process.exit(1);
    const port = server.address().port;
    //console.log(`Test server listening at port ${port} \n`);
  });

  return server;
}
