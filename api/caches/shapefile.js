var CacheModel = require('../../models/cache.js')
  , sourceTypes = require('../sources')
  , path = require('path')
  , turf = require('turf')
  , ogrType = require('./ogrType.js')
  , config = require('../../config.json')
  , fs = require('fs-extra');

exports.getCacheData = function(cache, minZoom, maxZoom, callback) {
  var shapefileZip = path.join(config.server.cacheDirectory.path, cache._id.toString(), cache._id + "_shapefile.zip");

  if (!fs.existsSync(shapefileZip)) {
    var child = require('child_process').fork('api/caches/creator.js');
    child.send({operation:'generateCache', cache: cache, format: 'shapefile', minZoom: minZoom, maxZoom: maxZoom});
    callback(null, {creating: true});
  } else {
    var stream = fs.createReadStream(shapefileZip);
    callback(null, {stream: stream, extension: '_shapefile.zip'});
  }
}

exports.generateCache = function(cache, minZoom, maxZoom, callback) {
  var shapefileZip = path.join(config.server.cacheDirectory.path, cache._id.toString(), cache._id + "_shapefile.zip");
  ogrType.generateCache(cache, shapefileZip, 'ESRI Shapefile', callback);
}

exports.getTile = function(cache, format, z, x, y, callback) {
  return tileUtilities.getVectorTile(cache.source, format, z, x, y, null, callback);
}
