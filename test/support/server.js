const log     = require('metalogger')();
const express = require('express');
const app = express();
const fakepromise = require('fakepromise');

delete require.cache[require.resolve('../../lib/health')]; 
const healthcheck  = require('../../lib/health')();

healthcheck.addCheck('cassandra', 'timeout', async() => {
    
    const status = {
        status : 'pass',
        bullshit : false,
        metricValue: 250,
        "metricUnit": "ms"
    };

    return fakepromise.promise(50, status);
});

healthcheck.addCheck('db', 'userRetrieval', 
    fakepromise.promise(50, {status: 'pass'})
);

app.use(healthcheck.express());

function responder(req, res) {
    res.send('Hello World!');
}

app.get('/', responder);
app.get('/hello', responder);

// Note: listening on port "0" results to listening on random, free port. Avoids conflicts.
module.exports.getServer = () => {
    const server = app.listen(0, function () {
        const port = server.address().port;
        //log.info(`Test server listening at port ${port} \n`);
    });

    return server;
};
