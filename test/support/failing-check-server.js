const log     = require('metalogger')();
const express = require('express');
const app = express();

const healthcheck  = require('../../lib/health')();

healthcheck.addCheck('backend', 'something', async() => {
    return {
        status : 'fail',
        unusualProp : false,
        metricValue: 17,
        metricUnit: "tps"
    };
});

app.use(healthcheck.handler());

// Note: listening on port "0" results to listening on random, free port. Avoids conflicts.
const server = app.listen(0, function () {
  const port = server.address().port;
  //log.info(`Test server listening at port ${port} \n`);
});
module.exports.server = server;
