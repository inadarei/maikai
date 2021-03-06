const test = require('blue-tape');
const nf = require('node-fetch');
const log  = require('metalogger')();

test('Failing Express Health Check', async t => {
  const brokenserver = getServer();
  try {
    const util = require('../support/util');
    const baseuri = util.serverUri(brokenserver);
    const uri = `${baseuri}/health`;

    const res = await nf(`${baseuri}/health`);  
    t.equal(res.status, 503, 'correct http status code');   
    const response = await res.json();

    t.same(response.status, 'fail',
    'correct status');
    t.same(response.details["backend:something"].metricUnit, 'tps',
    'correct payload');   

  } catch (err) {
    t.fail(err);
  }
  brokenserver.close();

  //t.end();  // async tests dont need t.end() because blue-tape.
});

function getServer() {
  const express = require('express');
  const app = express();
  const healthcheck  = require('../../lib/health')();
  
  healthcheck.addCheck('backend', 'something', async() => {
    const status = {
        status : 'fail',
        unusualProp : false,
        metricValue: 17,
        metricUnit: "tps"
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

  /*
      let res = await request('http://api.froyo.io/names?gender=f', {headers});

    //console.log(res);
    console.log(res.ok);
    console.log(res.status);
    console.log(res.statusText);
    console.log(res.headers.raw());
    console.log(res.headers.get('content-type'));
    console.log(await res.json());
    */
