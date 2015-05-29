var CacheModel = require('../../models/cache.js')
  , sourceTypes = require('../sources')
  , path = require('path')
  , turf = require('turf')
  , ogr2ogr = require('ogr2ogr')
  , config = require('../../config.json')
  , fs = require('fs-extra');

exports.generateCache = function(cache, filePath, format, callback) {

  sourceTypes.getData(cache.source, 'geojson', function(err, data) {
    var gj = "";
    if (data && data.stream) {
      data.stream.on('data', function(chunk) {
        gj = gj + chunk;
      });

      data.stream.on('end', function(chunk) {
        writeCache(JSON.parse(gj), cache, filePath, format, callback);
      });
    } else if (data && data.file) {
      fs.readFile(data.file, function(err, fileData) {
        gj = JSON.parse(fileData);
        writeCache(gj, cache, filePath, format, callback);
      });
    }
  });
}

function writeCache(gj, cache, filePath, format, callback) {

  var gjCache = {type: "FeatureCollection",features: []};
  cache.vector = true;
  cache.totalFeatures = gj.features.length;

  var poly = cache.geometry;
  for (var i = 0; i < gj.features.length; i++) {
    var feature = gj.features[i];
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
}
