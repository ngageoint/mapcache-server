var CacheModel = require('../../models/cache.js')
  , FeatureModel = require('../../models/feature.js')
  , async = require('async')
  , sourceTypes = require('../sources')
  , path = require('path')
  , request = require('request')
  , turf = require('turf')
  , tile = require('mapcahce-tile')
  , config = require('mapcache-config')
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

exports.getTile = function(cache, format, z, x, y, callback) {
  return tile.getVectorTile(cache, format, z, x, y, null, callback);
}

exports.generateCache = function(cache, minZoom, maxZoom, cacheGenerated) {
  var extent = turf.extent(cache.geometry);

  FeatureModel.getAllCacheFeatures(cache.id, function(err, features) {
    console.log('XXXXXXXXXXXXX there are ' + features.length + ' features in the cache');
    var geojsonFile = path.join(config.server.cacheDirectory.path, cache._id.toString(), cache._id + ".geojson");
    fs.mkdirs(path.dirname(geojsonFile), function (err) {
      if (err) return console.error(err);
      console.log("success!");
      var writeStream = fs.createWriteStream(geojsonFile);

      writeStream.on('finish', function() {
        console.log('finished writing the file');
        cache.vector = true;
        cache.totalFeatures = features.length;
        cache.generatedFeatures = features.length;
        cache.save(function() {
          cacheGenerated(null, {file: geojsonFile, cache: cache});
        });
      });

      writeStream.write('{type: "FeatureCollection", features:[');

      async.forEachOf(features, function iterator(feature, index, featureDone) {
        console.log('writing feature number ' + index);
        writeStream.write(JSON.stringify(feature));
        if (index != features.length-1) {
          writeStream.write(',')
        }
        async.setImmediate(function() {
          featureDone();
        });

      }, function done() {
        writeStream.write(']}');
        writeStream.end();

      });
    });
  });
}

exports.deleteCache = function(cache, callback) {
  fs.remove(config.server.cacheDirectory.path + "/" + cache._id + "/" + cache._id + ".geojson", function(err) {
    callback(err, cache);
  });
}
