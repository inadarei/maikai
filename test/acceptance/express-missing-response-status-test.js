const test = require('blue-tape');
const nf = require('node-fetch');

test('Missing Express Response Status From a Dependency', async t => {
  const server = getServer();
  try {
    const util = require('../support/util');
    const baseuri = util.serverUri(server);
    const uri = `${baseuri}/health`;

    const res = await nf(`${baseuri}/health`);  
    t.equal(res.status, 503, 'correct http status code');   
    const response = await res.json();

    t.same(response.status, 'fail',
      'correct status');

    const regex = /Status for .*? may not be missing/;
    const test = response.details['backend:something-malformed'].output;
    t.same(Array.isArray(test.match(regex)), true, 'correct payload'); 

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
  
  healthcheck.addCheck('backend', 'something-malformed', async() => {
    const status = {
        metricValue: 17,
        metricUnit: "units"
    };

    const fakepromise = require('fakepromise');
    return fakepromise.promise(50, status);
  });
  app.use(healthcheck.express());  

  const server = app.listen(0, function () {
    const port = server.address().port;
    //log.info(`Test server listening at port ${port} \n`);
  });

  return server;
}
