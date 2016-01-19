var express = require("express")
  , bodyParser = require('body-parser')
  , multer = require('multer')
  , path = require('path')
  , mongoose = require('mongoose')
  , fs = require('fs-extra')
  , log = require('winston')
  , config = require('mapcache-config');

// Configuration of the mapcache Express server
var app = express();

app.use(function(req, res, next) {
  req.getRoot = function() {
    return req.protocol + "://" + req.get('host');
  }

  req.getPath = function() {
    return req.getRoot() + req.path;
  }

  return next();
});

// Configure authentication
var authentication = require('./authentication')(config.api.authentication.strategy);
console.log('Authentication: ' + authentication.loginStrategy);

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
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
app.use(function(err, req, res, next) {
  console.error(err.message);
  console.error(err.stack);
  res.send(500, 'Internal server error, please contact MapCahe administrator.');
});

// Configure routes
require('./routes')(app, {authentication: authentication});

module.exports = app;
