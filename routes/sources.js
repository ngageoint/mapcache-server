module.exports = function(app, auth) {
  var access = require('../access')
    , api = require('../api')
    , fs = require('fs-extra')
    , config = require('../config.json')
    , sourceXform = require('../transformers/source')
    , sourceProcessor = require('../api/sourceTypes');

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
        //var sources = sourceXform.transform({}, sources);
        res.json(sources);
      });
    }
  );

  app.post(
    '/api/sources',
    access.authorize('CREATE_CACHE'),
    validateSource,
    function(req, res, next) {
      if (!req.is('multipart/form-data')) return next();

      // console.log(req);

      new api.Source().import(req.newSource, req.files.sourceFile, function(err, newSource) {
        if (err) return next(err);

        if (!newSource) return res.status(400).send();
        // console.log('new source is', newSource);

        var response = sourceXform.transform(newSource);
        // console.log('response is', response);
        res.location(newSource._id.toString()).json(response);
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

  app.get(
    '/api/sources/:sourceId/:z/:x/:y.png',
    access.authorize('READ_CACHE'),
    parseQueryParams,
    function (req, res, next) {
      var options = {

      };

      var source = req.source;

      sourceProcessor.getTile(source, req.param('z'), req.param('x'), req.param('y'), function(err, tileStream) {
        if (err) return next(err);
        if (!tileStream) return res.status(404).send();

        tileStream.pipe(res);
      });
    }
  );

  // get source
  app.get(
    '/api/sources/:sourceId',
    access.authorize('READ_CACHE'),
    parseQueryParams,
    function (req, res, next) {
      var sourceJson = sourceXform.transform(req.source);
      res.json(sourceJson);
    }
  );

  // Delete a specific source
  app.delete(
    '/api/sources/:sourceId',
    passport.authenticate(authenticationStrategy),
    access.authorize('DELETE_CACHE'),
    function(req, res, next) {
      new api.Source().delete(req.source, function(err) {
        if (err) return next(err);
        res.status(200);
        res.json(req.source);
      });
    }
  );
}
