var CacheModel = require('../../models/cache.js')
  , fs = require('fs-extra');

exports.getCacheData = function(cache, minZoom, maxZoom, callback) {
  var geoPackageFile = config.server.cacheDirectory.path + "/" + cache._id + "/" + cache._id + ".gpkg";
  if (!fs.existsSync(geoPackageFile)) {
    CacheModel.updateFormatGenerating(cache, 'geopackage', function(err) {
      var python = exec(
       './utilities/geopackage-python-4.0/Packaging/tiles2gpkg_parallel.py -tileorigin ul -srs 3857 ' + config.server.cacheDirectory.path + "/" + cache._id + " " + geoPackageFile,
       function(error, stdout, stderr) {
         CacheModel.updateFormatCreated(cache, 'geopackage', geoPackageFile, function(err) {
           var stream = fs.createReadStream(geoPackageFile);
           callback(null, stream);
         });
       });
     });
   } else {
     var stream = fs.createReadStream(geoPackageFile);
     callback(null, stream);
   }
}
