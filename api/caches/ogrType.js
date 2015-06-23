var CacheModel = require('../../models/cache.js')
  , sourceTypes = require('../sources')
  , path = require('path')
  , turf = require('turf')
  , ogr2ogr = require('ogr2ogr')
  , config = require('../../config.json')
  , fs = require('fs-extra');

  exports.generateCache = function(cache, minZoom, maxZoom, callback) {
    CacheModel.getCacheById(cache.id, function(err, cache) {
      // ensure there is already an xyz cache generated
      if (cache.formats && cache.formats.xyz && !cache.formats.xyz.generating) {
        var geoPackageFile = path.join(config.server.cacheDirectory.path, cache._id.toString(), cache._id + ".gpkg");
        console.log('running ' + './utilities/geopackage-python-4.0/Packaging/tiles2gpkg_parallel.py -tileorigin ul -srs 3857 ' + path.join(config.server.cacheDirectory.path, cache._id.toString()) + " " + geoPackageFile);
        var python = exec(
          './utilities/geopackage-python-4.0/Packaging/tiles2gpkg_parallel.py -tileorigin ul -srs 3857 ' + path.join(config.server.cacheDirectory.path, cache._id.toString()) + " " + geoPackageFile,
          function(error, stdout, stderr) {
            callback(error, {cache: cache, file: geoPackageFile});
          }
        );
      } else {
        console.log('XYZ cache is not done generating, waiting 30 seconds to generate a geopackage...');
        setTimeout(exports.generateCache, 30000, cache, minZoom, maxZoom, callback);
      }
    });
  }


exports.generateCache = function(cache, filePath, format, callback) {

  // first see if there is already a geojson cache that exists that we can use
  var geojsonFile = path.join(config.server.cacheDirectory.path, cache._id.toString(), cache._id + ".geojson");

  if (fs.existsSync(geojsonFile)) {
    translateGeoJSON(ogr2ogr(geojsonFile), cache, filePath, format, callback);
  } else if (cache.formats && cache.formats.geojson && cache.formats.geojson.generating) {
    // just wait for it
    setTimeout(exports.generateCache, 30000, cache, filePath, format, callback);
  } else {
    // otherwise go use the source
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
}

function writeCache(gj, cache, filePath, format, callback) {

  var gjCache = {type: "FeatureCollection",features: []};
  cache.vector = true;
  cache.totalFeatures = gj.features.length;

  var poly = cache.geometry;
  for (var i = 0; i < gj.features.length; i++) {
    var feature = gj.features[i];
    try {
      var intersection = turf.intersect(poly, feature);
      if (intersection) {
        cache.generatedFeatures++;
        gjCache.features.push(feature);
      }
    } catch (e) {
      console.log('feature error', feature);
      console.log('error turfing', e);
    }
  }
  translateGeoJSON(ogr2ogr(gjCache), cache, filePath, format, callback);
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
