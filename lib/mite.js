var mite = require('mite-api');

module.exports = function (config) {
  var miteClient = mite(config);

  // extend mite client with getAllServices
  miteClient.getAllServices = function (params, cb) {
    var data = [];
    if (!params) {
      params = {};
    }
    if (cb == null) {
      cb = null;
    }
    if ('function' === typeof params) {
      cb = params;
      params = {};
    }
    if (!params.page) {
      params.page = 1;
    }
    if (!params.limit) {
      params.limit = 100;
    }

    function _cb(err, results) {
      if (err) {
        cb(err, data);
        return;
      }

      data = data.concat(results);

      if (results.length === params.limit) {
        params.page++;
        miteClient.getServices(params, _cb);
      } else {
        cb(null, data);
      }
    }

    miteClient.getServices(params, _cb);
  };

  // extend mite client with getAllArchivedServices
  miteClient.getAllArchivedServices = function (params, cb) {
    var data = [];
    if (!params) {
      params = {};
    }
    if (cb == null) {
      cb = null;
    }
    if ('function' === typeof params) {
      cb = params;
      params = {};
    }
    if (!params.page) {
      params.page = 1;
    }
    if (!params.limit) {
      params.limit = 100;
    }

    function _cb(err, results) {
      if (err) {
        cb(err, data);
        return;
      }

      data = data.concat(results);

      if (results.length === params.limit) {
        params.page++;
        miteClient.getArchivedServices(params, _cb);
      } else {
        cb(null, data);
      }
    }

    miteClient.getArchivedServices(params, _cb);
  };

  return miteClient;
};
