const express = require('express');
const app = express();
const fp = require('fakepromise');
const healthcheck = require("../");


const check = healthcheck();

check.addCheck('cassandra', 'timeout', async() => {
    console.log("cassandra:timeout CALLLED!");
    return await fp.promise(10, {
        status : 'pass',
        bullshit : false,
        metricValue: 250,
        "metricUnit": "ms"
    });
}, 5000);

check.addCheck('mysql', 'success', fp.promise(20,{
        status : 'pass'
    }), 8000);

check.addCheck('downStreamAPI', 'response', async() => {
    console.log("downStreamAPI:response CALLEDDDDDDDDDDD!!!!");
    return {
        status : 'pass',
        metricValue: 750,
        "metricUnit": "ms"
    };
}, 100);

app.use(check.express());

const check2 = healthcheck({"path" : "/ping"});
app.use(check2.express());

function responder(req, res) {
    res.send('Hello Worldie!');
}

app.get('/', responder);
app.get('/hello', responder);

app.listen(3535, () => console.log('Example app listening on port 3535!'));
