var express = require("express")
  , bodyParser = require('body-parser')
  , multer = require('multer')
  , path = require('path')
  , mongoose = require('mongoose')
  , fs = require('fs-extra')
  , log = require('winston')
  , config = require('mapcache-config');

log.remove(log.transports.Console);
log.add(log.transports.Console, {
  timestamp: true,
  level: 'debug',
  colorize: true
});

mongoose.Error.messages.general.required = "{PATH} is required.";

log.info('Starting mapcache');

var yargs = require("yargs")
  .usage("Usage: $0 --port [number]")
  .describe('port', 'Port number that MapCache node server will run on.')
  .default('port', 4242);
var argv = yargs.argv;
if (argv.h || argv.help) return yargs.showHelp();

var mongodbConfig = config.server.mongodb;

var mongoUri = "mongodb://" + mongodbConfig.host + "/" + mongodbConfig.db;
mongoose.connect(mongoUri, {server: {poolSize: mongodbConfig.poolSize}}, function(err) {
  if (err) {
    console.log('Error connecting to mongo database, please make sure mongodb is running...');
    throw err;
  }
});
mongoose.set('debug', true);

var app = require('./express.js');

// Launches the Node.js Express Server
var port = argv.port;
app.listen(port);
console.log('MapCache Server: Started listening on port ' + port);
