var CacheModel = require('../../models/cache.js')
  , sourceTypes = require('../sources')
  , path = require('path')
  , turf = require('turf')
  , ogr2ogr = require('ogr2ogr')
  , config = require('../../config.json')
  , fs = require('fs-extra');

exports.generateCache = function(cache, filePath, format, callback) {

  sourceTypes.getData(cache.source, 'geojson', function(err, data) {
    if (data && data.file) {
      fs.readFile(data.file, function(err, fileData) {
        data = JSON.parse(fileData);
        var gjCache = {type: "FeatureCollection",features: []};

        cache.totalFeatures = data.features.length;
        cache.vector = true;
        var poly = cache.geometry;
        for (var i = 0; i < data.features.length; i++) {
          var feature = data.features[i];
          var intersection = turf.intersect(poly, feature);
          if (intersection) {
            cache.generatedFeatures++;
            gjCache.features.push(feature);
          }
        }
        fs.mkdirs(path.dirname(filePath), function (err) {
          if (err) return console.error(err);
          console.log("success!");

          var sf = ogr2ogr(gjCache).format(format).skipfailures().stream();
          var writeStream = fs.createWriteStream(filePath);
          writeStream.on('finish', function() {
            cache.save(function() {
              callback(null, {file: filePath, cache: cache});
            });
          });
          sf.pipe(writeStream);
        });
      });
    }
  });
}
