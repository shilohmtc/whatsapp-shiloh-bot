const { AsyncLocalStorage } = require('node:async_hooks');

const requestLogStorage = new AsyncLocalStorage();

function runWithRequestLog(log, callback) {
  if (typeof callback !== 'function') throw new TypeError('request log callback is required');
  if (!log) return callback();
  return requestLogStorage.run(log, callback);
}

function currentRequestLog() {
  return requestLogStorage.getStore() || null;
}

module.exports = {
  runWithRequestLog,
  currentRequestLog,
};
