require('es6-promise').polyfill();
require('es6-promise-series');

module.exports.gitlab = require('./lib/gitlab');
module.exports.github = require('./lib/github');
