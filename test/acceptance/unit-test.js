const test = require('blue-tape');
const fakepromise = require('fakepromise');

const healthcheck  = require('../../lib/health');

test('HealthCheck.addCheck()', async t => {

  const check = healthcheck();
  check.addCheck('component1', 'metric1', async () => {
    const status = {
        status : 'pass',
    };
    
    return fakepromise.promise(50, status);
  });

  const testName1 = 'Calling different addCheck() multiple times is fine';
  try {
    check.addCheck('component2', 'metric2', async () => {
      const status = {
          status : 'pass',
      };
      
      return fakepromise.promise(50, status);
    });  
  } catch (err) {
    t.comment(err);
    t.fail(testName1);
  }
  t.ok(true, testName1);

  const testName2 = 'Calling identical addCheck() multiple times not allowed';
  const expectedErr = /Calling identical addCheck/i;
  try {
    check.addCheck('component1', 'metric1', async () => {
      const status = {
          status : 'pass',
      };
      
      return fakepromise.promise(50, status);
    });
    t.fail(testName2);
  } catch (err) {
    t.ok(expectedErr.test(err.toString()), testName2);
  }
  
});
