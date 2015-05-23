var CacheModel = require('../../models/cache.js')
  , path = require('path')
  , fs = require('fs-extra');

 exports.getCacheData = function(cache, minZoom, maxZoom, callback) {
   var geoPackageFile = path.join(config.server.cacheDirectory.path, cache._id, cache._id + ".mbitles");
   if (!fs.existsSync(geoPackageFile)) {
     var child = require('child_process').fork('api/caches/creator.js');
     child.send({operation:'generateCache', cache: cache, format: 'mbtiles', minZoom: minZoom, maxZoom: maxZoom});
     callback(null, {creating: true});
   } else {
     var stream = fs.createReadStream(geoPackageFile);
     callback(null, {stream: stream, extension: '.mbtiles'});
   }
 }

 exports.createCache = function(cache, minZoom, maxZoom, callback) {
  var mbtilesFile = path.join(config.server.cacheDirectory.path, cache._id, cache._id + ".mbtiles");
  CacheModel.updateFormatGenerating(cache, 'mbtiles', function(err) {
    console.log('running ' + 'mb-util ' + path.join(config.server.cacheDirectory.path, cache._id) + " " + mbtilesFile);
    var python = exec(
      'mb-util ' + path.join(config.server.cacheDirectory.path, cache._id) + " " + mbtilesFile,
      function(error, stdout, stderr) {
        console.log('done running ' + 'mb-util ' + path.join(config.server.cacheDirectory.path, cache._id) + " " + mbtilesFile);
        CacheModel.updateFormatCreated(cache, 'mbtiles', mbtilesFile, function(err) {
          console.log('updated format created');
          var stream = fs.createReadStream(mbtilesFile);
          callback(null, stream);
        });
      }
    );
  });
 }
