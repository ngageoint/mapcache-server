var CacheModel = require('../../models/cache.js');

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
