var CacheModel = require('../../models/cache.js')
  , path = require('path')
  , exec = require('child_process').exec
  , config = require('../../config.json')
  , fs = require('fs-extra');

exports.getCacheData = function(cache, minZoom, maxZoom, callback) {
  var geoPackageFile = path.join(config.server.cacheDirectory.path, cache._id.toString(), cache._id + ".gpkg");
  if (!fs.existsSync(geoPackageFile)) {
    var child = require('child_process').fork('api/caches/creator.js');
    child.send({operation:'generateCache', cache: cache, format: 'geopackage', minZoom: minZoom, maxZoom: maxZoom});
    callback(null, {creating: true});
  } else {
    var stream = fs.createReadStream(geoPackageFile);
    callback(null, {stream: stream, extension: '.gpkg'});
  }
}

exports.generateCache = function(cache, minZoom, maxZoom, callback) {
  var geoPackageFile = path.join(config.server.cacheDirectory.path, cache._id.toString(), cache._id + ".gpkg");
  var python = exec(
    './utilities/geopackage-python-4.0/Packaging/tiles2gpkg_parallel.py -tileorigin ul -srs 3857 ' + path.join(config.server.cacheDirectory.path, cache._id.toString()) + " " + geoPackageFile,
    function(error, stdout, stderr) {
      callback(error, {cache: cache, file: geoPackageFile});
    }
  );
}
