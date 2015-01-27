#!/usr/bin/env node

var jake = require('jake');

var args = process.argv.slice(2);

jake.run.apply(jake, args);