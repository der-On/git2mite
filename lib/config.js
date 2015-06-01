var home = require('home');

var configPath = home.resolve('~/.git2mite/config.json');

try {
  var config = require(configPath);
}
catch (err) {
  if (!config) {
    throw new Error('Configuration file ' + configPath + ' does not exist or is unreadable.');
  }
}

var pkg = require('../package.json');

// accept any ssl certificates
if (config.acceptCerts) process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

config.mite.applicationName = pkg.name + 'v' + pkg.version + '(' + pkg.author + ')';

module.exports = config;
