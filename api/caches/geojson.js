var CacheModel = require('../../models/cache.js')
  , fs = require('fs-extra');

exports.getCacheData = function(cache, minZoom, maxZoom, callback) {
  var geojsonFile = config.server.cacheDirectory.path + "/" + cache._id + "/" + cache._id + ".geojson";
  if (!fs.existsSync(geojsonFile)) {
    CacheModel.updateFormatGenerating(cache, 'geojson', function(err) {
      console.log('running ' + 'mb-util ' + config.server.cacheDirectory.path + "/" + cache._id + " " + mbtilesFile);
      var python = exec(
       'mb-util ' + config.server.cacheDirectory.path + "/" + cache._id + " " + mbtilesFile,
       function(error, stdout, stderr) {
         console.log('done running ' + 'mb-util ' + config.server.cacheDirectory.path + "/" + cache._id + " " + mbtilesFile);
         CacheModel.updateFormatCreated(cache, 'geojson', mbtilesFile, function(err) {
           console.log('updated format created');
           var stream = fs.createReadStream(mbtilesFile);
           callback(null, stream);
         });
       });
     });
   } else {
     var stream = fs.createReadStream(geojsonFile);
     callback(null, stream);
   }
}
