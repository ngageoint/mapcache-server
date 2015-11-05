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
    geoPackage.createTileMatrixTableSync();
    var contentsDao = geoPackage.getContentsDaoSync();

    var srsDao = geoPackage.getSpatialReferenceSystemDaoSync();
    var srsWgs84 = srsDao.getOrCreateSync(4326);
    var srsEpsg3857 = srsDao.getOrCreateSync(3857);

    async.eachSeries(cache.source.dataSources, function iterator(s, callback) {
      if (cache.cacheCreationParams && cache.cacheCreationParams.dataSources && cache.cacheCreationParams.dataSources.indexOf(s.id) == -1) return callback();
      if (s.vector) {
        var propertyColumnNames = [];
        for (var i = 0; i < s.properties.length; i++) {
          propertyColumnNames.push(s.properties[i].key);
        }
        var geometryColumns = createFeatureTable(java, geoPackage, extent, s._id.toString(), propertyColumnNames);

        SourceApi.getFeatures(s, extent[0], extent[1], extent[2], extent[3], 0, function(err, features) {
          // now add the features to the geopackage
          console.log('adding features', features.length);
          var featureDao = geoPackage.getFeatureDaoSync(geometryColumns);


          for (var i = 0; i < features.length; i++) {
            var feature = features[i];

            var featureRow = featureDao.newRowSync();
            for (var propertyKey in feature.properties) {
              featureRow.setValue(propertyKey, ''+feature.properties[propertyKey]);
            }

            var featureGeometry = JSON.parse(feature.geometry);
            var geom = featureGeometry.coordinates;
            var type = featureGeometry.type;
            if (type === 'Point') {
              addPoint(geom, featureRow, java);
            } else if (type === 'MultiPoint') {
              addMultiPoint(geom, featureRow, java);
        		} else if (type === 'LineString') {
        			addLine(geom, featureRow, java);
        		} else if (type === 'MultiLineString') {
              addMultiLine(geom, featureRow, java);
        		} else if (type === 'Polygon') {
        			addPolygon(geom, featureRow, java);
        		} else if (type === 'MultiPolygon') {
        			addMultiPolygon(geom, featureRow, java);
        		}

            featureDao.createSync(featureRow);
          }
          callback();
        });
      } else {
        var TileTable = java.import('mil.nga.geopackage.tiles.user.TileTable');
        var columns = java.callStaticMethodSync('mil.nga.geopackage.tiles.user.TileTable', 'createRequiredColumns');
        var tileTableName = 'TILES_' + s._id.toString();
        var tileTable = new TileTable(tileTableName, columns);

        geoPackage.createTileTableSync(tileTable);



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
            newRow.setZoomLevelSync(java.newLong(tileInfo.z));
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

          var matrixWidth = ((xRangeMinZoom.max - xRangeMinZoom.min) + 1) * Math.pow(2,(zoom - minZoom));
          var matrixHeight = ((yRangeMinZoom.max - yRangeMinZoom.min) + 1) * Math.pow(2,(zoom - minZoom));

          console.log('zoom: %d, matrixheight: %d, matrixwidth: %d', zoom, matrixHeight, matrixWidth);

          var pixelXSize = ((webMercatorBoundingBox.getMaxLongitudeSync() - webMercatorBoundingBox
          .getMinLongitudeSync()) / matrixWidth) / 256;
          var pixelYSize = ((webMercatorBoundingBox.getMaxLatitudeSync() - webMercatorBoundingBox
          .getMinLatitudeSync()) / matrixHeight) / 256;

          var TileMatrix = java.import('mil.nga.geopackage.tiles.matrix.TileMatrix');
  				var tileMatrix = new TileMatrix();
  				tileMatrix.setContentsSync(contents);
  				tileMatrix.setZoomLevelSync(java.newLong(zoom));
  				tileMatrix.setMatrixWidthSync(java.newLong(matrixWidth));
  				tileMatrix.setMatrixHeightSync(java.newLong(matrixHeight));
  				tileMatrix.setTileWidthSync(java.newLong(256));
  				tileMatrix.setTileHeightSync(java.newLong(256));
  				tileMatrix.setPixelXSizeSync(java.newDouble(pixelXSize));
  				tileMatrix.setPixelYSizeSync(java.newDouble(pixelYSize));
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

function createPoint(point, java) {
  var Point = java.import('mil.nga.wkb.geom.Point');
  return new Point(java.newDouble(point[0]), java.newDouble(point[1]));
}

function createMultiPoint(multiPoint, java) {
  var MultiPoint = java.import('mil.nga.wkb.geom.MultiPoint');

  var multiPointGeom = new MultiPoint(false, false);
  for (var i = 0; i < multiPoint.length; i++) {
    multiPointGeom.addPointSync(createPoint(multiPoint[i], java));
  }
  return multiPointGeom;
}

function createLine(line, java) {
  var LineString = java.import('mil.nga.wkb.geom.LineString');

  var lineGeom = new LineString(false, false);
  for (var i = 0; i < line.length; i++) {
    var point = line[i];
    if (point[0] == null || point[1] == null) continue;
    lineGeom.addPointSync(createPoint(point, java));
  }
  return lineGeom;
}

function createMultiLine(multiLine, java) {
  var MultiLineString = java.import('mil.nga.wkb.geom.MultiLineString');

  var multiLineGeom = new MultiLineString(false, false);
  for (var i = 0; i < multiLine.length; i++) {
    var line = multiLine[i];
    multiLineGeom.addLineSync(createLine(line, java));
  }
  return multiLineGeom;
}

function createPolygon(polygon, java) {
  var Polygon = java.import('mil.nga.wkb.geom.Polygon');
  var polygonGeom = new Polygon(false, false);
  for (var ring = 0; ring < polygon.length; ring++) {
		var linearRing = polygon[ring];
		polygonGeom.addRingSync(createLine(linearRing, java));
	}
  return polygonGeom;
}

function createMultiPolygon(multiPolygon, java) {
  var MultiPolygon = java.import('mil.nga.wkb.geom.MultiPolygon');

  var multiPolygonGeom = new MultiPolygon(false, false);
  for (var polygon = 0; polygon < multiPolygon.length; polygon++) {
    multiPolygonGeom.addLineSync(createPolygon(multiPolygon[polygon], java));
  }
  return multiPolygonGeom;
}

function addPoint(point, featureRow, java) {
  var GeoPackageGeometryData = java.import('mil.nga.geopackage.geom.GeoPackageGeometryData');
  var geometryData = new GeoPackageGeometryData(3857);
  geometryData.setGeometrySync(createPoint(point, java));
  featureRow.setGeometrySync(geometryData);
}

function addMultiPoint(multiPoint, featureRow, java) {
  var GeoPackageGeometryData = java.import('mil.nga.geopackage.geom.GeoPackageGeometryData');

  var geometryData = new GeoPackageGeometryData(3857);
  geometryData.setGeometrySync(createMultiPoint(multiPoint, java));
  featureRow.setGeometrySync(geometryData);
}

function addLine(line, featureRow, java) {
  var GeoPackageGeometryData = java.import('mil.nga.geopackage.geom.GeoPackageGeometryData');

  var geometryData = new GeoPackageGeometryData(3857);
  geometryData.setGeometrySync(createLine(line, java));
  featureRow.setGeometrySync(geometryData);
}

function addMultiLine(multiLine, featureRow, java) {
  var GeoPackageGeometryData = java.import('mil.nga.geopackage.geom.GeoPackageGeometryData');

  var geometryData = new GeoPackageGeometryData(3857);
  geometryData.setGeometrySync(createMultiLine(multiLine, java));
  featureRow.setGeometrySync(geometryData);
}

function addPolygon(polygon, featureRow, java) {
  var GeoPackageGeometryData = java.import('mil.nga.geopackage.geom.GeoPackageGeometryData');

  var geometryData = new GeoPackageGeometryData(3857);
  geometryData.setGeometrySync(createPolygon(polygon, java));
  featureRow.setGeometrySync(geometryData);
}

function addMultiPolygon(multiPolygon, featureRow, java) {
  var GeoPackageGeometryData = java.import('mil.nga.geopackage.geom.GeoPackageGeometryData');

  var geometryData = new GeoPackageGeometryData(3857);
  geometryData.setGeometrySync(createMultiPolygon(multiPolygon, java));
  featureRow.setGeometrySync(geometryData);
}

function createFeatureTable(java, geoPackage, extent, sourceId, propertyColumnNames) {

  var ArrayList = java.import('java.util.ArrayList');
  var FeatureTable = java.import('mil.nga.geopackage.features.user.FeatureTable');
  var Date = java.import('java.util.Date');
  var GeometryColumns = java.import('mil.nga.geopackage.features.columns.GeometryColumns');
  var BoundingBox = java.import('mil.nga.geopackage.BoundingBox');
  var Contents = java.import('mil.nga.geopackage.core.contents.Contents');

  var tableName = 'FEATURES_' + sourceId;

  var srsDao = geoPackage.getSpatialReferenceSystemDaoSync();
  var srsEpsg3857 = srsDao.getOrCreateSync(3857);

  geoPackage.createGeometryColumnsTableSync();

  var columns = new ArrayList();
  columns.addSync(java.callStaticMethodSync('mil.nga.geopackage.features.user.FeatureColumn', 'createPrimaryKeyColumn', 0, 'id'));
  columns.addSync(java.callStaticMethodSync('mil.nga.geopackage.features.user.FeatureColumn', 'createGeometryColumn', 1, 'geom', java.callStaticMethodSync('mil.nga.wkb.geom.GeometryType', 'fromName', 'GEOMETRY'), false, null));
  for (var i = 0; i < propertyColumnNames.length; i++) {
    columns.addSync(java.callStaticMethodSync('mil.nga.geopackage.features.user.FeatureColumn', 'createColumn', i+2, propertyColumnNames[i], java.callStaticMethodSync('mil.nga.geopackage.db.GeoPackageDataType', 'fromName', 'TEXT'), false, null));
  }

  var featureTable = new FeatureTable(tableName, columns);
  geoPackage.createFeatureTableSync(featureTable);

  var epsg3857ll = proj4('EPSG:3857', [extent[0], extent[1]]);
  var epsg3857ur = proj4('EPSG:3857', [extent[2], extent[3]]);

  var contents = new Contents();
  contents.setTableNameSync(tableName);
  contents.setDataTypeSync(java.callStaticMethodSync('mil.nga.geopackage.core.contents.ContentsDataType', 'fromName', 'features'));
  contents.setIdentifierSync(tableName);
  // contents.setDescription("");
  contents.setLastChange(new Date());
  contents.setMinXSync(java.newDouble(epsg3857ll[0]));
  contents.setMinYSync(java.newDouble(epsg3857ll[1]));
  contents.setMaxXSync(java.newDouble(epsg3857ur[0]));
  contents.setMaxYSync(java.newDouble(epsg3857ur[1]));
  contents.setSrsSync(srsEpsg3857);
  geoPackage.getContentsDaoSync().createSync(contents);


  var geometryColumns = new GeometryColumns();
  geometryColumns.setContentsSync(contents);
  geometryColumns.setSrsSync(contents.getSrsSync());
  geometryColumns.setGeometryTypeSync(java.callStaticMethodSync('mil.nga.wkb.geom.GeometryType', 'fromName', 'GEOMETRY'));
  geometryColumns.setColumnNameSync('geom');
  geoPackage.getGeometryColumnsDaoSync().create(geometryColumns);

  return geometryColumns;


  // FeatureTable table = buildFeatureTable(contents.getTableName(),
	// 			geometryColumn, geometryType);
  //
  //
  //   List<FeatureColumn> columns = new ArrayList<FeatureColumn>();
  //
	// 	columns.add(FeatureColumn.createPrimaryKeyColumn(0, "id"));
	// 	columns.add(FeatureColumn.createColumn(7, "test_text_limited",
	// 			GeoPackageDataType.TEXT, 5L, false, null));
	// 	columns.add(FeatureColumn.createColumn(8, "test_blob_limited",
	// 			GeoPackageDataType.BLOB, 7L, false, null));
	// 	columns.add(FeatureColumn.createGeometryColumn(1, geometryColumn,
	// 			geometryType, false, null));
	// 	columns.add(FeatureColumn.createColumn(2, "test_text",
	// 			GeoPackageDataType.TEXT, false, ""));
	// 	columns.add(FeatureColumn.createColumn(3, "test_real",
	// 			GeoPackageDataType.REAL, false, null));
	// 	columns.add(FeatureColumn.createColumn(4, "test_boolean",
	// 			GeoPackageDataType.BOOLEAN, false, null));
	// 	columns.add(FeatureColumn.createColumn(5, "test_blob",
	// 			GeoPackageDataType.BLOB, false, null));
	// 	columns.add(FeatureColumn.createColumn(6, TEST_INTEGER_COLUMN,
	// 			GeoPackageDataType.INTEGER, false, null));
  //
	// 	FeatureTable table = new FeatureTable(tableName, columns);
	// 	geoPackage.createFeatureTable(table);
  //
	// 	double random = Math.random();
  //
	// 	DataColumnsDao dataColumnsDao = geoPackage.getDataColumnsDao();
	// 	DataColumns dataColumns = new DataColumns();
	// 	dataColumns.setContents(contents);
	// 	dataColumns.setColumnName(TEST_INTEGER_COLUMN);
	// 	dataColumns.setName("TEST_NAME");
	// 	dataColumns.setTitle("TEST_TITLE");
	// 	dataColumns.setDescription("TEST_DESCRIPTION");
	// 	dataColumns.setMimeType("TEST_MIME_TYPE");
  //
	// 	if (random < (1.0 / 3.0)) {
	// 		dataColumns.setConstraintName(SAMPLE_RANGE_CONSTRAINT);
	// 	} else if (random < (2.0 / 3.0)) {
	// 		dataColumns.setConstraintName(SAMPLE_ENUM_CONSTRAINT);
	// 	} else {
	// 		dataColumns.setConstraintName(SAMPLE_GLOB_CONSTRAINT);
	// 	}
  //
	// 	dataColumnsDao.create(dataColumns);
}

exports.deleteCache = function(cache, callback) {
  fs.remove(config.server.cacheDirectory.path + "/" + cache._id + "/" + cache._id + ".gpkg", function(err) {
    callback(err, cache);
  });
}
