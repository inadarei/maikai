const express = require('express');
const app = express();
const HealthCheck  = require('../');

const opts = {};
const check = new HealthCheck();
check.addCheck('cassandra', 'timeout', async() => {
    return {
        status : 'pass',
        bullshit : false,
        metricValue: 250,
        "metricUnit": "ms"
    };
});

app.use(check.handler(opts));
const check2 = new HealthCheck({"path" : "/ping"});
app.use(check2.handler());

function responder(req, res) {
    res.send('Hello Worldie!');
}

app.get('/', responder);
app.get('/hello', responder);


app.listen(3535, () => console.log('Example app listening on port 3535!'))
