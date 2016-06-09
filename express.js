var express = require("express")
  , path = require('path')
  , cookieParser = require('cookie-parser')
  , config = require('mapcache-config');

// Configuration of the mapcache Express server
var app = express();

app.use(function(req, res, next) {
  req.getRoot = function() {
    return req.protocol + "://" + req.get('host');
  };

  req.getPath = function() {
    return req.getRoot() + req.path;
  };

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
  };
  return next();
});
app.use(cookieParser());
app.use(require('body-parser').json({limit: '50mb'}));
app.use(require('body-parser').urlencoded({limit: '50mb', extended: true}));
app.use(require('body-parser')({ keepExtensions: true}));
app.use(require('method-override')());
app.use(require('multer')());
app.use(authentication.passport.initialize());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api/swagger', express.static('./public/vendor/swagger-ui/'));
app.use('/private',
  authentication.passport.authenticate(authentication.authenticationStrategy),
  express.static(path.join(__dirname, 'private')));
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
app.use(function(err, req, res, leaveThisHereSoExpressWillTreatThisAsAnErrorFunctionEvenThoughItIsNotUsed) { //jshint ignore: line
  console.error(err.message);
  console.error(err.stack);
  res.status(500).send('Internal server error, please contact mapcache administrator.');
});

// Configure routes
require('./routes')(app, {authentication: authentication});

module.exports = app;
