var CacheModel = require('../models/cache')
  , turf = require('turf')
  , fs = require('fs-extra')
  , archiver = require('archiver')
  , config = require('../config.json')
  , tileUtilities = require('./tileUtilities')
  , sourceProcessor = require('./sources')
  , cacheProcessor = require('./caches')
  , config = require('../config.json')
  , exec = require('child_process').exec;

function Cache() {
}

Cache.prototype.getAll = function(options, callback) {
  CacheModel.getCaches(callback);
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
    var extension = "." + format;
    if (format == 'geopackage') {
      extension = '.gpkg';
    }

    fs.remove(config.server.cacheDirectory.path + "/" + cache._id + "/" + cache._id + extension, function(err) {
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

  if (cache.id) {
    // if the request did not specify the required caches
    // add them here
    var cacheTypes = config.sourceCacheTypes[cache.source.format];
    for (var i = 0; i < cacheTypes.length; i++) {
      var item = cacheTypes[i];
      if (!newFormats.indexOf(item.type)) {
        newFormats.push(item.type);
      }
    }
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

    CacheModel.createCache(cache, function(err, newCache) {
      if (err) return callback(err);
      callback(err, newCache);
      // if the request did not specify the required caches
      // add them here
      var cacheTypes = config.sourceCacheTypes[newCache.source.format];
      for (var i = 0; i < cacheTypes.length; i++) {
        var item = cacheTypes[i];
        if (item.required && !item.virtual && newFormats.indexOf(item.type) == -1) {
          newFormats.push(item.type);
        }
      }
      for (var i = 0; i < newFormats.length; i++) {
        console.log("creating format " + newFormats[i] + " for cache " + newCache.name);
        cacheProcessor.createCacheFormat(newCache, newFormats[i], function(err, cache) {
          console.log('format ' + newFormats[i] + ' submitted for cache ' + newCache.name);
        });
      }
    });
  }
}

Cache.prototype.restart = function(cache, format, callback) {
  if (!cache.status.complete) {
    return callback(new Error('Cache is currently being generated'));
  }

  cacheProcessor.createCacheFormat(cache, format, function(err, cache) {
    console.log('format ' + format + ' submitted for cache ' + cache.name);
  });
}

Cache.prototype.getData = function(cache, format, minZoom, maxZoom, callback) {
  cacheProcessor.getCacheData(cache, format, minZoom, maxZoom, callback);
}

Cache.prototype.getTile = function(cache, format, z, x, y, callback) {
  cacheProcessor.getTile(cache, format, z, x, y, callback);
}

module.exports = Cache;
