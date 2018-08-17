const test = require('blue-tape');
const nf = require('node-fetch');
const log  = require('metalogger')();
const fakepromise = require('fakepromise');

test('Express Default (Nothing Custom) Health Check', async t => {
  const server = getServer();
  try {
    const util = require('../support/util');
    const baseuri = util.serverUri(server);
    const uri = `${baseuri}/health`;

    const res = await nf(`${baseuri}/health`);  
    t.equal(res.status, 200, 'correct http status code');   
    const response = await res.json();

    t.same(!response.details, true, 
      'dont create details field for a simple response');   

  } catch (err) {
    t.fail(err);
  }
  server.close();

  //t.end();  // async tests dont need t.end() because blue-tape.
});

function getServer() {
  const express = require('express');
  const app = express();
  const healthcheck  = require('../../lib/health')();

  app.use(healthcheck.express());  

  const server = app.listen(0, function () {
    const port = server.address().port;
    //log.info(`Test server listening at port ${port} \n`);
  });

  return server;
}
