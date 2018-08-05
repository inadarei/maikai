const express = require('express');
const app = express();
const healthcheck = require("../");

const check = healthcheck();
check.addCheck('cassandra', 'timeout', async() => {
    return {
        status : 'pass',
        bullshit : false,
        metricValue: 250,
        "metricUnit": "ms"
    };
});

app.use(check.handler());

const check2 = healthcheck({"path" : "/ping"});
app.use(check2.handler());

function responder(req, res) {
    res.send('Hello Worldie!');
}

app.get('/', responder);
app.get('/hello', responder);

app.listen(3535, () => console.log('Example app listening on port 3535!'));
