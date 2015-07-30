var CacheModel = require('../../models/cache.js')
  , sourceTypes = require('../sources')
  , path = require('path')
  , request = require('request')
  , turf = require('turf')
  , tileUtilities = require('../tileUtilities')
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

exports.getTile = function(cache, format, z, x, y, callback) {
  return tileUtilities.getVectorTile(cache, format, z, x, y, null, callback);
}

exports.generateCache = function(cache, minZoom, maxZoom, callback) {
  sourceTypes.getData(cache.source, 'geojson', function(err, data) {
    var gj = "";
    if (data && data.stream) {
      data.stream.on('data', function(chunk) {
        gj = gj + chunk;
      });

      data.stream.on('end', function(chunk) {
        writeCache(JSON.parse(gj), cache, callback);
      });
    } else if (data && data.file) {
      fs.readFile(data.file, function(err, fileData) {
        gj = JSON.parse(fileData);
        writeCache(gj, cache, callback);
      });
    }
  });
}

function writeCache(gj, cache, callback) {
  var geojsonFile = path.join(config.server.cacheDirectory.path, cache._id.toString(), cache._id + ".geojson");

  var gjCache = {type: "FeatureCollection",features: []};
  cache.vector = true;
  cache.totalFeatures = 0;//gj.features.length;

  var poly = cache.geometry;
  console.log('there are ' + gj.features.length + ' features to look through');
  for (var i = 0; i < gj.features.length; i++) {
    var feature = gj.features[i];
    try {
      var intersection = turf.intersect(poly, feature);
      if (intersection) {
        console.log('adding feature');
        cache.generatedFeatures++;
        gjCache.features.push(feature);
      }
    } catch (e) {
      console.log('feature error', feature);
      console.log('error turfing', e);
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
}

exports.deleteCache = function(cache, callback) {
  fs.remove(config.server.cacheDirectory.path + "/" + cache._id + "/" + cache._id + ".geojson", function(err) {
    callback(err, cache);
  });
}
