var express = require("express")
  , bodyParser = require('body-parser')
  , multer = require('multer')
  , path = require('path')
  , mongoose = require('mongoose')
  , fs = require('fs-extra')
  , log = require('winston')
  , knex = require('./db/knex')
  , config = require('./config.js');

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

// Configure authentication
var authentication = require('./authentication')(config.api.authentication.strategy);
console.log('Authentication: ' + authentication.loginStrategy);

// Configuration of the MAGE Express server
var app = express();
var mongodbConfig = config.server.mongodb;

var mongoUri = "mongodb://" + mongodbConfig.host + "/" + mongodbConfig.db;
mongoose.connect(mongoUri, {server: {poolSize: mongodbConfig.poolSize}}, function(err) {
  if (err) {
    console.log('Error connecting to mongo database, please make sure mongodb is running...');
    throw err;
  }
});
mongoose.set('debug', true);

app.use(function(req, res, next) {
  req.getRoot = function() {
    return req.protocol + "://" + req.get('host');
  }

  req.getPath = function() {
    return req.getRoot() + req.path;
  }

  return next();
});

app.set('config', config);
app.enable('trust proxy');

app.use(function(req, res, next) {
  req.getRoot = function() {
    return req.protocol + "://" + req.get('host');
  }
  return next();
});
app.use(require('body-parser').json({limit: '50mb'}));
app.use(require('body-parser').urlencoded({limit: '50mb', extended: true}));
app.use(require('body-parser')({ keepExtensions: true}));
app.use(require('method-override')());
app.use(require('multer')());
app.use(authentication.passport.initialize());
app.use(express.static(path.join(__dirname, process.env.NODE_ENV === 'production' ? 'public/dist' : 'public')));
app.use('/api/swagger', express.static('./public/vendor/swagger-ui/'));
app.use('/private',
  authentication.passport.authenticate(authentication.authenticationStrategy),
  express.static(path.join(__dirname, 'private')));
app.use(function(err, req, res, next) {
  console.error(err.message);
  console.error(err.stack);
  res.send(500, 'Internal server error, please contact MapCahe administrator.');
});

// Configure routes
require('./routes')(app, {authentication: authentication});

// Launches the Node.js Express Server
var port = argv.port;
app.listen(port);
console.log('MapCache Server: Started listening on port ' + port);
