module.exports = function(app, security) {
  var fs = require('fs-extra')
    , api = require('../api')
    , models = require('mapcache-models')
    , Role = models.Role
    , Cache = models.Cache
    , Source = models.Source
    , log = require('winston');

  app.get('/api', function(req, res) {
    log.info('get api info');
    var config = app.get('config');
    res.json(config.api);
  });

  // Dynamically import all routes
  fs.readdirSync(__dirname).forEach(function(file) {
    if (file[0] === '.' || file === 'index.js' || file.indexOf('.js') === -1) return;
    var route = file.substr(0, file.indexOf('.'));
    require('./' + route)(app, security);
  });

  // add regex function to parse params
  app.param(function(name, fn) {
    if (fn instanceof RegExp) {
      return function(req, res, next, val) {
        var captures;
        if (captures = fn.exec(String(val))) {
          req.params[name] = captures;
          next();
        } else {
          next('route');
        }
      };
    }
  });

  // Grab the user for any endpoint that uses userId
  app.param('userId', /^[0-9a-f]{24}$/); //ensure userId is a mongo id
  app.param('userId', function(req, res, next, userId) {
    new api.User().getById(userId, function(err, user) {
      if (!user) return res.status(404).send('User not found');
      req.userParam = user;
      next();
    });
  });

  // Grab the role for any endpoint that uses roleId
  app.param('roleId', function(req, res, next, roleId) {
      Role.getRoleById(roleId, function(err, role) {
        if (!role) return res.status(404).send('Role ' + roleId + ' not found');
        req.role = role;
        next();
      });
  });

  // Grab the cache for any endpoint that uses cacheId
  app.param('cacheId', function(req, res, next, cacheId) {
      Cache.getCacheById(cacheId, function(err, cache) {
        if (!cache) return res.status(404).send('Cache ' + cacheId + ' not found');
        if (cache.permission === 'USER') {
          if (cache.userId.toString() !== req.user._id.toString()) {
            return res.status(404).send('Cache ' + cacheId + ' not found');
          }
        }
        req.cache = cache;
        next();
      });
  });

  // Grab the cache for any endpoint that uses cacheId
  app.param('sourceId', function(req, res, next, sourceId) {
    if (req.param('noProperties')) {
      Source.getSourceNoProperties(sourceId, function(err, source) {
        if (!source) return res.status(404).send('Source ' + sourceId + ' not found');
        req.source = source;
        next();
      });
    } else {
      Source.getSourceById(sourceId, function(err, source) {
        if (!source) return res.status(404).send('Source ' + sourceId + ' not found');
        if (source.permission === 'USER') {
          if (source.userId.toString() !== req.user._id.toString()) {
            return res.status(404).send('Source ' + sourceId + ' not found');
          }
        }
        req.source = source;
        next();
      });
    }
  });

  // Grab the cache for any endpoint that uses cacheId
  app.param('sourceIdNoProperties', function(req, res, next, sourceId) {
      Source.getSourceNoProperties(sourceId, function(err, source) {
        if (!source) return res.status(404).send('Source ' + sourceId + ' not found');
        req.source = source;
        next();
      });
  });
};
