module.exports = function(app, auth) {
  var access = require('../access')
    , api = require('../api')
    , fs = require('fs-extra')
    , config = require('../config.json')
    , cacheXform = require('../transformers/cache');

  var passport = auth.authentication.passport
    , authenticationStrategy = auth.authentication.authenticationStrategy;

  app.all('/api/caches*', passport.authenticate(authenticationStrategy));

  var validateCache = function(req, res, next) {
    var cache = req.body;

    req.newCache = cache;
    next();
    //
    // if (!observation.type || observation.type != 'Feature' ) {
    //   return res.status(400).send("cannot create observation 'type' param not specified, or is not set to 'Feature'");
    // }
    //
    // if (!observation.geometry) {
    //   return res.status(400).send("cannot create observation 'geometry' param not specified");
    // }
    //
    // if (!observation.properties || !observation.properties.timestamp) {
    //   return res.status(400).send("cannot create observation 'properties.timestamp' param not specified");
    // }
    //
    // Team.teamsForUserInEvent(req.user, req.event, function(err, teams) {
    //   if (err) return next(err);
    //
    //   if (teams.length === 0) {
    //     return res.status(403).send('Cannot submit an observation for an event that you are not part of.');
    //   }
    //
    //   observation.properties.timestamp = moment(observation.properties.timestamp).toDate();
    //
    //   var state = {name: 'active'};
    //   if (userId) state.userId = userId;
    //   observation.states = [state];
    //
    //   req.newObservation = {
    //     type: observation.type,
    //     geometry: observation.geometry,
    //     properties: observation.properties,
    //     states: [state],
    //     teamIds: teams.map(function(team) { return team._id; })
    //   };
    //
    //   var userId = req.user ? req.user._id : null;
    //   if (userId) req.newObservation.userId = userId;
    //
    //   var deviceId = req.provisionedDeviceId ? req.provisionedDeviceId : null;
    //   if (deviceId) req.newObservation.deviceId = deviceId;
    //
    //   next();
    // });
  }

  var parseQueryParams = function(req, res, next) {
    var parameters = {};
    parameters.type = req.param('type');

    req.parameters = parameters;

    next();
  }

  // get all caches
  app.get(
    '/api/caches',
    access.authorize('READ_CACHE'),
    parseQueryParams,
    function (req, res, next) {
      var options = {

      };

      new api.Cache().getAll(options, function(err, caches) {
        if (err) return next(err);

        var caches = cacheXform.transform(caches);
        res.json(caches);
      });

    }
  );

  // create a new cache
  app.post(
    '/api/caches',
    access.authorize('CREATE_CACHE'),
    validateCache,
    function(req, res, next) {

      new api.Cache().create(req.newCache, function(err, newCache) {
        if (err) return next(err);

        if (!newCache) return res.status(400).send();

        var response = cacheXform.transform(newCache);
        res.location(newCache._id.toString()).json(response);
      });
    }
  );

  app.get(
    '/api/caches/:cacheId/:z/:x/:y.png',
    access.authorize('READ_CACHE'),
    parseQueryParams,
    function (req, res, next) {
      var options = {

      };

      var cache = req.cache;
      if (!fs.existsSync(config.server.cacheDirectory.path + '/' + cache._id + "/" + req.param('z') + "/" + req.param('x') + "/" + req.param('y') + ".png")) {
        res.send(404);
        next();
      } else {
        res.writeHead(200, {
          'Content-Type': 'image/png'
        });
      }

      var stream = fs.createReadStream(config.server.cacheDirectory.path + '/' + cache._id + "/" + req.param('z') + "/" + req.param('x') + "/" + req.param('y') + ".png");
      stream.on('open', function() {
        stream.pipe(res);
      });
      stream.on('error', function(err) {
        next(err);
      });
    }
  );
}
