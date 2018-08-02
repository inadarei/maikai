const log = require('metalogger')();
const checks = {};

const STATUS_ERR = 'fail';
const STATUS_OK   = 'pass';
const STATUS_WARN = 'warn';

module.exports = function(opts) {

  const healthURI = require('config').uri;

  return async (req, res, next) => {

    const requestPath = req.originalUrl;

    if (requestPath === healthURI) {
      const response = await healthResponse(opts);
      const httpCode = (response.status === STATUS_ERR ) ? 503 : 200;

      res.set('Content-Type', 'application/health+json');
      return res.status(httpCode).send(response);
    } else {
      return next();
    }
  };
};


module.exports.addCheck = function (componentName, metricName, checkerPromise) {
  const key = `${componentName}:${metricName}`;
  checks[key] = checkerPromise;
};

async function healthResponse(opts) {
  const response = {};
  let overallStatus = STATUS_OK;
  for (const prop in checks) {
    response.details = {};
    const details = await checks[prop]();

    //log.info("details", details);

    try {
      response.details[prop] = parseDetail(details, prop);
    } catch(err) {
      response.details[prop] = {};
      response.details[prop].status = STATUS_ERR;
      response.details[prop].output = err.message;
    }
    
    overallStatus = worstStatus(overallStatus, response.details[prop].status);
  }

  response.status = overallStatus;
  return response;
}

function pickAllowedValues(obj) {
  const { componentId, componentType, metricValue, metricUnit, status, time, output }  = obj;
  return { componentId, componentType, metricValue, metricUnit, status, time, output };
}

function worstStatus (one, two) {
  let result = STATUS_OK;
  if (one === STATUS_WARN || two === STATUS_WARN) result = STATUS_WARN;
  if (one === STATUS_ERR || two === STATUS_ERR) result = STATUS_ERR;
  return result;
}

function parseDetail(rawDetails, prop) {
  const sanitized = pickAllowedValues(rawDetails);
  if (sanitized.status) {
    if (!isAllowedStatus(sanitized.status)) {
      throw new Error(`${prop} checker returned unknown status: ${sanitized.status}`);
    }
  }

  return sanitized;
}

function isAllowedStatus(status) {
  return ["fail", "warn", "pass"].includes(status);
}