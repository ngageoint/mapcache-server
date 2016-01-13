var models = require('mapcache-models')
  , CacheModel = models.Cache
  , turf = require('turf')
  , fs = require('fs-extra')
  , archiver = require('archiver')
  , log = require('mapcache-log')
  , config = require('mapcache-config')
  , FeatureModel = models.Feature
  , async = require('async')
  , CacheApi = require('../cache/cache')
  , exec = require('child_process').exec;

function Cache(cacheModel) {
  this.cacheModel = cacheModel;
}

Cache.getAll = function(options, callback) {
  CacheModel.getCaches(options, callback);
}

Cache.getById = function(id, callback) {
  console.log('get cache by id', id);
  CacheModel.getCacheById(id, function(err, cache) {
    callback(err, cache);
  });
}

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
  CacheModel.createCache(cache, function(err, newCache) {
    if (err) return callback(err);
    log.warn('created cache', newCache.source.id);
    progressCallback(null, newCache);
    createFormat(formats, newCache, callback, progressCallback);
  });
}

function createFormat(formats, cache, callback, progressCallback) {
  var cacheApi = new CacheApi(cache);
  cacheApi.callbackWhenInitialized(function(err, cache) {
    console.log('cache was initialized', cache);
    async.eachSeries(formats, function(format, done) {
      var Format = require('../format/'+format);
      console.log('format', format);
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
        console.log('~~~~~~~~~~~~~~~progress on the cache %s', cache.status);
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
}

Cache.prototype.delete = function(callback) {
  var cacheModel = this.cacheModel;
  CacheModel.deleteCache(cacheModel, function(err) {
    if (err) return callback(err);
    fs.remove(config.server.cacheDirectory.path + "/" + cacheModel.id, function(err) {
      callback(err, cacheModel);
    });
  });
}

Cache.prototype.deleteFormat = function(format, callback) {
  var cacheModel = this.cacheModel;
  CacheModel.deleteFormat(cacheModel, format, function(err) {
    if (err) return callback(err);
    cacheProcessor.deleteCacheFormat(cacheModel, format, function(err) {
      callback(err, cacheModel);
    });
  });
}

Cache.prototype.createFormat = function(formats, callback, progressCallback) {
  var cache = this.cacheModel;
  formats = Array.isArray(formats) ? formats : [formats];
  createFormat(formats, cache, callback, progressCallback);
  // var newFormats = [];
  // if (formats) {
  //   if (typeof formats === "string") {
  //     console.log('formats is a string', formats);
  //     formats = [formats];
  //   }
  //   if (Array.isArray(formats)) {
  //     for (var i = 0; i < formats.length; i++) {
  //       if (!cache.formats || !cache.formats[formats[i]]) {
  //         newFormats.push(formats[i]);
  //       }
  //     }
  //   }
  // }
  //
  // console.log('formats', newFormats);
  //
  // // if the request speficied a format that has a dependency and that
  // // dependency is not in the format list, add it here
  // var formatMap = {};
  // config.sourceCacheTypes.raster.forEach(function(t) {
  //   formatMap[t.type] = t;
  // });
  // config.sourceCacheTypes.vector.forEach(function(t) {
  //   formatMap[t.type] = t;
  // });
  //
  // newFormats.forEach(function(format) {
  //   if (formatMap[format].depends) {
  //     if (newFormats.indexOf(formatMap[format].depends) == -1 && !cache.formats[formatMap[format].depends]) {
  //       newFormats.push(formatMap[format].depends);
  //     }
  //   }
  // });
  //
  // console.log('new formats now', newFormats);
  //
  // var cacheApi = new CacheApi(this.cacheModel);
  // cacheApi.callbackWhenInitialized(function(err, cache) {
  //
  //   async.eachSeries(newFormats, function(newFormat, done) {
  //     console.log("creating format " + newFormat + " for cache " + cache.name);
  //
  //     var Format = require('../format/'+newFormat);
  //     console.log('output dir', config.server.cacheDirectory.path);
  //     var cacheFormat = new Format({cache: cache, outputDirectory: config.server.cacheDirectory.path});
  //     cacheFormat.generateCache(function(err, cache) {
  //       log.info('cache is done generating %s', cache.cache.name);
  //       done();
  //     }, function(cache, callback) {
  //       console.log('~~~~~~~~~~~~~~~progress on the cache %s', cache.status);
  //       cache.save(function() {
  //         // progressCallback(null, cache);
  //         callback(null, cache);
  //       });
  //     });
  //   }, function() {
  //     if (callback) {
  //       callback(null, cache);
  //     }
  //   });
  // });

}

Cache.prototype.restart = function(format, callback) {
  // cacheProcessor.restartCacheFormat(this.cacheModel, format, function(err, cache) {
  //   console.log('format ' + format + ' restarted for cache ' + cache.name);
  //   callback(err, cache);
  // });
}

Cache.prototype.generateMoreZooms = function(format, newMinZoom, newMaxZoom, callback) {
  // cacheProcessor.generateMoreZooms(this.cacheModel, format, newMinZoom, newMaxZoom, function(err, cache) {
  //   console.log('more zooms for ' + format + ' for cache ' + cache.name);
  //   callback(err, cache);
  // });
}

Cache.prototype.getData = function(format, minZoom, maxZoom, callback) {
  // cacheProcessor.getCacheData(this.cacheModel, format, minZoom, maxZoom, callback);
}

Cache.prototype.getTile = function(format, z, x, y, params, callback) {
  var cacheApi = new CacheApi(this.cacheModel);
  cacheApi.callbackWhenInitialized(function(err, cache) {
    cacheApi.getTile(format, z, x, y, params, callback);
  });
}

module.exports = Cache;
