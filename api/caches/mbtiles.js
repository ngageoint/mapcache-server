var CacheModel = require('../../models/cache.js')
  , path = require('path')
  , exec = require('child_process').exec
  , config = require('mapcache-config')
  , turf = require('turf')
  , fs = require('fs-extra');

 exports.getCacheData = function(cache, minZoom, maxZoom, callback) {
   var mbtilesFile = path.join(config.server.cacheDirectory.path, cache._id.toString(), cache._id + ".mbtiles");
   console.log('looking for ', mbtilesFile);
   if (!fs.existsSync(mbtilesFile)) {
     var child = require('child_process').fork('api/caches/creator.js');
     child.send({operation:'generateCache', cache: cache, format: 'mbtiles', minZoom: minZoom, maxZoom: maxZoom});
     callback(null, {creating: true});
   } else {
     var stream = fs.createReadStream(mbtilesFile);
     callback(null, {stream: stream, extension: '.mbtiles'});
   }
 }

 exports.generateCache = function(cache, minZoom, maxZoom, callback) {
   CacheModel.getCacheById(cache.id, function(err, cache) {
     // ensure there is already an xyz cache generated
     if (cache.formats && cache.formats.xyz && !cache.formats.xyz.generating) {
      var mbtilesFile = path.join(config.server.cacheDirectory.path, cache._id.toString(), cache._id + ".mbtiles");
      console.log('running ' + 'mb-util ' + path.join(config.server.cacheDirectory.path, cache._id.toString(), 'xyztiles') + " " + mbtilesFile);

      var extent = turf.extent(cache.geometry);
      var metadata = {
        name: cache.name,
        type: 'overlay',
        version: 1,
        description: cache.name,
        format: 'png',
        bounds: extent[0]+','+extent[1]+','+extent[2]+','+extent[3]
      };

      fs.writeFile(path.join(config.server.cacheDirectory.path, cache._id.toString(), 'xyztiles', 'metadata.json'), JSON.stringify(metadata), function(err) {
        var python = exec(
          'mb-util ' + path.join(config.server.cacheDirectory.path, cache._id.toString(), 'xyztiles') + " " + mbtilesFile,
          function(error, stdout, stderr) {
            console.log('stdout', stdout);
            console.log('stderr', stderr);
            console.log('done running ' + 'mb-util ' + path.join(config.server.cacheDirectory.path, cache._id.toString(), 'xyztiles') + " " + mbtilesFile);
            callback(error, {cache: cache, file: mbtilesFile});
          }
        );
      });
    } else {
      console.log('XYZ cache is not done generating, waiting 30 seconds to generate an mbtiles cache...');
      setTimeout(exports.generateCache, 30000, cache, minZoom, maxZoom, callback);
    }
  });
}

exports.deleteCache = function(cache, callback) {
  fs.remove(config.server.cacheDirectory.path + "/" + cache._id + "/" + cache._id + ".mbtiles", function(err) {
    callback(err, cache);
  });
}
