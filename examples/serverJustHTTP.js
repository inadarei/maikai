const http = require('http');
const healthcheck = require('../');

http.createServer( (request, response) => {
  const check = healthcheck();
  if (!check.http(request, response)) return;

  response.end("HELLO! This is pretty amaziiiiing");
}).listen(3535);
console.log('Server running on port 3535');