module.exports = function(app, auth) {
  var access = require('../access')
    , api = require('../api')
    , fs = require('fs-extra')
    , path = require('path')
    , request = require('request')
    , config = require('../config.json')
    , sourceXform = require('../transformers/source')
    , sourceProcessor = require('../api/sources');

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
      console.log('req.files', req.files);
      if (!req.files.sourceFile) {
        console.log('no files');
        return res.sendStatus(400);
      }
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

  // Update a specific source
  app.put(
    '/api/sources/:sourceId',
    passport.authenticate(authenticationStrategy),
    access.authorize('CREATE_CACHE'),
    validateSource,
    function(req, res, next) {
      new api.Source().update(req.param('sourceId'), req.newSource, function(err, updatedSource) {
        var response = sourceXform.transform(updatedSource);
        res.json(response);
      });
    }
  );

  app.get(
    '/api/sources/:sourceId/:z/:x/:y.:format',
    access.authorize('READ_CACHE'),
    parseQueryParams,
    function (req, res, next) {
      var source = req.source;

      sourceProcessor.getTile(source, req.param('format'), req.param('z'), req.param('x'), req.param('y'), req.query, function(err, tileStream) {
        if (err) return next(err);
        if (!tileStream) return res.status(404).send();

        tileStream.pipe(res);
      });
    }
  );

  app.get(
    '/api/sources/:sourceId/features',
    access.authorize('READ_CACHE'),
    parseQueryParams,
    function (req, res, next) {
      var source = req.source;

      sourceProcessor.getFeatures(source, req.param('west'), req.param('south'), req.param('east'), req.param('north'), req.param('zoom'), function(err, features) {
        if (err) return next(err);
        if (!features) return res.status(200).send();
        res.json(features);
      });
    }
  );

  app.get(
    '/api/sources/:sourceId/:format',
    access.authorize('READ_CACHE'),
    parseQueryParams,
    function (req, res, next) {
      var source = req.source;
      sourceProcessor.getData(source, req.param('format'), function(err, data) {
        if (data.file) {
          console.log('streaming', data.file);
          var stream = fs.createReadStream(data.file);
          stream.pipe(res);
        } else if (data.stream) {
          data.stream.pipe(res);
        }
      });
    }
  );

  // get source
  app.get(
    '/api/sources/wmsFeatureRequest',
    access.authorize('READ_CACHE'),
    function (req, res, next) {
      console.log('wms feature request for ', req.param('wmsUrl'));
      var DOMParser = global.DOMParser = require('xmldom').DOMParser;
      var WMSCapabilities = require('wms-capabilities');
      var req = request.get({url: req.param('wmsUrl') + '?SERVICE=WMS&REQUEST=GetCapabilities'}, function(error, response, body) {
        try {
          var json = new WMSCapabilities(body).toJSON();
          res.json(json);
        } catch (e) {
          res.sendStatus(200);
        }
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
