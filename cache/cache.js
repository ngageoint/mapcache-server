var FeatureModel = require('mapcache-models').Feature
  , Formats = require('../format')
  , turf = require('turf')
  , log = require('mapcache-log')
  , config = require('mapcache-config')
  , xyzTileUtils = require('xyz-tile-utils')
  , async = require('async')
  , Map = require('../map/map')
  , q = require('q');

var Cache = function(cache) {
  this.cache = cache;
  this.cache.outputDirectory = this.cache.outputDirectory || config.server.cacheDirectory.path;
  this.map = {};
  if (this.cache && !this.cache.status) {
    this.cache.status = {};
  }
  this.initDefer = q.defer();
  this.initPromise = this.initDefer.promise;
  this.initialize();
};

Cache.prototype.initialize = function() {
  var self = this;
  if (!this.cache.source) {
    this.error = new Error('There is no map associated with this cache');
    this.initDefer.resolve(self);
  } else if (this.cache.source && !this.cache.source.getTile) {
    var map = new Map(this.cache.source, {outputDirectory: this.cache.outputDirectory});
    map.callbackWhenInitialized(function(err, map) {
      self.map = map;
      self.cache.source = map.map;
      self._updateDataSourceParams(function() {
        self.initDefer.resolve(self);
      });
    });
  } else {
    self._updateDataSourceParams(function() {
      self.initDefer.resolve(self);
    });
  }
};

Cache.prototype._updateDataSourceParams = function(callback) {
  var self = this;
  var mapSources = this.map.dataSources || [];
  var params = this.cache.cacheCreationParams || {};
  if (!params.dataSources || params.dataSources.length === 0) {
    params.dataSources = [];
    for (var i = 0; i < mapSources.length; i++) {
      params.dataSources.push(mapSources[i].source.id);
    }
  }

  async.eachSeries(mapSources, function iterator(s, sourceFinishedCallback) {
    if (!s.source.vector) return sourceFinishedCallback();
    FeatureModel.getFeatureCount({sourceId: s.source.id, cacheId: self.cache.id}, function(countResults) {
      console.log('count results', countResults);
      if (countResults[0].count !== '0') {
        self.cache.status.totalFeatures = self.cache.status.totalFeatures + Number(countResults[0].count);
        return sourceFinishedCallback();
      }
      var extent = turf.bbox(self.cache.geometry);
      extent[0] = Math.max(-180, extent[0]);
      extent[1] = Math.max(-85, extent[1]);
      extent[2] = Math.min(180, extent[2]);
      extent[3] = Math.min(85, extent[3]);
      FeatureModel.createCacheFeaturesFromSource(s.source.id, self.cache.id, extent[0], extent[1], extent[2], extent[3], function(err, features) {
        log.info('Created %d features for the cache %s from the source %s', features.rowCount, self.cache.id, s.source.id);
        self.cache.status.totalFeatures = self.cache.status.totalFeatures + features.rowCount;
        return sourceFinishedCallback();
      });
    });
  }, function() {
    // all sources have had their vector data generated
    self.cache.cacheCreationParams = self.cache.cacheCreationParams || {};
    self.cache.cacheCreationParams.dataSources = params.dataSources;
    callback();
  });
};

Cache.prototype.callbackWhenInitialized = function(callback) {
  this.initPromise.then(function(self) {
    callback(null, self);
  });
};

Cache.prototype.generateFormat = function(format, doneCallback, progressCallback) {
  log.info("Generate the format %s for cache %s", format, this.cache.id.toString());
  this.callbackWhenInitialized(function(err, self) {
    self._generateFormat(format, doneCallback, progressCallback);
  });
};

Cache.prototype._generateFormat = function(format, doneCallback, progressCallback) {
  var DataSource = Formats.getFormat(format);
  var ds = new DataSource({cache: this, outputDirectory: this.cache.outputDirectory});
  ds.generateCache(doneCallback, progressCallback);
};

Cache.prototype.getTile = function(format, z, x, y, params, callback) {
  if( typeof params === "function" && !callback) {
    callback = params;
		params = {};
  }
  callback = callback || function(){};
  this.initPromise.then(function(self) {
    if (self.error) return callback(self.error);
    if (self.cache.minZoom > z || self.cache.maxZoom < z) {
      return callback(null, null);
    }
    // determine if the cache bounds intersect this tile
    var bounds = xyzTileUtils.tileExtentCalculator(x, y, z);
    var match = xyzTileUtils.determineGeometryMatch(self.cache.geometry, bounds);
    if (!match) {
      return callback(null, null);
    }

    self.map.getTile(format, z, x, y, params, function(err, tileStream) {
      callback(null, tileStream);
    });
  });
};

Cache.prototype.getData = function(format, minZoom, maxZoom, callback) {
  var DataSource = Formats.getFormat(format);
  var ds = new DataSource({cache: this, outputDirectory: this.cache.outputDirectory});
  ds.getData(minZoom, maxZoom, callback);
};

module.exports = Cache;
