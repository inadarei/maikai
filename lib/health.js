const STATUS_ERR = 'fail';
const STATUS_OK   = 'pass';
const STATUS_WARN = 'warn';

class HealthCheck {

  constructor(opts) {
    this.checks = [];
    this.opts = opts || {};
  }

  /**
   * Figures out what URI path the endpoint should be mapped to, by checking:
   * 1. Explicit opts object, that the checker was initialized with, if any
   * 2. Env variable `NODE_HEALTH_ENDPOINT_PATH`
   * 3. Defaults to "/health"
   */
  getHealthUri() {
    return this.opts.path || process.env.NODE_HEALTH_ENDPOINT_PATH || "/health";
  }
  /**
   * Middleware handler for Express.js
   */
  express() {
    return async (req, res, next) => {
  
      const requestPath = req.originalUrl;
  
      if (requestPath !== this.getHealthUri()) return next();

      const response = await this.healthResponse(this.opts);
      const httpCode = (response.status === STATUS_ERR ) ? 503 : 200;

      res.set('Content-Type', 'application/health+json');
      return res.status(httpCode).send(response);
    };
  }

  koa() {
    return async (ctx, next) => {
  
      const requestPath = ctx.request.originalUrl;
  
      if (requestPath !== this.getHealthUri()) return next();

      const response = await this.healthResponse(this.opts);
      const httpCode = (response.status === STATUS_ERR ) ? 503 : 200;

      
      ctx.response.status = httpCode;
      ctx.body= response;
      // Make sure this comes after ctx.body : https://github.com/koajs/koa/issues/1120
      ctx.set('Content-Type', 'application/health+json; charset=utf-8');
    };
  }  

  http() {
    return (request, response) => {
      const requestPath = request.url;
      if (requestPath !== this.getHealthUri()) return false;

      (async () => {
        const responseContent = await this.healthResponse(this.opts);
        const httpCode = (responseContent.status === STATUS_ERR ) ? 503 : 200;
        response.writeHead(httpCode, { 'Content-Type': 'application/health+json; charset=utf-8' });
        response.end(JSON.stringify(responseContent));
      })();

      return true;
    };
  }

  /**
   * Add a new health checking routine - for a metric, on a component
   *
   * @param {string} componentName - name of the component whose health is being
   * reported
   * @param {string} metricName - name of the metric on a component the value of
   * which is being reported
   * @param {AsyncFunction or Promise} checkExecutor - an async function to call
   * for getting values or a Promise returning values.
   * @param {int} minCacheMs - min cache duration in milliseconds.
   */
  addCheck (componentName, metricName, checkExecutor, minCacheMs=0) {
    const key = `${componentName}:${metricName}`;
    const newCheck = {};
    newCheck.key = key;

    // checkExecutor can be an async function or a promise object
    if (typeof checkExecutor === 'function' ) { 
      newCheck.executor = checkExecutor; // we need to return an unresolved promise from async fun
      newCheck.executorType = 'func';
    } else if (typeof checkExecutor === 'object' && typeof checkExecutor.then === 'function') {
      newCheck.executor = checkExecutor;
      newCheck.executorType = 'promise';
    } else {
      throw new Error(`Callback for ${key} must be a promise or an async function`);
    }
    newCheck.minCacheMs = minCacheMs;
    this._addCheck(newCheck);
  }

  async healthResponse(opts) {
    const response = {};
    let overallStatus = STATUS_OK;

    const currRun = this.getChecksForCurrentRun();
    const results = await Promise.all(currRun.promises);
    const currResponses = {}; 
    for (let idx = 0; idx < results.length; idx++) {
      const nowTs = Date.now();
      const ts = new Date(nowTs).toISOString();

      const result = results[idx];
      if (!result.time) result.time = ts;
      //result.time = ts;
      const key = currRun.keys[idx];
      currResponses[key] = result;
      // refresh cache
      this._setCheckProp(key, "lastRun", nowTs);
      this._setCheckProp(key, "cachedValue", result);
    }

    response.details = {};
    this.checks.map(check => {

      const savedCheck = this._getCheck(check.key);
      const value = savedCheck.cachedValue;
        
      try {
        response.details[check.key] = this.parseDetail(value, check.key);
      } catch (err) {
        response.details[check.key] = {};
        response.details[check.key].status = STATUS_ERR;
        response.details[check.key].output = err.message;
      }
      overallStatus = this.worstStatus(overallStatus, response.details[check.key].status);

    });

    response.status = overallStatus;
    return response;
  }

  /**
   * Get only checks that should execute in current run, taking caching
   * instructions into consideration
   * 
   */
  getChecksForCurrentRun() {
    const resp = {};
    const currRun = this.checks.filter(check => {
        const lastRun = check.lastRun || -1;
        const isLastLookupStale = (Date.now() - lastRun) > check.minCacheMs;
        return isLastLookupStale;
    });

    resp.promises = currRun.map(check => {
      if (check.executorType === 'promise') {
        return check.executor;
      } else {
        return check.executor(); // an async function needs to return unresolved Promise
      }
    });
    resp.keys = currRun.map(check => check.key);

    return resp;
  }

  worstStatus (one, two) {
    let result = STATUS_OK;
    if (one === STATUS_WARN || two === STATUS_WARN) result = STATUS_WARN;
    if (one === STATUS_ERR || two === STATUS_ERR) result = STATUS_ERR;
    return result;
  }

  parseDetail(rawDetails, prop) {
    const sanitized = this.pickAllowedValues(rawDetails);
    if (!sanitized.status) {
      throw new Error(`Status for ${prop} may not be missing`);
    }

    if (!this.isAllowedStatus(sanitized.status)) {
      throw new Error(`${prop} checker returned unknown status: ${sanitized.status}`);
    }
  
    return sanitized;
  }

  pickAllowedValues(obj) {
    const allowedValues = ["componentId", "componentType", "metricValue", 
                           "metricUnit", "status", "time", "output"];
    
    const newObj = {};
    for (const prop of Object.keys(obj)) {
      if (obj.hasOwnProperty(prop) && allowedValues.includes(prop)) {
        newObj[prop] = obj[prop];
      }
    }
    return newObj;
  }

  isAllowedStatus(status) {
    return ["fail", "warn", "pass"].includes(status);
  }

  /**
   * Get a check object by its key
   * @param {*} key 
   * @return may return undefined if a check with this key doesn't exist
   */
  _getCheck(key) {
    const found = this.checks.find(el => el.key === key);
    return found;
  }

  /**
   * Add a new check to the internal checks array
   * @param {*} aCheck 
   */
  _addCheck(aCheck) {
    if (!aCheck.key) {
      throw new Error("Cannot add a check with an empty key");
    }

    const foundIndex = this.checks.findIndex(el => el.key === aCheck.key);
    if (foundIndex !== -1) {
      throw new Error("Calling identical addCheck() multiple times is not allowed");
    }
    this.checks.push(aCheck);
  }

  /**
   * Set a value of a property on an existing healthcheck
   * @param {*} aCheck 
   * @param {*} propName 
   * @param {*} propValue 
   */
  _setCheckProp(checkKey, propName, propValue) {
    const foundIndex = this.checks.findIndex(el => el.key === checkKey);
    if (foundIndex === -1) {
      throw new Error(`Cannot set a value on a check with a nonexistent key ${checkKey}`);
    }

    this.checks[foundIndex][propName] = propValue;
  }
}

module.exports = function(opts) {
  return new HealthCheck(opts);
};
