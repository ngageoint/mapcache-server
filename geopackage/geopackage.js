var java = require('java')
  , mvn = require('node-java-maven')
  , proj4 = require('proj4')
  , async = require('async')
  , toArray = require('stream-to-array')
  , tileUtilities = require('../api/tileUtilities')
  , q = require('q');

var GeoPackage = function() {
  this.featureDaos = {};
  this.tileDaos = {};
  this.tableProperties = {};
  this.initDefer = q.defer();
  this.initPromise = this.initDefer.promise;
  this.initialize();
}

GeoPackage.prototype.initialize = function() {
  var self = this;
  mvn(function(err, mvnResults) {
    if (err) {
      return console.error('could not resolve maven dependencies', err);
    }
    mvnResults.classpath.forEach(function(c) {
      console.log('adding ' + c + ' to classpath');
      java.classpath.push(c);
    });
    self.initialized = true;
    console.log('resolving promise');
    self.initDefer.resolve(self);
  });
}

GeoPackage.prototype.createAndOpenGeoPackageFile = function(filePath, callback) {
  console.log('opening geopackage ' + filePath);
  this.initPromise.then(function(self) {
    console.log('promise returned', self);
    var File = java.import('java.io.File');
    var gpkgFile = new File(filePath);
    java.callStaticMethodSync('mil.nga.geopackage.manager.GeoPackageManager', 'create', gpkgFile);
    self.geoPackage = java.callStaticMethodSync('mil.nga.geopackage.manager.GeoPackageManager', 'open', gpkgFile);
    self.geoPackage.createTileMatrixSetTableSync();
    self.geoPackage.createTileMatrixTableSync();

    var srsDao = self.geoPackage.getSpatialReferenceSystemDaoSync();
    var srsWgs84 = srsDao.getOrCreateSync(4326);
    var srsEpsg3857 = srsDao.getOrCreateSync(3857);
    callback();
  }).done();
}

GeoPackage.prototype.addTileToGeoPackage = function(tileStream, tableName, zoom, tileRow, tileColumn, callback) {
  this.initPromise.then(function(self) {
    var tileDao = self.tileDaos[tableName];

    var newRow = tileDao.newRowSync();
    newRow.setZoomLevelSync(java.newLong(zoom));
    newRow.setTileColumnSync(java.newLong(tileColumn));
    newRow.setTileRowSync(java.newLong(tileRow));

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
      tileDao.createSync(newRow);
      callback();
    });
  }).done();
}

GeoPackage.prototype.addFeaturesToGeoPackage = function(features, tableName, callback) {
  console.log('adding %d features to geopackage table %s', features.length, tableName);
  this.initPromise.then(function(self) {
    console.log('self', self);
    var featureDao = self.featureDaos[tableName];
    console.log('feature dao is', featureDao);

    // now add the features to the geopackage
    console.log('adding features', features.length);

    async.eachSeries(features, function iterator(feature, callback) {

      async.setImmediate(function() {

        var featureRow = featureDao.newRowSync();
        for (var propertyKey in feature.properties) {
          featureRow.setValue(self.tableProperties[tableName][propertyKey], ''+feature.properties[propertyKey]);
        }

        var featureGeometry = JSON.parse(feature.geometry);
        var geom = featureGeometry.coordinates;
        var type = featureGeometry.type;

        var geometryAddComplete = function() {
          featureDao.createSync(featureRow);
          callback(null, featureRow);
        }

        if (type === 'Point') {
          self.addPoint(geom, featureRow, geometryAddComplete);
        } else if (type === 'MultiPoint') {
          self.addMultiPoint(geom, featureRow, geometryAddComplete);
        } else if (type === 'LineString') {
          self.addLine(geom, featureRow, geometryAddComplete);
        } else if (type === 'MultiLineString') {
          self.addMultiLine(geom, featureRow, geometryAddComplete);
        } else if (type === 'Polygon') {
          self.addPolygon(geom, featureRow, geometryAddComplete);
        } else if (type === 'MultiPolygon') {
          self.addMultiPolygon(geom, featureRow, geometryAddComplete);
        }
      });
    }, function done() {
      callback();
    });
  }).done();
}

GeoPackage.prototype.indexGeoPackage = function(tableName, featureCount, callback) {
  this.initPromise.then(function(self) {
    var featureDao = self.featureDaos[tableName];
    var FeatureTableIndex = java.import('mil.nga.geopackage.extension.index.FeatureTableIndex');
    var featureTableIndex = new FeatureTableIndex(self.geoPackage, featureDao);

    var indexedFeatures = 0;
    var max = featureCount;
    var progress = java.newProxy('mil.nga.geopackage.io.GeoPackageProgress', {
      setMax: function(max) { },
      addProgress: function(progress) {
        console.log('features indexed:', indexedFeatures++);
      },
      isActive: function() {
        return indexedFeatures < featureCount;
      },
      cleanupOnCancel: function() {
        return false;
      }
    });

    featureTableIndex.setProgress(progress);
  	featureTableIndex.index(function(err, indexCount) {
      console.log('finished indexing %d features', indexCount);
      callback();
    });
  }).done();
}

GeoPackage.prototype.addPoint = function(point, featureRow, callback) {
  this.initPromise.then(function(self) {
    var GeoPackageGeometryData = java.import('mil.nga.geopackage.geom.GeoPackageGeometryData');
    var geometryData = new GeoPackageGeometryData(3857);
    geometryData.setGeometrySync(self.createPoint(point));
    featureRow.setGeometrySync(geometryData);
    callback();
  }).done();
}

GeoPackage.prototype.addMultiPoint = function(multiPoint, featureRow, callback) {
  this.initPromise.then(function(self) {
    var GeoPackageGeometryData = java.import('mil.nga.geopackage.geom.GeoPackageGeometryData');

    var geometryData = new GeoPackageGeometryData(3857);
    geometryData.setGeometrySync(self.createMultiPoint(multiPoint));
    featureRow.setGeometrySync(geometryData);
    callback();
  }).done();
}

GeoPackage.prototype.addLine = function(line, featureRow, callback) {
  this.initPromise.then(function(self) {
    var GeoPackageGeometryData = java.import('mil.nga.geopackage.geom.GeoPackageGeometryData');

    var geometryData = new GeoPackageGeometryData(3857);
    geometryData.setGeometrySync(self.createLine(line));
    featureRow.setGeometrySync(geometryData);
    callback();
  }).done();
}

GeoPackage.prototype.addMultiLine = function(multiLine, featureRow, callback) {
  this.initPromise.then(function(self) {
    var GeoPackageGeometryData = java.import('mil.nga.geopackage.geom.GeoPackageGeometryData');

    var geometryData = new GeoPackageGeometryData(3857);
    geometryData.setGeometrySync(self.createMultiLine(multiLine));
    featureRow.setGeometrySync(geometryData);
    callback();
  }).done();
}

GeoPackage.prototype.addPolygon = function(polygon, featureRow, callback) {
  this.initPromise.then(function(self) {
    var GeoPackageGeometryData = java.import('mil.nga.geopackage.geom.GeoPackageGeometryData');

    var geometryData = new GeoPackageGeometryData(3857);
    geometryData.setGeometrySync(self.createPolygon(polygon));
    featureRow.setGeometrySync(geometryData);
    callback();
  }).done();
}

GeoPackage.prototype.addMultiPolygon = function(multiPolygon, featureRow, callback) {
  this.initPromise.then(function(self) {
    var GeoPackageGeometryData = java.import('mil.nga.geopackage.geom.GeoPackageGeometryData');

    var geometryData = new GeoPackageGeometryData(3857);
    geometryData.setGeometrySync(self.createMultiPolygon(multiPolygon));
    featureRow.setGeometrySync(geometryData);
    callback();
  }).done();
}

GeoPackage.prototype.createTileTable = function(extent, tableName, minZoom, maxZoom, callback) {
  this.initPromise.then(function(self) {
    var TileTable = java.import('mil.nga.geopackage.tiles.user.TileTable');
    var columns = java.callStaticMethodSync('mil.nga.geopackage.tiles.user.TileTable', 'createRequiredColumns');
    var tileTable = new TileTable(tableName, columns);

    self.geoPackage.createTileTableSync(tileTable);

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
    contents.setTableNameSync(tableName);
    contents.setDataTypeSync(java.callStaticMethodSync('mil.nga.geopackage.core.contents.ContentsDataType', 'fromName', 'tiles'));
    contents.setIdentifierSync(tableName);
    // contents.setDescription("");

    var srsDao = self.geoPackage.getSpatialReferenceSystemDaoSync();
    var srsWgs84 = srsDao.getOrCreateSync(4326);

    var Date = java.import('java.util.Date');
    contents.setLastChange(new Date());
    contents.setMinXSync(java.newDouble(llCorner.west));
    contents.setMinYSync(java.newDouble(llCorner.south));
    contents.setMaxXSync(java.newDouble(urCorner.east));
    contents.setMaxYSync(java.newDouble(urCorner.north));
    contents.setSrsSync(srsWgs84);

    // Create the contents
    self.geoPackage.getContentsDaoSync().createSync(contents);

    // Create new Tile Matrix Set
    var tileMatrixSetDao = self.geoPackage.getTileMatrixSetDaoSync();

    var srsDao = self.geoPackage.getSpatialReferenceSystemDaoSync();
    var srsEpsg3857 = srsDao.getOrCreateSync(3857);

    var TileMatrixSet = java.import('mil.nga.geopackage.tiles.matrixset.TileMatrixSet');
    var tileMatrixSet = new TileMatrixSet();
    tileMatrixSet.setContentsSync(contents);
    tileMatrixSet.setSrsSync(srsEpsg3857);
    tileMatrixSet.setMinXSync(java.newDouble(epsg3857ll[0]));
    tileMatrixSet.setMinYSync(java.newDouble(epsg3857ll[1]));
    tileMatrixSet.setMaxXSync(java.newDouble(epsg3857ur[0]));
    tileMatrixSet.setMaxYSync(java.newDouble(epsg3857ur[1]));
    tileMatrixSetDao.createSync(tileMatrixSet);

    // Create new Tile Matrix and tile table rows by going through each zoom
    // level
    var tileMatrixDao = self.geoPackage.getTileMatrixDaoSync();
    self.tileDaos[tableName] = self.geoPackage.getTileDaoSync(tileMatrixSet);


    for (var zoom = minZoom; zoom <= maxZoom; zoom++) {
      var xRange = tileUtilities.xCalculator(totalTileExtent, zoom);
      var yRange = tileUtilities.yCalculator(totalTileExtent, zoom);

      var matrixWidth = ((xRangeMinZoom.max - xRangeMinZoom.min) + 1) * Math.pow(2,(zoom - minZoom));
      var matrixHeight = ((yRangeMinZoom.max - yRangeMinZoom.min) + 1) * Math.pow(2,(zoom - minZoom));

      console.log('zoom: %d, matrixheight: %d, matrixwidth: %d', zoom, matrixHeight, matrixWidth);

      var pixelXSize = ((epsg3857ur[0] - epsg3857ll[0]) / matrixWidth) / 256;
      var pixelYSize = ((epsg3857ur[1] - epsg3857ll[1]) / matrixHeight) / 256;

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
    }


    callback();
  }).done();

}

GeoPackage.prototype.addTileMatrices = function(extent, tableName, minZoom, maxZoom, callback) {
  this.initPromise.then(function(self) {
    var xRangeMinZoom = tileUtilities.xCalculator(extent, minZoom);
    var yRangeMinZoom = tileUtilities.yCalculator(extent, minZoom);

    var llCorner = tileUtilities.tileBboxCalculator(xRangeMinZoom.min, yRangeMinZoom.max, minZoom);
    var urCorner = tileUtilities.tileBboxCalculator(xRangeMinZoom.max, yRangeMinZoom.min, minZoom);
    var totalTileExtent = [llCorner.west, llCorner.south, urCorner.east, urCorner.north];
    var tileMatrixDao = self.geoPackage.getTileMatrixDaoSync();

    for (var zoom = minZoom; zoom <= maxZoom; zoom++) {
      var xRange = tileUtilities.xCalculator(totalTileExtent, zoom);
      var yRange = tileUtilities.yCalculator(totalTileExtent, zoom);

      var matrixWidth = ((xRangeMinZoom.max - xRangeMinZoom.min) + 1) * Math.pow(2,(zoom - minZoom));
      var matrixHeight = ((yRangeMinZoom.max - yRangeMinZoom.min) + 1) * Math.pow(2,(zoom - minZoom));

      console.log('zoom: %d, matrixheight: %d, matrixwidth: %d', zoom, matrixHeight, matrixWidth);

      var pixelXSize = ((epsg3857ur[0] - epsg3857ll[0]) / matrixWidth) / 256;
      var pixelYSize = ((epsg3857ur[1] - epsg3857ll[1]) / matrixHeight) / 256;

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
    }
    callback();
  }).done();
}

GeoPackage.prototype.createFeatureTable = function(extent, tableName, propertyColumnNames, callback) {
  console.log('creating feature table', tableName);
  this.initPromise.then(function(self) {
    console.log('feature table promise returned', self);
    var ArrayList = java.import('java.util.ArrayList');
    var FeatureTable = java.import('mil.nga.geopackage.features.user.FeatureTable');
    var Date = java.import('java.util.Date');
    var GeometryColumns = java.import('mil.nga.geopackage.features.columns.GeometryColumns');
    var BoundingBox = java.import('mil.nga.geopackage.BoundingBox');
    var Contents = java.import('mil.nga.geopackage.core.contents.Contents');
    var DataColumns = java.import('mil.nga.geopackage.schema.columns.DataColumns');

    var srsDao = self.geoPackage.getSpatialReferenceSystemDaoSync();
    var srsEpsg3857 = srsDao.getOrCreateSync(3857);

    self.geoPackage.createGeometryColumnsTableSync();

    var columns = new ArrayList();
    columns.addSync(java.callStaticMethodSync('mil.nga.geopackage.features.user.FeatureColumn', 'createPrimaryKeyColumn', 0, 'id'));
    columns.addSync(java.callStaticMethodSync('mil.nga.geopackage.features.user.FeatureColumn', 'createGeometryColumn', 1, 'geom', java.callStaticMethodSync('mil.nga.wkb.geom.GeometryType', 'fromName', 'GEOMETRY'), false, null));
    self.tableProperties[tableName] = {};
    for (var i = 0; i < propertyColumnNames.length; i++) {
      self.tableProperties[tableName][propertyColumnNames[i]] = 'property_'+i;
      columns.addSync(java.callStaticMethodSync('mil.nga.geopackage.features.user.FeatureColumn', 'createColumn', i+2, 'property_'+i, java.callStaticMethodSync('mil.nga.geopackage.db.GeoPackageDataType', 'fromName', 'TEXT'), false, null));
    }

    var featureTable = new FeatureTable(tableName, columns);
    self.geoPackage.createFeatureTableSync(featureTable);

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
    self.geoPackage.getContentsDaoSync().createSync(contents);


    var geometryColumns = new GeometryColumns();
    geometryColumns.setContentsSync(contents);
    geometryColumns.setSrsSync(contents.getSrsSync());
    geometryColumns.setGeometryTypeSync(java.callStaticMethodSync('mil.nga.wkb.geom.GeometryType', 'fromName', 'GEOMETRY'));
    geometryColumns.setColumnNameSync('geom');
    self.geoPackage.getGeometryColumnsDaoSync().create(geometryColumns);

    self.featureDaos[tableName] = self.geoPackage.getFeatureDaoSync(geometryColumns);

    self.geoPackage.createDataColumnsTableSync();

    var dataColumnsDao = self.geoPackage.getDataColumnsDaoSync();

    for (var i = 0; i < propertyColumnNames.length; i++) {
      var dataColumns = new DataColumns();
    	dataColumns.setContentsSync(contents);
    	dataColumns.setColumnNameSync('property_'+i);
    	dataColumns.setNameSync(propertyColumnNames[i]);
    	dataColumns.setTitleSync(propertyColumnNames[i]);
    	dataColumns.setDescriptionSync(propertyColumnNames[i]);

    	dataColumnsDao.createSync(dataColumns);
    }

    callback();

  }).done();
}

GeoPackage.prototype.createPoint = function(point) {
  var Point = java.import('mil.nga.wkb.geom.Point');
  return new Point(java.newDouble(point[0]), java.newDouble(point[1]));
}

GeoPackage.prototype.createMultiPoint = function(multiPoint) {
  var MultiPoint = java.import('mil.nga.wkb.geom.MultiPoint');

  var multiPointGeom = new MultiPoint(false, false);
  for (var i = 0; i < multiPoint.length; i++) {
    multiPointGeom.addPointSync(createPoint(multiPoint[i]));
  }
  return multiPointGeom;
}

GeoPackage.prototype.createLine = function(line) {
  var LineString = java.import('mil.nga.wkb.geom.LineString');

  var lineGeom = new LineString(false, false);
  for (var i = 0; i < line.length; i++) {
    var point = line[i];
    if (point[0] == null || point[1] == null) continue;
    lineGeom.addPointSync(createPoint(point));
  }
  return lineGeom;
}

GeoPackage.prototype.createMultiLine = function(multiLine) {
  var MultiLineString = java.import('mil.nga.wkb.geom.MultiLineString');

  var multiLineGeom = new MultiLineString(false, false);
  for (var i = 0; i < multiLine.length; i++) {
    var line = multiLine[i];
    multiLineGeom.addLineSync(createLine(line));
  }
  return multiLineGeom;
}

GeoPackage.prototype.createPolygon = function(polygon) {
  var Polygon = java.import('mil.nga.wkb.geom.Polygon');
  var polygonGeom = new Polygon(false, false);
  for (var ring = 0; ring < polygon.length; ring++) {
    var linearRing = polygon[ring];
    polygonGeom.addRingSync(createLine(linearRing));
  }
  return polygonGeom;
}

GeoPackage.prototype.createMultiPolygon = function(multiPolygon) {
  var MultiPolygon = java.import('mil.nga.wkb.geom.MultiPolygon');

  var multiPolygonGeom = new MultiPolygon(false, false);
  for (var polygon = 0; polygon < multiPolygon.length; polygon++) {
    multiPolygonGeom.addPolygonSync(createPolygon(multiPolygon[polygon]));
  }
  return multiPolygonGeom;
}

module.exports = GeoPackage;
