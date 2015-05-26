var CacheModel = require('../../models/cache.js')
  , path = require('path')
  , exec = require('child_process').exec
  , config = require('../../config.json')
  , fs = require('fs-extra');

 exports.getCacheData = function(cache, minZoom, maxZoom, callback) {
   var geoPackageFile = path.join(config.server.cacheDirectory.path, cache._id.toString(), cache._id + ".mbitles");
   if (!fs.existsSync(geoPackageFile)) {
     var child = require('child_process').fork('api/caches/creator.js');
     child.send({operation:'generateCache', cache: cache, format: 'mbtiles', minZoom: minZoom, maxZoom: maxZoom});
     callback(null, {creating: true});
   } else {
     var stream = fs.createReadStream(geoPackageFile);
     callback(null, {stream: stream, extension: '.mbtiles'});
   }
 }

 exports.generateCache = function(cache, minZoom, maxZoom, callback) {
  var mbtilesFile = path.join(config.server.cacheDirectory.path, cache._id.toString(), cache._id + ".mbtiles");
  console.log('running ' + 'mb-util ' + path.join(config.server.cacheDirectory.path, cache._id.toString()) + " " + mbtilesFile);
  var python = exec(
    'mb-util ' + path.join(config.server.cacheDirectory.path, cache._id.toString()) + " " + mbtilesFile,
    function(error, stdout, stderr) {
      console.log('done running ' + 'mb-util ' + path.join(config.server.cacheDirectory.path, cache._id.toString()) + " " + mbtilesFile);
      callback(error, {cache: cache, file: mbtilesFile});
    }
  );
 }
