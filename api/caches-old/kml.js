var models = require('mapcache-models')
  , CacheModel = require('mapcache-models').Cache
  , sourceTypes = require('../sources')
  , path = require('path')
  , ogrType = require('./ogrType.js')
  , config = require('mapcache-config')
  , fs = require('fs-extra');

exports.getCacheData = function(cache, minZoom, maxZoom, callback) {
  var file = path.join(config.server.cacheDirectory.path, cache._id.toString(), cache._id + ".kml");

  if (!fs.existsSync(file)) {
    var child = require('child_process').fork('api/caches/creator.js');
    child.send({operation:'generateCache', cache: cache, format: 'kml', minZoom: minZoom, maxZoom: maxZoom});
    callback(null, {creating: true});
  } else {
    var stream = fs.createReadStream(file);
    callback(null, {stream: stream, extension: '.kml'});
  }
}

exports.generateCache = function(cache, minZoom, maxZoom, callback) {
  var file = path.join(config.server.cacheDirectory.path, cache._id.toString(), cache._id + ".kml");
  ogrType.generateCache(cache, file, 'KML', callback);
}

exports.deleteCache = function(cache, callback) {
  fs.remove(config.server.cacheDirectory.path + "/" + cache._id + "/" + cache._id + ".kml", function(err) {
    callback(err, cache);
  });
}
