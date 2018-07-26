const express = require('express');
const app = express();
const healthcheck = require("../");

const opts = {};

healthcheck.addCheck('cassandra', 'timeout', async() => {
    return {
        status : 'pass',
        bullshit : false,
        metricValue: 250,
        "metricUnit": "ms"
    };
});

app.use(healthcheck(opts));

function responder(req, res) {
    res.send('Hello Worldie!');
}

app.get('/', responder);
app.get('/hello', responder);


app.listen(3535, () => console.log('Example app listening on port 3535!'))
