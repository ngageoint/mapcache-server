var CacheModel = require('../models/cache')
  , turf = require('turf')
  , fs = require('fs-extra')
  , archiver = require('archiver')
  , sourceProcessor = require('./sources')
  , cacheProcessor = require('./caches')
  , config = require('mapcache-config')
  , FeatureModel = require('../models/feature')
  , async = require('async')
  , exec = require('child_process').exec;

function Cache() {
}

Cache.prototype.getAll = function(options, callback) {
  CacheModel.getCaches(options, callback);
}

Cache.prototype.getCachesFromMapId = function(id, callback) {
  var query = {
	  'sourceId': id
  };
  CacheModel.getCaches(query, callback);
}

Cache.prototype.delete = function(cache, callback) {
  CacheModel.deleteCache(cache, function(err) {
    if (err) return callback(err);
    fs.remove(config.server.cacheDirectory.path + "/" + cache.id, function(err) {
      callback(err, cache);
    });
  });
}

Cache.prototype.deleteFormat = function(cache, format, callback) {
  CacheModel.deleteFormat(cache, format, function(err) {
    if (err) return callback(err);
    cacheProcessor.deleteCacheFormat(cache, format, function(err) {
      callback(err, cache);
    });
  });
}

Cache.prototype.create = function(cache, formats, callback) {
  if( typeof formats === "function" && !callback) {
    callback = formats;
		formats = cache.create || [];
  }
  callback = callback || function(){}

  var newFormats = [];
  if (formats) {
    if (typeof formats === "string") {
      console.log('formats is a string', formats);
      formats = [formats];
    }
    if (Array.isArray(formats)) {
      for (var i = 0; i < formats.length; i++) {
        if (!cache.formats || !cache.formats[formats[i]]) {
          newFormats.push(formats[i]);
        }
      }
    }
  }

  // if the request speficied a format that has a dependency and that
  // dependency is not in the format list, add it here
  var formatMap = {};
  config.sourceCacheTypes.raster.forEach(function(t) {
    formatMap[t.type] = t;
  });
  config.sourceCacheTypes.vector.forEach(function(t) {
    formatMap[t.type] = t;
  });

  newFormats.forEach(function(format) {
    if (formatMap[format].depends) {
      if (newFormats.indexOf(formatMap[format].depends) == -1 && !cache.formats[formatMap[format].depends]) {
        newFormats.push(formatMap[format].depends);
      }
    }
  });

  if (cache.id) {

    for (var i = 0; i < newFormats.length; i++) {
      console.log("creating format " + newFormats[i] + " for cache " + cache.name);
      cacheProcessor.createCacheFormat(cache, newFormats[i], function(err, cache) {
      });
    }
    return callback(null, cache);
  } else {
    cache.tileSizeLimit = cache.tileSizeLimit || config.server.maximumCacheSize * 1024 * 1024;

    cache.status = {
      complete: false,
      totalTiles: 0,
      generatedTiles: 0,
      totalFeatures: 0,
      generatedFeatures: 0,
      zoomLevelStatus: {}
    };
    console.log('cache to create', cache);
    CacheModel.createCache(cache, function(err, newCache) {
      if (err) return callback(err);
      console.log('created cache', newCache);
      callback(err, newCache);

      // if the cache has vector datasources we need to populate postgis
      var vectorSources = [];
      for (var i = 0; i < newCache.source.dataSources.length; i++) {
        if (newCache.source.dataSources[i].vector) {
          vectorSources.push(newCache.source.dataSources[i]);
        }
      }

      var extent = turf.extent(cache.geometry);

      async.eachSeries(vectorSources, function(dataSource, done) {
        if (newCache.cacheCreationParams.dataSources.indexOf(dataSource._id.toString()) == -1) {
          return done();
        }
        console.log('cache', newCache);
        console.log('datasource', dataSource);
        console.log('inserting features for cache %s from source %s', newCache._id, dataSource._id);
        FeatureModel.createCacheFeaturesFromSource(dataSource._id, newCache._id, extent[0], extent[1], extent[2], extent[3], done);
      }, function() {
        for (var i = 0; i < newFormats.length; i++) {
          console.log("creating format " + newFormats[i] + " for cache " + newCache.name);
          cacheProcessor.createCacheFormat(newCache, newFormats[i], function(err, cache) {
            console.log('format ' + newFormats[i] + ' submitted for cache ' + newCache.name);
          });
        }
      })
    });
  }
}

Cache.prototype.restart = function(cache, format, callback) {
  cacheProcessor.restartCacheFormat(cache, format, function(err, cache) {
    console.log('format ' + format + ' restarted for cache ' + cache.name);
  });
}

Cache.prototype.generateMoreZooms = function(cache, format, newMinZoom, newMaxZoom, callback) {
  cacheProcessor.generateMoreZooms(cache, format, newMinZoom, newMaxZoom, function(err, cache) {
    console.log('more zooms for ' + format + ' for cache ' + cache.name);
  });
}

Cache.prototype.getData = function(cache, format, minZoom, maxZoom, callback) {
  cacheProcessor.getCacheData(cache, format, minZoom, maxZoom, callback);
}

Cache.prototype.getTile = function(cache, format, z, x, y, callback) {
  cacheProcessor.getTile(cache, format, z, x, y, callback);
}

module.exports = Cache;
