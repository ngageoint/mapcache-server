var FeatureModel = require('mapcache-models').Feature
  , turf = require('turf')
  , Canvas = require('canvas')
  , log = require('mapcache-log')
  , config = require('mapcache-config')
  , Image = Canvas.Image
  , xyzTileUtils = require('xyz-tile-utils')
  , fs = require('fs-extra')
  , async = require('async')
  , Map = require('../map/map')
  , util = require('util')
  , q = require('q');

var Cache = function(cache) {
  console.log('cache', cache.source.id);
  this.cache = cache || {};
  this.cache.outputDirectory = this.cache.outputDirectory || config.server.cacheDirectory.path;
  this.map = {};
  if (this.cache && !this.cache.status) {
    this.cache.status = {};
  }
  this.initDefer = q.defer();
  this.initPromise = this.initDefer.promise;
  this.initialize();
}

Cache.prototype.initialize = function() {
  var self = this;
  if (this.cache.source && !this.cache.source.getTile) {
    var map = new Map(this.cache.source, {outputDirectory: this.cache.outputDirectory});
    map.callbackWhenInitialized(function(err, map) {
      console.log('map id', map);
      console.log('map.source.id', map.map.id);
      console.log('map initilzed in cache', self.cache);
      self.map = map;
      self.cache.source = map.map;
      console.log('going to updated');
      self._updateDataSourceParams(function() {
        console.log('update dataSources');
        self.initDefer.resolve(self);
      });
    });
  } else {
    self._updateDataSourceParams(function() {
      self.initDefer.resolve(self);
    });
  }
}

Cache.prototype._updateDataSourceParams = function(callback) {
  var self = this;
  var mapSources = this.map.dataSources;
  var params = this.cache.cacheCreationParams || {};
  if (!params.dataSources || params.dataSources.length == 0) {
    params.dataSources = [];
    for (var i = 0; i < mapSources.length; i++) {
      params.dataSources.push(mapSources[i].source.id);
    }
  }

  console.log('params.dataSources', params.dataSources);
  async.eachSeries(mapSources, function iterator(s, sourceFinishedCallback) {
    log.info('Checking source %s', s.source.id.toString());
    if (!s.source.vector) return sourceFinishedCallback();
    FeatureModel.getFeatureCount({sourceId: s.source.id, cacheId: self.cache.id}, function(countResults) {
      if (countResults[0].count != '0') {
        self.cache.status.totalFeatures = self.cache.status.totalFeatures + Number(countResults[0].count);
        return sourceFinishedCallback();
      }
      var extent = turf.extent(self.cache.geometry);
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
  }, function(err) {
    // all sources have had their vector data generated
    self.cache.cacheCreationParams = self.cache.cacheCreationParams || {};
    self.cache.cacheCreationParams.dataSources = params.dataSources;
    callback();
  });
}

Cache.prototype.callbackWhenInitialized = function(callback) {
  this.initPromise.then(function(self) {
    console.log('calling back in cache');
    callback(null, self);
  });
}

Cache.prototype.generateFormat = function(format, doneCallback, progressCallback) {
  log.info("Generate the format %s for cache %s", format, this.cache.id);
  this.callbackWhenInitialized(function(err, self) {
    self._generateFormat(format, doneCallback, progressCallback);
  });
}

Cache.prototype._generateFormat = function(format, doneCallback, progressCallback) {
  var DataSource = require('../format/'+format);
  var ds = new DataSource({cache: this, outputDirectory: this.cache.outputDirectory});
  ds.generateCache(doneCallback, progressCallback);
}

Cache.prototype.getTile = function(format, z, x, y, params, callback) {
  if( typeof params === "function" && !callback) {
    callback = params;
		params = {};
  }
  callback = callback || function(){}

  this.initPromise.then(function(self) {

    // determine if the cache bounds intersect this tile
    var bounds = xyzTileUtils.tileBboxCalculator(x, y, z);
    var tilePoly = turf.bboxPolygon([bounds.west, bounds.south, bounds.east, bounds.north]);
    var intersection = turf.intersect(tilePoly, self.cache.geometry);
    if (!intersection) {
      return callback(null, null);
    }

    console.log('promise inited in cache.getTile');
    self.map.getTile(format, z, x, y, params, function(err, tileStream) {
      log.debug('stream from the cache get tile is', tileStream);
      callback(null, tileStream);
    });
  });
}

Cache.prototype.getData = function(format, minZoom, maxZoom, callback) {
  var DataSource = require('../format/'+format);
  var ds = new DataSource({cache: this, outputDirectory: this.cache.outputDirectory});
  ds.getData(minZoom, maxZoom, callback);
}

function createDir(cacheName, filepath){
	if (!fs.existsSync(cacheName +'/'+ filepath)) {
    fs.mkdirsSync(cacheName +'/'+ filepath, function(err){
       if (err) console.log(err);
     });
	}
  return cacheName +'/'+ filepath;
}

module.exports = Cache;
