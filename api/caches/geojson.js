var CacheModel = require('../../models/cache.js')
  , sourceTypes = require('../sources')
  , path = require('path')
  , turf = require('turf')
  , config = require('../../config.json')
  , fs = require('fs-extra');

exports.getCacheData = function(cache, minZoom, maxZoom, callback) {
  var geojsonFile = path.join(config.server.cacheDirectory.path, cache._id.toString(), cache._id + ".geojson");

  if (!fs.existsSync(geojsonFile)) {
    var child = require('child_process').fork('api/caches/creator.js');
    child.send({operation:'generateCache', cache: cache, format: 'geojson', minZoom: minZoom, maxZoom: maxZoom});
    callback(null, {creating: true});
  } else {
    var stream = fs.createReadStream(geojsonFile);
    callback(null, {stream: stream, extension: '.geojson'});
  }
}

exports.generateCache = function(cache, minZoom, maxZoom, callback) {
  var geojsonFile = path.join(config.server.cacheDirectory.path, cache._id.toString(), cache._id + ".geojson");

  sourceTypes.getData(cache.source, 'geojson', function(err, data) {
    if (data && data.file) {
      fs.readFile(data.file, function(err, fileData) {
        data = JSON.parse(fileData);
        var gjCache = {type: "FeatureCollection",features: []};
        cache.vector = true;
        cache.totalFeatures = data.features.length;

        var poly = cache.geometry;
        for (var i = 0; i < data.features.length; i++) {
          var feature = data.features[i];
          var intersection = turf.intersect(poly, feature);
          if (intersection) {
            cache.generatedFeatures++;
            gjCache.features.push(feature);
          }
        }
        fs.mkdirs(path.dirname(geojsonFile), function (err) {
          if (err) return console.error(err);
          console.log("success!");

          fs.writeFile(geojsonFile, JSON.stringify(gjCache), function(err) {
            cache.save(function() {
              callback(null, {file: geojsonFile, cache: cache});
            });
          });
        });
      });
    }
  });
}
