module.exports = function(app, auth) {
  var access = require('../access')
    , Cache = require('../api/cache')
    , turf = require('turf')
    , log = require('mapcache-log')
    , xyzTileUtils = require('xyz-tile-utils')
    , cacheXform = require('../transformers/cache');

  var passport = auth.authentication.passport
    , authenticationStrategy = auth.authentication.authenticationStrategy;

  app.all('/api/caches*', passport.authenticate(authenticationStrategy));

  var validateCache = function(req, res, next) {
    var cache = req.body;
    if (cache.id) {
      cache._id = cache.id;
    }
    if (!cache.geometry) {
      return res.status(400).send('geometry is required');
    }
    req.newCache = cache;
    req.newCache.permission = req.newCache.permission || 'MAPCACHE';
    req.newCache.userId = req.user ? req.user._id : null;
    next();
  };

  var parseQueryParams = function(req, res, next) {
    var parameters = {};
    parameters.type = req.param('type');

    req.parameters = parameters;

    next();
  };

  app.get(
    '/api/caches/:cacheId/generate',
    access.authorize('EXPORT_CACHE'),
    function (req, res, next) {
    	var format = req.param('format');
      var sent = false;
    	console.log('create cache format ' + format + ' for cache ' + req.cache.name);
      req.cache.minZoom = req.param('minZoom') || req.cache.minZoom;
      req.cache.maxZoom = req.param('maxZoom') || req.cache.maxZoom;
      new Cache(req.cache).createFormat(format, function(err, newCache) {
      }, function(err, newCache) {
        if (sent) return;
        if (!err) {
          sent = true;
          return res.sendStatus(202);
        }
        next(err);
      });
  	}
  );

  // get all caches
  app.get(
    '/api/caches',
    access.authorize('READ_CACHE'),
    parseQueryParams,
    function (req, res, next) {
      var options = {
        userId: req.user._id
      };

      Cache.getAll(options, function(err, caches) {
        if (err) return next(err);

        caches = cacheXform.transform(caches);
        res.json(caches);
      });

    }
  );

  // create a new cache
  app.post(
    '/api/caches',
    access.authorize('CREATE_CACHE'),
    validateCache,
    function(req, res) {
      var called = false;
      Cache.create(req.newCache, function(err, newCache) {
        if (err) {
          console.log('Error creating cache', err);
        }
        if (newCache.id && !called) {
          called = true;
          if (err) return res.status(400).send(err.message);

          if (!newCache) return res.status(400).send();

          var response = cacheXform.transform(newCache);
          res.location(newCache.id.toString()).json(response);
        }
      }, function(err, newCache) {
        if (newCache.id && !called) {
          called = true;
          if (err) return res.status(400).send(err.message);

          if (!newCache) return res.status(400).send();

          var response = cacheXform.transform(newCache);
          res.location(newCache.id.toString()).json(response);
        }
      });
    }
  );

  // restart cache download
  app.get(
    '/api/caches/:cacheId/restart',
    access.authorize('CREATE_CACHE'),
    function(req, res) {

      new Cache(req.cache).restart(req.param('format'), function(err, newCache) {
        if (err) return res.status(400).send(err.message);

        if (!newCache) return res.status(400).send();

        var response = cacheXform.transform(newCache);
        res.location(newCache.id.toString()).json(response);
      });
    }
  );

  app.get(
    '/api/caches/:cacheId/:z/:x/:y.:format',
    access.authorize('READ_CACHE'),
    parseQueryParams,
    function (req, res, next) {
      new Cache(req.cache).getTile(req.param('format'), req.param('z'), req.param('x'), req.param('y'), req.query, function(err, tileStream) {
        if (err) return next(err);
        if (!tileStream) return res.status(404).send();
        tileStream.pipe(res);
      });
    }
  );

  app.get(
    '/api/caches/:cacheId/overviewTile',
    access.authorize('READ_CACHE'),
    parseQueryParams,
    function (req, res) {
      if (!req.cache.geometry) return res.status(404).send();
      var xyz = xyzTileUtils.getXYZFullyEncompassingExtent(turf.bbox(req.cache.geometry), req.cache.minZoom, req.cache.maxZoom);
      new Cache(req.cache).getTile('png', xyz.z, xyz.x, xyz.y, function(err, tileStream) {
        if (err) {
          log.error('Error getting overview tile for cache %s', req.cache.id, err);
          return res.status(404).send();
        }
        if (!tileStream) return res.status(404).send();
        tileStream.pipe(res);
      });
    }
  );

  app.get(
  	'/api/caches/:cacheId/:format',
  	access.authorize('EXPORT_CACHE'),
  	function (req, res) {
    	var minZoom = req.param('minZoom') ? parseInt(req.param('minZoom')) : req.cache.minZoom;
    	var maxZoom = req.param.maxZoom ? parseInt(req.param('maxZoom')) : req.cache.maxZoom;
    	var format = req.param('format');
    	console.log('export zoom ' + minZoom + " to " + maxZoom + " in format " + format);
      new Cache(req.cache).getData(format, minZoom, maxZoom, function(err, status) {
        if (err) {
          return res.send(400, err);
        }
        if (status.creating) {
          return res.sendStatus(202);
        }
        if (status.stream) {
          res.attachment(req.cache.name + '_' + format + status.extension);
          status.stream.pipe(res);
        }
      });
  	}
  );

  // get cache
  app.get(
    '/api/caches/:cacheId',
    access.authorize('READ_CACHE'),
    parseQueryParams,
    function (req, res) {
      var cacheJson = cacheXform.transform(req.cache);
      res.json(cacheJson);
    }
  );

  // Delete a specific cache format
  app.delete(
    '/api/caches/:cacheId/:format',
    passport.authenticate(authenticationStrategy),
    access.authorize('DELETE_CACHE'),
    function(req, res, next) {
      new Cache(req.cache).deleteFormat(req.param('format'), function(err) {
        if (err) return next(err);
        res.status(200);
        res.json(req.cache);
      });
    }
  );

  // Delete a specific cache
  app.delete(
    '/api/caches/:cacheId',
    passport.authenticate(authenticationStrategy),
    access.authorize('DELETE_CACHE'),
    function(req, res, next) {
      new Cache(req.cache).delete(function(err) {
        if (err) return next(err);
        res.status(200);
        res.json(req.cache);
      });
    }
  );
};
