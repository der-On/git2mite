#!/usr/bin/env node

var path = require('path');
var jake = require('jake');

var args = process.argv.slice(2);
args.unshift(path.join(__dirname, 'Jakefile'));
args.unshift('--jakefile');

jake.run.apply(jake, args);