var CacheModel = require('../../models/cache.js')
  , path = require('path')
  , SourceApi = require('../sources')
  , exec = require('child_process').exec
  , config = require('../../config.js')
  , tileUtilities = require('../tileUtilities')
  , turf = require('turf')
  , proj4 = require('proj4')
  , async = require('async')
  , toArray = require('stream-to-array')
  , xyzTileWorker = require('../xyzTileWorker')
  , GeoPackage = require('../../geopackage/geopackage')
  , fs = require('fs-extra');

exports.getCacheData = function(cache, minZoom, maxZoom, callback) {
  var geoPackageFile = path.join(config.server.cacheDirectory.path, cache._id.toString(), cache._id + ".gpkg");
  if (!fs.existsSync(geoPackageFile)) {
    var child = require('child_process').fork('api/caches/creator.js');
    child.send({operation:'generateCache', cache: cache, format: 'geopackage', minZoom: minZoom, maxZoom: maxZoom});
    callback(null, {creating: true});
  } else {
    var stream = fs.createReadStream(geoPackageFile);
    callback(null, {stream: stream, extension: '.gpkg'});
  }
}

exports.generateCache = function(cache, minZoom, maxZoom, callback) {
  var extent = turf.extent(cache.geometry);
  extent[0] = Math.max(-180, extent[0]);
  extent[1] = Math.max(-85, extent[1]);
  extent[2] = Math.min(180, extent[2]);
  extent[3] = Math.min(85, extent[3]);

  var filePath = config.server.cacheDirectory.path + "/" + cache._id + "/" + cache._id + ".gpkg";
  var geoPackage = new GeoPackage();
  geoPackage.createAndOpenGeoPackageFile(filePath, function() {
    console.log('geoPackage is created and open');


  async.eachSeries(cache.source.dataSources, function iterator(s, callback) {
    if (cache.cacheCreationParams && cache.cacheCreationParams.dataSources && cache.cacheCreationParams.dataSources.indexOf(s.id) == -1) return callback();
    if (s.vector) {
      var propertyColumnNames = [];
      for (var i = 0; i < s.properties.length; i++) {
        propertyColumnNames.push(s.properties[i].key);
      }
      var tableName = 'FEATURES_'+s._id.toString();
      geoPackage.createFeatureTable(extent, tableName, propertyColumnNames, function(err) {
        SourceApi.getFeatures(s, extent[0], extent[1], extent[2], extent[3], 0, function(err, features) {
          geoPackage.addFeaturesToGeoPackage(features, tableName, function(err) {
            geoPackage.indexGeoPackage(tableName, features.length, callback);
          });
        });
      });
    } else {

      var tableName = 'TILES_' + s._id.toString();
      var xRangeMinZoom = tileUtilities.xCalculator(extent, minZoom);
      var yRangeMinZoom = tileUtilities.yCalculator(extent, minZoom);

      var llCorner = tileUtilities.tileBboxCalculator(xRangeMinZoom.min, yRangeMinZoom.max, minZoom);
      var urCorner = tileUtilities.tileBboxCalculator(xRangeMinZoom.max, yRangeMinZoom.min, minZoom);
      var totalTileExtent = [llCorner.west, llCorner.south, urCorner.east, urCorner.north];

      geoPackage.createTileTable(extent, tableName, minZoom, maxZoom, function() {

        xyzTileWorker.createXYZTiles(cache, minZoom, maxZoom, function(tileInfo, tileDone) {
          console.log('tileInfo', tileInfo);
          SourceApi.getTileFromDataSource(s, 'png', tileInfo.z, tileInfo.x, tileInfo.y, cache.cacheCreationParams, function(err, tileStream) {
            if (!tileStream) return callback();
            // optimize this to not do this on every tile
            console.log('totalTileExtent', totalTileExtent);
            var xRange = tileUtilities.xCalculator(totalTileExtent, tileInfo.z);
            var yRange = tileUtilities.yCalculator(totalTileExtent, tileInfo.z);

            var tileRow = tileInfo.y - yRange.min;
            var tileColumn = tileInfo.x - xRange.min;

            geoPackage.addTileToGeoPackage(tileStream, tableName, tileInfo.z, tileRow, tileColumn, tileDone);
          });
        }, function(cache, continueCallback) {
          CacheModel.shouldContinueCaching(cache, continueCallback);
        }, function(cache, zoom, zoomDoneCallback) {
          zoomDoneCallback();
          // CacheModel.updateZoomLevelStatus(cache, zoom, function(err) {
          //   zoomDoneCallback();
          // });
        }, function(err, cache) {
          // geoPackage.addTileMatrices(extent, minZoom, maxZoom, callback)
          callback();
          // CacheModel.getCacheById(cache.id, function(err, foundCache) {
          //   CacheModel.updateFormatCreated(foundCache, 'xyz', foundCache.totalTileSize, function(err, cache) {
          //     cache.status.complete = true;
          //     cache.save(function() {
          //       callback(null, cache);
          //     });
          //   });
          // });
        });
      });
    }

  }, function done() {
    callback(null, {cache: cache, file: filePath});
  });
});
}

exports.deleteCache = function(cache, callback) {
  fs.remove(config.server.cacheDirectory.path + "/" + cache._id + "/" + cache._id + ".gpkg", function(err) {
    callback(err, cache);
  });
}
