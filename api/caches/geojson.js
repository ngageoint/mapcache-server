var CacheModel = require('../../models/cache.js')
  , sourceTypes = require('../sources')
  , fs = require('fs-extra');

exports.getCacheData = function(cache, minZoom, maxZoom, callback) {

  var geojsonFile = path.join(config.server.cacheDirectory.path, foundCache._id, foundCache._id + ".geojson");

  if (!fs.existsSync(geojsonFile)) {
    var child = require('child_process').fork('api/caches/creator.js');
    child.send({operation:'generateCache', cache: cache, format: 'geojson', minZoom: minZoom, maxZoom: maxZoom});
    callback(null, {creating: true});
  } else {
    var stream = fs.createReadStream(geojsonFile);
    callback(null, {stream: stream});
  }
}

exports.createCache = function(cache, minZoom, maxZoom, callback) {
  var geojsonFile = path.join(config.server.cacheDirectory.path, foundCache._id, foundCache._id + ".geojson");
  CacheModel.updateFormatGenerating(cache, 'geojson', function(err) {

    sourceTypes.getData(cache.source, function(err, data) {
      if (data) {
        data = JSON.parse(data);
        var gjCache = {type: "FeatureCollection",features: []};

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
            cache.status.complete = true;
            cache.save(function() {
              CacheModel.updateFormatCreated(cache, 'geojson', geojsonFile, function(err) {
                console.log('saved to ' + geojsonFile);
                callback(null, geojsonFile);
              });
            });
          });
        });
      }
    });
  });
}
