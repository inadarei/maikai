const test = require('blue-tape');
const request = require('supertest');
const log  = require('metalogger')();

const server = require('../support/server');

test('Basic Health Check', t => {

  request(server).get('/hello')
                 .expect(200)
                 .end((err, res) => {
                    if (err) throw err;
                    t.same(res.text, 'Hello World!',
                           'An API endpoint works');
                 });

  request(server).get('/health')
                 .expect(200)
                 .expect('content-type', 'application/health+json; charset=utf-8')
                 .end((err, res) => {
                    if (err) throw err;

                    const response = JSON.parse(res.text);
                    t.same(response.status, 'pass',
                           'healthcheck endpoint status works');
                    t.same(response.details["cassandra:timeout"].metricUnit, 'ms',
                           'healthcheck endpoint details work');                           
                 });

  t.end();
});

server.close();