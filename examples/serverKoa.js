const Koa = require('koa');
const app = new Koa();
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

app.use(check.koa());

const check2 = healthcheck({"path" : "/ping"});
app.use(check2.koa());

app.listen(3535, () => console.log('Example app listening on port 3535!'));

//app.listen(3535);

