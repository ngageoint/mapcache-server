module.exports = function(app, auth) {
  var access = require('../access')
    , api = require('../api')
    , config = require('../config.json')
    , sourceXform = require('../transformers/source');

  var passport = auth.authentication.passport
    , authenticationStrategy = auth.authentication.authenticationStrategy;

  app.all('/api/sources*', passport.authenticate(authenticationStrategy));

  var validateSource = function(req, res, next) {
    var source = req.body;

    req.newSource = source;
    next();
  }

  var parseQueryParams = function(req, res, next) {
    var parameters = {};
    parameters.type = req.param('type');

    req.parameters = parameters;

    next();
  }

  // get all sources
  app.get(
    '/api/sources',
    access.authorize('READ_CACHE'),
    parseQueryParams,
    function (req, res, next) {
      var options = { };
      if (req.param('url')) {
        options.url = req.param('url');
      }
      if (req.param('format')) {
        options.format = req.param('format');
      }

      new api.Source().getAll(options, function(err, sources) {
        if (err) return next(err);

        var sources = sourceXform.transform(sources);
        res.json(sources);
      });
    }
  );

  // create a new source
  app.post(
    '/api/sources',
    access.authorize('CREATE_CACHE'),
    validateSource,
    function(req, res, next) {

      new api.Source().create(req.newSource, function(err, newSource) {
        if (err) return next(err);

        if (!newSource) return res.status(400).send();

        var response = sourceXform.transform(newSource);
        res.location(newSource._id.toString()).json(response);
      });
    }
  );
}
