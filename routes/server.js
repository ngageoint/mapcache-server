module.exports = function(app, auth) {
  var access = require('../access')
    , api = require('../api')
    , fs = require('fs-extra')
    , config = require('../config.json')
    , serverXform = require('../transformers/server');

  var passport = auth.authentication.passport
    , authenticationStrategy = auth.authentication.authenticationStrategy;

  app.all('/api/server*', passport.authenticate(authenticationStrategy));


  app.get(
  	'/api/server',
  	access.authorize('READ_CACHE'),
  	function (req, res, next) {
      new api.Server().getInfo(function(err, server) {
        if (err) return next(err);

        var server = serverXform.transform(server);
        res.json(server);
      });
  	}
  );

  app.get(
  	'/api/server/maxCacheSize',
  	access.authorize('READ_CACHE'),
  	function (req, res, next) {
      new api.Server().getMaxCacheSize(function(err, server) {
        if (err) return next(err);

        res.json(server);
      });
  	}
  );
}
