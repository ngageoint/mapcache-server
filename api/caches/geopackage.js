var CacheModel = require('../../models/cache.js')
  , path = require('path')
  , exec = require('child_process').exec
  , config = require('../../config.js')
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
  CacheModel.getCacheById(cache.id, function(err, cache) {
    // ensure there is already an xyz cache generated
    if (cache.formats && cache.formats.xyz && !cache.formats.xyz.generating) {
      var geoPackageFile = path.join(config.server.cacheDirectory.path, cache._id.toString(), cache._id + ".gpkg");
      console.log('running ' + './utilities/geopackage-python-4.0/Packaging/tiles2gpkg_parallel.py -tileorigin ul -srs 3857 ' + path.join(config.server.cacheDirectory.path, cache._id.toString(), 'xyztiles') + " " + geoPackageFile);
      var python = exec(
        './utilities/geopackage-python-4.0/Packaging/tiles2gpkg_parallel.py -tileorigin ul -srs 3857 ' + path.join(config.server.cacheDirectory.path, cache._id.toString(), 'xyztiles') + " " + geoPackageFile,
        function(error, stdout, stderr) {
          callback(error, {cache: cache, file: geoPackageFile});
        }
      );
    } else {
      console.log('XYZ cache is not done generating, waiting 30 seconds to generate a geopackage...');
      setTimeout(exports.generateCache, 30000, cache, minZoom, maxZoom, callback);
    }
  });
}

exports.deleteCache = function(cache, callback) {
  fs.remove(config.server.cacheDirectory.path + "/" + cache._id + "/" + cache._id + ".gpkg", function(err) {
    callback(err, cache);
  });
}
