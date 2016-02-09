module.exports = function(app, auth) {
  var access = require('../access')
    , Map = require('../api/source')
    , Cache = require('../api/cache')
    , request = require('request')
    , WMSCapabilities = require('wms-capabilities')
    , sourceXform = require('../transformers/source')
    , cacheXform = require('../transformers/cache');

  var passport = auth.authentication.passport
    , authenticationStrategy = auth.authentication.authenticationStrategy;

  app.all('/api/maps*', passport.authenticate(authenticationStrategy));

  var validateSource = function(req, res, next) {
    var source = req.body;
    if (req.files && source.map) {
      source = JSON.parse(source.map);
    }
    req.newSource = source;
    if (typeof source.dataSources === 'string' || source.dataSources instanceof String) {
      req.newSource.dataSources = JSON.parse(source.dataSources);
    } else {
      req.newSource.dataSources = source.dataSources;
    }
    next();
  };

  var parseQueryParams = function(req, res, next) {
    var parameters = {};
    parameters.type = req.param('type');

    req.parameters = parameters;

    next();
  };

  // get all sources
  app.get(
    '/api/maps',
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

      Map.getAll(options, function(err, sources) {
        if (err) return next(err);
        sources = sourceXform.transform(sources);
        res.json(sources);
      });
    }
  );

  app.post(
    '/api/maps',
    access.authorize('CREATE_CACHE'),
    validateSource,
    function(req, res, next) {
      if (!req.files || !req.files.mapFile) return next();
      if (!req.is('multipart/form-data')) return next();
      if (!req.newSource.dataSources) {
        return res.sendStatus(400);
      }

      var sent = false;

      Map.create(req.newSource, req.files.mapFile, function(err, map) {
        if (sent) return;
        sent = true;
        // Map.getById(map.id, function(err, newMap) {
          if (err) return next(err);

          if (!map) return res.status(400).send();
          console.log('transformting the source in create', map);

          var response = sourceXform.transform(map);
          res.location(map._id.toString()).json(response);
        // });
      });
    }
  );

  // create a new source
  app.post(
    '/api/maps',
    access.authorize('CREATE_CACHE'),
    validateSource,
    function(req, res, next) {
      var sent = false;
      Map.create(req.newSource, function(err, map) {
        if (sent) return;
        sent = true;
        // Map.getById(map.id, function(err, newMap) {
        if (err) return next(err);

        if (!map) return res.status(400).send();
        console.log('transformting the source in create', map);

        var response = sourceXform.transform(map);
        res.location(map._id.toString()).json(response);
        // });
      });
    }
  );

  // Update a specific source
  app.put(
    '/api/maps/:sourceId',
    passport.authenticate(authenticationStrategy),
    access.authorize('CREATE_CACHE'),
    validateSource,
    function(req, res) {
      Map.update(req.param('sourceId'), req.newSource, function(err, updatedSource) {
        var response = sourceXform.transform(updatedSource);
        res.json(response);
      });
    }
  );

  app.get(
    '/api/maps/:sourceId/overviewTile',
    access.authorize('READ_CACHE'),
    validateSource,
    parseQueryParams,
    function (req, res, next) {
      var map = req.source;
      Map.getOverviewTile(map, function(err, tileStream) {
        if (err) return next(err);
        if (!tileStream) return res.status(404).send();

        tileStream.pipe(res);
      });
    }
  );

  function pullTile(req, res, next) {
    var source = req.source;
    Map.getTile(source, req.param('format'), req.param('z'), req.param('x'), req.param('y'), req.query, function(err, tileStream) {
      if (err) return next(err);
      if (!tileStream) return res.status(404).send();
      res.setHeader('Cache-Control', 'max-age=86400');
      tileStream.pipe(res);
    });
  }

  app.get(
    '/api/sources/:sourceIdNoProperties/:z/:x/:y.:format',
    access.authorize('READ_CACHE'),
    parseQueryParams,
    pullTile
  );

  app.get(
    '/api/maps/:sourceIdNoProperties/:z/:x/:y.:format',
    access.authorize('READ_CACHE'),
    parseQueryParams,
    pullTile
  );

  app.delete(
    '/api/maps/:sourceId/dataSources/:dataSourceId',
    access.authorize('CREATE_CACHE'),
    parseQueryParams,
    function(req, res) {
      new Map(req.source).deleteDataSource(req.param('dataSourceId'), function(err, source) {
        var sourceJson = sourceXform.transform(source);
        res.json(sourceJson);
      });
    }
  );

  // get source
  app.get(
    '/api/maps/:sourceId/caches',
    access.authorize('READ_CACHE'),
    parseQueryParams,
    function (req, res, next) {
      Cache.getCachesFromMapId(req.param('sourceId'), function(err, caches) {
        if (err) return next(err);

        caches = cacheXform.transform(caches);
        res.json(caches);
      });
    }
  );

  // get source
  app.get(
    '/api/maps/wmsFeatureRequest',
    access.authorize('READ_CACHE'),
    function (req, res) {
      console.log('wms feature request for ', req.param('wmsUrl'));
      global.DOMParser = require('xmldom').DOMParser;
      var WMSCapabilities = require('wms-capabilities');
      request.get({url: req.param('wmsUrl') + '?SERVICE=WMS&REQUEST=GetCapabilities', gzip: true}, function(error, response, body) {
        var json = new WMSCapabilities(body).toJSON();
        res.json(json);
      });
    }
  );

  // get source
  app.get(
    '/api/maps/discoverMap',
    access.authorize('READ_CACHE'),
    function (req, res) {
      console.log('figure out what this URL is ', req.param('url'));

      var sourceInformation = {
        url: req.param('url'),
        valid: false
      };

      request.head({url: req.param('url') + '/0/0/0.png', timeout: 5000}, function(err, response) {
        if (!err && response && response.statusCode === 200 && response.headers['content-type'].indexOf('image')===0) {
          sourceInformation.valid = true;
          sourceInformation.format = 'xyz';
          res.json(sourceInformation);
        } else {
          request.get({url: req.param('url') + '?f=pjson', timeout: 5000}, function(err, response, body) {
            var parsable = false;
            if (!err && response && response.statusCode === 200) {
              try {
                body = JSON.parse(body);
                parsable = true;
              } catch (e) {
                parsable = false;
              }
            }
            if (parsable) {
              sourceInformation.valid = true;
              sourceInformation.format = 'arcgis';
              sourceInformation.wmsGetCapabilities = body;
              res.json(sourceInformation);
            } else {
              request.head({url: req.param('url') + '/0/0/0', timeout: 5000}, function(err, response) {
                if (!err && response && response.statusCode === 200 && response.headers['content-type'].indexOf('image')===0) {
                  sourceInformation.valid = true;
                  sourceInformation.format = 'xyz';
                  sourceInformation.tilesLackExtensions = true;
                  res.json(sourceInformation);
                } else {

                  request.get({url: req.param('url'), json: true, timeout: 5000}, function(err, response, body){
                    if (!err && response && (response.statusCode === 200 || response.statusCode === 406)) {
                      sourceInformation.valid = true;
                    }
                    if (!err && response && response.statusCode === 200 && body && typeof body === "object") {
                      sourceInformation.format = 'geojson';
                      res.json(sourceInformation);
                    } else {
                      console.log('err from json request was ', err);
                      request.get({url: req.param('url') + '?SERVICE=WMS&REQUEST=GetCapabilities', gzip: false, timeout: 5000}, function(error, response, body) {
                        console.log('error', error);
                        if (!error && response && response.statusCode === 200) {
                          global.DOMParser = require('xmldom').DOMParser;
                          var json = new WMSCapabilities(body).toJSON();
                          if (json && json.version && json.version !== "") {
                            console.log('json.version', json.version);
                            sourceInformation.format = 'wms';
                            sourceInformation.wmsGetCapabilities = json;
                            res.json(sourceInformation);
                          } else {
                            res.json(sourceInformation);
                          }
                        } else {
                          request.get({url: req.param('url') + '?SERVICE=WMS&REQUEST=GetCapabilities', gzip: true, timeout: 5000}, function(error, response, body) {
                            console.log('error', error);
                            if (!error && response && response.statusCode === 200) {
                              global.DOMParser = require('xmldom').DOMParser;
                              var json = new WMSCapabilities(body).toJSON();
                              if (json && json.version && json.version !== "") {
                                console.log('json.version', json.version);
                                sourceInformation.format = 'wms';
                                sourceInformation.wmsGetCapabilities = json;
                                res.json(sourceInformation);
                              } else {
                                res.json(sourceInformation);
                              }
                            } else {
                              res.json(sourceInformation);
                            }
                          });
                        }
                      });
                    }
                  });
                }
              });
            }
          });
        }
      });
    }
  );

  // get source
  app.get(
    '/api/maps/:sourceId',
    access.authorize('READ_CACHE'),
    parseQueryParams,
    function (req, res) {
      var sourceJson = sourceXform.transform(req.source);
      res.json(sourceJson);
    }
  );

  // Delete a specific source
  app.delete(
    '/api/maps/:sourceId',
    passport.authenticate(authenticationStrategy),
    access.authorize('DELETE_CACHE'),
    function(req, res, next) {
      new Map(req.source).delete(function(err) {
        if (err) return next(err);
        res.status(200);
        res.json(req.source);
      });
    }
  );
};
