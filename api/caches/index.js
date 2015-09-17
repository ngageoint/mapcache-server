var CacheModel = require('../../models/cache.js')
  , turf = require('turf')
  , tu = require('../tileUtilities.js');

exports.getCacheData = function(cache, format, minZoom, maxZoom, callback) {
  var processor = require('./' + format);

  if( typeof minZoom === "function" && !callback) {
    callback = minZoom;
		minZoom = null;
    maxZoom = null;
  }
  if( typeof maxZoom === "function" && !callback) {
    callback = maxZoom;
    maxZoom = null;
  }
  callback = callback || function(){}

  minZoom = minZoom ? Math.max(minZoom, cache.minZoom) : cache.minZoom;
  maxZoom = maxZoom ? Math.min(maxZoom, cache.maxZoom) : cache.maxZoom;

  processor.getCacheData(cache, minZoom, maxZoom, callback);
}

exports.restartCacheFormat = function(cache, format, callback) {
  var processor = require('./' + format);
  if (processor.restart) {
    cache.status.complete = false;
    cache.save(function() {
      CacheModel.updateFormatGenerating(cache, format, function(err) {
        callback(null, cache);
        var child = require('child_process').fork('api/caches/creator.js');
        child.send({operation:'restart', cache: cache, format: format});
      });
    });
  } else {
    callback(new Error('Unable to restart this cache'));
  }
}

exports.generateMoreZooms = function(cache, format, newMinZoom, newMaxZoom, callback) {
  var processor = require('./' + format);
  if (processor.generateMoreZooms) {
    if (newMinZoom < cache.minZoom) {
      cache.minZoom = newMinZoom;
    }
    if (newMaxZoom > cache.maxZoom) {
      cache.maxZoom = newMaxZoom;
    }
    cache.status.complete = false;
    cache.save(function() {
      CacheModel.updateFormatGenerating(cache, format, function(err) {
        callback(null, cache);
        var child = require('child_process').fork('api/caches/creator.js');
        child.send({operation:'generateMoreZooms', cache: cache, format: format, minZoom: cache.minZoom, maxZoom: cache.maxZoom});
      });
    });
  } else {
    callback(new Error('Unable to generate more zooms for this cache'));
  }
}

exports.createCacheFormat = function(cache, format, minZoom, maxZoom, callback) {
  if( typeof minZoom === "function" && !callback) {
    callback = minZoom;
		minZoom = null;
    maxZoom = null;
  }
  if( typeof maxZoom === "function" && !callback) {
    callback = maxZoom;
    maxZoom = null;
  }
  callback = callback || function(){}
  minZoom = minZoom ? Math.max(minZoom, cache.minZoom) : cache.minZoom;
  maxZoom = maxZoom ? Math.min(maxZoom, cache.maxZoom) : cache.maxZoom;

  CacheModel.updateFormatGenerating(cache, format, function(err) {
    callback(null, cache);
    var child = require('child_process').fork('api/caches/creator.js');
    child.send({operation:'generateCache', cache: cache, format: format, minZoom: minZoom, maxZoom: maxZoom});
  });
}

exports.deleteCacheFormat = function(cache, format, callback) {
  var processor = require('./' + format);
  if (processor.deleteCache) {
    processor.deleteCache(cache, callback);
  } else {
    callback();
  }
}

exports.getTile = function(cache, format, z, x, y, callback) {

  var tileEnvelope = tu.tileBboxCalculator(x, y, z);
  var tilePoly = turf.bboxPolygon([tileEnvelope.west, tileEnvelope.south, tileEnvelope.east, tileEnvelope.north]);
  var intersection = turf.intersect(tilePoly, cache.geometry);
  if (!intersection) {
    return callback(null, null);
  }

  // determine if they want a vector format or raster, for now assume raster and just pull from xyztiles
  var processor = require('./xyz');
  return processor.getTile(cache, format, z, x, y, callback);
}
