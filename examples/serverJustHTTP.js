const http = require('http');
const healthcheck = require('../');
const fp = require('fakepromise');

http.createServer( (request, response) => {
  const check = healthcheck();

  check.addCheck('cassandra', 'timeout', async() => {
    return await fp.promise(10, {
        status : 'fail',
        bullshit : false,
        metricValue: 250,
        "metricUnit": "ms"
    });
  }, 5000);

  const checkHandler = check.http();
  const isHealthCheckCall = checkHandler(request, response);
  if (isHealthCheckCall) return;

  response.end("HELLO! This is pretty amaziiiiing");
}).listen(3535);
console.log('Server running on port 3535');
