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
  var java = require('java');
  var mvn = require('node-java-maven');

  var extent = turf.extent(cache.geometry);
  extent[0] = Math.max(-180, extent[0]);
  extent[1] = Math.max(-85, extent[1]);
  extent[2] = Math.min(180, extent[2]);
  extent[3] = Math.min(85, extent[3]);

  mvn(function(err, mvnResults) {
    if (err) {
      return console.error('could not resolve maven dependencies', err);
    }
    mvnResults.classpath.forEach(function(c) {
      console.log('adding ' + c + ' to classpath');
      java.classpath.push(c);
    });

    var File = java.import('java.io.File');

    // var geoPackageFile = path.join(config.server.cacheDirectory.path, cache._id.toString(), cache._id + ".gpkg");
    var geoPackageFile = config.server.cacheDirectory.path + "/" + cache._id + "/" + cache._id + ".gpkg";

    var gpkgFile = new File(geoPackageFile);
    java.callStaticMethodSync('mil.nga.geopackage.manager.GeoPackageManager', 'create', gpkgFile);

    var geoPackage = java.callStaticMethodSync('mil.nga.geopackage.manager.GeoPackageManager', 'open', gpkgFile);
    geoPackage.createTileMatrixSetTableSync();
    geoPackage.createTileMatrixTable();

    async.eachSeries(cache.source.dataSources, function iterator(s, callback) {
      if (cache.cacheCreationParams && cache.cacheCreationParams.dataSources && cache.cacheCreationParams.dataSources.indexOf(s.id) == -1) return callback();
      if (s.vector) {
        SourceApi.getFeatures(s, extent[0], extent[1], extent[2], extent[3], 0, function(err, features) {
          // now add the features to the geopackage
        });
      } else {
        var TileTable = java.import('mil.nga.geopackage.tiles.user.TileTable');
        var columns = java.callStaticMethodSync('mil.nga.geopackage.tiles.user.TileTable', 'createRequiredColumns');
        var tileTableName = 'TILES_' + s._id.toString();
        var tileTable = new TileTable(tileTableName, columns);

        geoPackage.createTileTableSync(tileTable);

        var srsDao = geoPackage.getSpatialReferenceSystemDaoSync();

        var srsWgs84 = srsDao.getOrCreateSync(4326);
        var srsEpsg3857 = srsDao.getOrCreateSync(3857);

        var xRangeMinZoom = tileUtilities.xCalculator(extent, minZoom);
        var yRangeMinZoom = tileUtilities.yCalculator(extent, minZoom);

        var llCorner = tileUtilities.tileBboxCalculator(xRangeMinZoom.min, yRangeMinZoom.max, minZoom);
        var urCorner = tileUtilities.tileBboxCalculator(xRangeMinZoom.max, yRangeMinZoom.min, minZoom);
        var totalTileExtent = [llCorner.west, llCorner.south, urCorner.east, urCorner.north];
        console.log('ur ', urCorner);
        console.log('yrange', yRangeMinZoom);
        console.log('xrange', xRangeMinZoom);

        var epsg3857ll = proj4('EPSG:3857', [llCorner.west, llCorner.south]);
        var epsg3857ur = proj4('EPSG:3857', [urCorner.east, urCorner.north]);
        console.log('epsgur', epsg3857ur);


        // Create new Contents
    		var contentsDao = geoPackage.getContentsDaoSync();
        var Contents = java.import('mil.nga.geopackage.core.contents.Contents');
    		var contents = new Contents();
    		contents.setTableNameSync(tileTableName);
    		contents.setDataTypeSync(java.callStaticMethodSync('mil.nga.geopackage.core.contents.ContentsDataType', 'fromName', 'tiles'));
    		contents.setIdentifierSync(tileTableName);
    		// contents.setDescription("");

        var Date = java.import('java.util.Date');
    		contents.setLastChange(new Date());
    		contents.setMinXSync(llCorner.west);
    		contents.setMinYSync(llCorner.south);
    		contents.setMaxXSync(urCorner.east);
    		contents.setMaxYSync(urCorner.north);
    		contents.setSrsSync(srsWgs84);

    		// Create the contents
    		contentsDao.createSync(contents);

    		// Create new Tile Matrix Set
    		var tileMatrixSetDao = geoPackage.getTileMatrixSetDaoSync();

        var TileMatrixSet = java.import('mil.nga.geopackage.tiles.matrixset.TileMatrixSet');
    		var tileMatrixSet = new TileMatrixSet();
    		tileMatrixSet.setContentsSync(contents);
    		tileMatrixSet.setSrsSync(srsEpsg3857);
    		tileMatrixSet.setMinXSync(epsg3857ll[0]);
    		tileMatrixSet.setMinYSync(epsg3857ll[1]);
    		tileMatrixSet.setMaxXSync(epsg3857ur[0]);
    		tileMatrixSet.setMaxYSync(epsg3857ur[1]);
    		tileMatrixSetDao.createSync(tileMatrixSet);

    		// Create new Tile Matrix and tile table rows by going through each zoom
    		// level
    		var tileMatrixDao = geoPackage.getTileMatrixDaoSync();
    		var tileDao = geoPackage.getTileDaoSync(tileMatrixSet);

        var BoundingBox = java.import('mil.nga.geopackage.BoundingBox');
        var webMercatorBoundingBox = new BoundingBox(epsg3857ll[0], epsg3857ur[0], epsg3857ll[1], epsg3857ur[1]);

        var matrixWidth = 0;
        var matrixHeight = 0;

        console.log('web mercator bounding box: %d, %d, %d, %d', epsg3857ll[0], epsg3857ur[0], epsg3857ll[1], epsg3857ur[1]);

        xyzTileWorker.createXYZTiles(cache, minZoom, maxZoom, function(tileInfo, tileDone) {
          SourceApi.getTileFromDataSource(s, 'png', tileInfo.z, tileInfo.x, tileInfo.y, cache.cacheCreationParams, function(err, tileStream) {
            if (!tileStream) return callback();
            // optimize this to not do this on every tile
            console.log('totalTileExtent', totalTileExtent);
            var xRange = tileUtilities.xCalculator(totalTileExtent, tileInfo.z);
            var yRange = tileUtilities.yCalculator(totalTileExtent, tileInfo.z);

            var tileRow = tileInfo.y - yRange.min;
            var tileColumn = tileInfo.x - xRange.min;

            var newRow = tileDao.newRowSync();
            newRow.setZoomLevelSync(tileInfo.z);
            newRow.setTileColumnSync(java.newLong(tileColumn));
            newRow.setTileRowSync(java.newLong(tileRow));

            console.log('Setting the row and column for x %d, y %d, z %d, to row %d, column %d', tileInfo.x, tileInfo.y, tileInfo.z, tileRow, tileColumn);

            toArray(tileStream, function (err, parts) {
              var byteArray = [];
              for (var k = 0; k < parts.length; k++) {
                var part = parts[k];
                for (var i = 0; i < part.length; i++) {
                  var bufferPiece = part[i];
                  var byte = java.newByte(bufferPiece);
                  byteArray.push(byte);
                }
              }
              var bytes = java.newArray('byte', byteArray);
              newRow.setTileDataSync(bytes);
              console.log('adding data to zoom %d, row %d, column %d', tileInfo.z, tileRow, tileColumn);
              console.log('new row row number', newRow.getTileRowSync());
              tileDao.createSync(newRow);
              tileDone();
            });
          });
        }, function(cache, continueCallback) {
          CacheModel.shouldContinueCaching(cache, continueCallback);
        }, function(cache, zoom, zoomDoneCallback) {

          var xRange = tileUtilities.xCalculator(totalTileExtent, zoom);
          var yRange = tileUtilities.yCalculator(totalTileExtent, zoom);

          var matrixWidth = ((xRangeMinZoom.max - xRangeMinZoom.min) + 1) * (zoom - minZoom + 1);
          var matrixHeight = ((yRangeMinZoom.max - yRangeMinZoom.min) + 1) * (zoom - minZoom + 1);

          console.log('zoom: %d, matrixheight: %d, matrixwidth: %d', zoom, matrixHeight, matrixWidth);

          var pixelXSize = ((webMercatorBoundingBox.getMaxLongitudeSync() - webMercatorBoundingBox
          .getMinLongitudeSync()) / matrixWidth) / 256;
          var pixelYSize = ((webMercatorBoundingBox.getMaxLatitudeSync() - webMercatorBoundingBox
          .getMinLatitudeSync()) / matrixHeight) / 256;

          var TileMatrix = java.import('mil.nga.geopackage.tiles.matrix.TileMatrix');
  				var tileMatrix = new TileMatrix();
  				tileMatrix.setContentsSync(contents);
  				tileMatrix.setZoomLevelSync(zoom);
  				tileMatrix.setMatrixWidthSync(matrixWidth);
  				tileMatrix.setMatrixHeightSync(matrixHeight);
  				tileMatrix.setTileWidthSync(256);
  				tileMatrix.setTileHeightSync(256);
  				tileMatrix.setPixelXSizeSync(pixelXSize);
  				tileMatrix.setPixelYSizeSync(pixelYSize);
  				tileMatrixDao.createSync(tileMatrix);
          zoomDoneCallback();
          // CacheModel.updateZoomLevelStatus(cache, zoom, function(err) {
          //   zoomDoneCallback();
          // });
        }, function(err, cache) {
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
      }
    }, function done() {
      callback(null, {cache: cache, file: geoPackageFile});
    });
  });
}

exports.deleteCache = function(cache, callback) {
  fs.remove(config.server.cacheDirectory.path + "/" + cache._id + "/" + cache._id + ".gpkg", function(err) {
    callback(err, cache);
  });
}
