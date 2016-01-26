var models = require('mapcache-models')
  , CacheModel = models.Cache
  , turf = require('turf')
  , fs = require('fs-extra')
  , log = require('mapcache-log')
  , config = require('mapcache-config')
  , async = require('async')
  , CacheApi = require('../cache/cache');

function Cache(cacheModel) {
  this.cacheModel = cacheModel;
}

Cache.getAll = function(options, callback) {
  CacheModel.getCaches(options, callback);
};

Cache.getById = function(id, callback) {
  console.log('get cache by id', id);
  CacheModel.getCacheById(id, function(err, cache) {
    callback(err, cache);
  });
};

Cache.create = function(cache, callback, progressCallback) {
  callback = callback || function() {};
  progressCallback = progressCallback || function() {};

  var formats = cache.create || [];

  cache.tileSizeLimit = cache.tileSizeLimit || config.server.maximumCacheSize * 1024 * 1024;

  cache.status = {
    complete: false,
    totalTiles: 0,
    generatedTiles: 0,
    totalFeatures: 0,
    generatedFeatures: 0,
    zoomLevelStatus: {}
  };
  if (cache.cacheCreationParams && cache.cacheCreationParams.dataSources) {
    var ds = cache.cacheCreationParams.dataSources;
    var cleanDataSources = [];
    if (Array.isArray(ds)) {
      for (var i = 0; i < ds.length; i++) {
        if (ds[i] !== null) cleanDataSources.push(ds[i]);
      }
      cache.cacheCreationParams.dataSources = cleanDataSources;
    }
  }

  cache.geometry = turf.intersect({
    type: "Feature",
    properties: {},
    geometry: cache.geometry
  }, turf.bboxPolygon([-180, -85, 180, 85]));

  CacheModel.createCache(cache, function(err, newCache) {
    if (err) return callback(err);
    log.warn('created cache', newCache.source.id);
    progressCallback(null, newCache);
    createFormat(formats, newCache, callback, progressCallback);
  });
};

function createFormat(formats, cache, callback, progressCallback) {
  callback = callback || function() {};
  var cacheApi = new CacheApi(cache);
  cacheApi.callbackWhenInitialized(function(err, cache) {
    console.log('cache was initialized', cache);
    console.log('formats', formats);
    async.eachSeries(formats, function(format, done) {
      console.log('Format is', format);
      var Format = require('../format/'+format);
      console.log('format', Format);
      console.log('output dir', config.server.cacheDirectory.path);
      var cacheFormat = new Format({cache: cache, outputDirectory: config.server.cacheDirectory.path});
      console.log('cacheformat', cacheFormat);
      cacheFormat.generateCache(function(err, cache) {
        log.info('cache is done generating %s', cache.cache.name);
        cache.cache.markModified('status');
        cache.cache.markModified('formats');
        cache.cache.save(function() {
          if (progressCallback) progressCallback(null, cache.cache);
          done();
        });
      }, function(cache, callback) {
        console.log('~~~~~~~~~~~~~~~progress on the cache %s', cache.formats[format]);
        cache.markModified('status');
        cache.markModified('formats');
        cache.save(function() {
          if (progressCallback) progressCallback(null, cache);
          callback(null, cache);
        });
      });
    }, function() {
      log.info('Created all requested formats for cache %s', cacheApi.cache.id);
      CacheModel.getCacheById(cacheApi.cache.id, function(err, cache) {
        cache.status.complete = true;
        cache.save(function() {
          if (progressCallback) progressCallback(null, cache);
          callback(null, cache);
        });
      });
    });
  });
}

Cache.getCachesFromMapId = function(id, callback) {
  var query = {
	  'sourceId': id
  };
  CacheModel.getCaches(query, callback);
};

Cache.prototype.delete = function(callback) {
  var cacheModel = this.cacheModel;
  CacheModel.deleteCache(cacheModel, function(err) {
    if (err) return callback(err);
    fs.remove(config.server.cacheDirectory.path + "/" + cacheModel.id, function(err) {
      callback(err, cacheModel);
    });
  });
};

Cache.prototype.deleteFormat = function(format, callback) {
  var cacheModel = this.cacheModel;
  if (!cacheModel.formats[format]) return callback(null, cacheModel);
  CacheModel.deleteFormat(cacheModel, format, function(err) {
    if (err) return callback(err);
    var Format = require('../format/'+format);
    var cacheFormat = new Format({cache: cacheModel, outputDirectory: config.server.cacheDirectory.path});
    cacheFormat.delete(function(err) {
      callback(err, cacheModel);
    });
  });
};

Cache.prototype.createFormat = function(formats, callback, progressCallback) {
  var cache = this.cacheModel;
  formats = Array.isArray(formats) ? formats : [formats];
  createFormat(formats, cache, callback, progressCallback);
};

// Cache.prototype.restart = function(format, callback) {
  // cacheProcessor.restartCacheFormat(this.cacheModel, format, function(err, cache) {
  //   console.log('format ' + format + ' restarted for cache ' + cache.name);
  //   callback(err, cache);
  // });
// };

// Cache.prototype.generateMoreZooms = function(format, newMinZoom, newMaxZoom, callback) {
  // cacheProcessor.generateMoreZooms(this.cacheModel, format, newMinZoom, newMaxZoom, function(err, cache) {
  //   console.log('more zooms for ' + format + ' for cache ' + cache.name);
  //   callback(err, cache);
  // });
// };

Cache.prototype.getData = function(format, minZoom, maxZoom, callback) {
  if (!this.cacheModel.formats || !this.cacheModel.formats[format] || !this.cacheModel.formats[format].complete) {
    this.createFormat(format);
    return callback(null, {creating: true});
  }
  var cacheApi = new CacheApi(this.cacheModel);
  cacheApi.callbackWhenInitialized(function() {
    cacheApi.getData(format, minZoom, maxZoom, callback);
  });
};

Cache.prototype.getTile = function(format, z, x, y, params, callback) {
  var cacheApi = new CacheApi(this.cacheModel);
  cacheApi.callbackWhenInitialized(function() {
    cacheApi.getTile(format, z, x, y, params, callback);
  });
};

module.exports = Cache;
