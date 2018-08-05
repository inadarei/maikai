const log = require('metalogger')();

const STATUS_ERR = 'fail';
const STATUS_OK   = 'pass';
const STATUS_WARN = 'warn';

class HealthCheck {

  constructor(opts) {
    this.checks = [];
    this.opts = opts || {};
  }

  handler() {
    const healthURI = this.opts.path || process.env.NODE_HEALTH_ENDPOINT_PATH || "/health";
    return async (req, res, next) => {
  
      const requestPath = req.originalUrl;
  
      if (requestPath === healthURI) {
        const response = await this.healthResponse(this.opts);
        const httpCode = (response.status === STATUS_ERR ) ? 503 : 200;
  
        res.set('Content-Type', 'application/health+json');
        return res.status(httpCode).send(response);
      } else {
        return next();
      }
    };
  }

  addCheck (componentName, metricName, checkerPromise) {
    const key = `${componentName}:${metricName}`;
    this.checks[key] = checkerPromise;
  }

  async healthResponse(opts) {
    const response = {};
    let overallStatus = STATUS_OK;
    for (const prop in this.checks) {
      response.details = {};
      const details = await this.checks[prop]();
  
      //log.info("details", details);
  
      try {
        response.details[prop] = this.parseDetail(details, prop);
      } catch(err) {
        response.details[prop] = {};
        response.details[prop].status = STATUS_ERR;
        response.details[prop].output = err.message;
      }
      
      overallStatus = this.worstStatus(overallStatus, response.details[prop].status);
    }
  
    response.status = overallStatus;
    return response;
  }

  worstStatus (one, two) {
    let result = STATUS_OK;
    if (one === STATUS_WARN || two === STATUS_WARN) result = STATUS_WARN;
    if (one === STATUS_ERR || two === STATUS_ERR) result = STATUS_ERR;
    return result;
  }

  parseDetail(rawDetails, prop) {
    const sanitized = this.pickAllowedValues(rawDetails);
    if (sanitized.status) {
      if (!this.isAllowedStatus(sanitized.status)) {
        throw new Error(`${prop} checker returned unknown status: ${sanitized.status}`);
      }
    }
  
    return sanitized;
  }

  pickAllowedValues(obj) {
    const { componentId, componentType, metricValue, metricUnit, status, time, output }  = obj;
    return { componentId, componentType, metricValue, metricUnit, status, time, output };
  }

  isAllowedStatus(status) {
    return ["fail", "warn", "pass"].includes(status);
  }
}

module.exports = function(opts) {
  return new HealthCheck(opts);
};
