const http = require('http');
const healthcheck = require('../');

http.createServer( (request, response) => {
  const check = healthcheck();
  const isHealthCheckCall = check.http(request, response);
  if (isHealthCheckCall) return;

  response.end("HELLO! This is pretty amaziiiiing");
}).listen(3535);
console.log('Server running on port 3535');