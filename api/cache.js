var CacheModel = require('../models/cache')
  , turf = require('turf')
  , fs = require('fs-extra')
  , archiver = require('archiver')
  , config = require('../config.json')
  , tileUtilities = require('./tileUtilities')
  , sourceProcessor = require('./sourceTypes')
  , cacheProcessor = require('./caches')
  , config = require('../config.json')
  , exec = require('child_process').exec
  , downloader = require('./tileDownloader');

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

Cache.prototype.create = function(cache, format, callback) {

  if (cache.id) {
    sourceProcessor.createCache(cache, format);
    return callback(null, cache);
  }

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

    sourceProcessor.createCache(newCache);
  });
}

Cache.prototype.restart = function(cache, format, callback) {
  if (!cache.status.complete) {
    return callback(new Error('Cache is currently being generated'));
  }
  cache.status.complete = false;
  sourceProcessor.createCache(cache, format);
}

Cache.prototype.getData = function(cache, minZoom, maxZoom, format, callback) {
  caches.getCacheData(cache, format, minZoom, maxZoom, callback);
}

module.exports = Cache;
