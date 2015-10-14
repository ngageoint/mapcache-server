var FeatureModel = require('../../models/feature')
  , path = require('path')
  , ogr2ogr = require('ogr2ogr')
  , config = require('../../config.js')
  , fs = require('fs-extra');

exports.generateCache = function(cache, filePath, format, callback) {

  FeatureModel.getAllCacheFeatures(cache.id, function(err, features) {
    cache.vector = true;
    cache.totalFeatures = features.length;
    translateGeoJSON(ogr2ogr({type: "FeatureCollection", features:features}), cache, filePath, format, function(err, info) {
      cache.generatedFeatures = features.length;
      cache.save(function() {
        callback(err, info);
      });
    });
  });
}

function translateGeoJSON(ogr, cache, filePath, format, callback) {
  fs.mkdirs(path.dirname(filePath), function (err) {
    if (err) return console.error(err);
    console.log("success!");

    var sf = ogr.format(format).skipfailures().stream();
    var writeStream = fs.createWriteStream(filePath);
    writeStream.on('finish', function() {
      cache.save(function() {
        callback(null, {file: filePath, cache: cache});
      });
    });
    sf.pipe(writeStream);
  });
}
