var GeoPackageApi = require('geopackage')
  , FeatureModel = require('mapcache-models').Feature
  , path = require('path')
  , fs = require('fs-extra')
  , log = require('mapcache-log')
  , turf = require('turf')
  , async = require('async')
  , xyzTileUtils = require('xyz-tile-utils');

var GeoPackage = function(config) {
  this.config = config || {};
  this.source = this.config.source;
  this.cache = this.config.cache;
  if (this.config.cache && !this.config.outputDirectory) {
    throw new Error('An output directory must be specified in config.outputDirectory');
  }
}

GeoPackage.prototype.initialize = function() {
}

GeoPackage.prototype.processSource = function(doneCallback, progressCallback) {
  doneCallback = doneCallback || function() {};
  progressCallback = progressCallback || function(source, callback) {callback(null, source);};

  var tasks = [];
  // read in the GeoPackage
  tasks.push(this._openGeoPackage.bind(this, this.source.file.path));
  // find all the layers

  // pull the feature layers out and put them in postgres
  tasks.push(this._insertVectorLayers.bind(this, this.geoPackage));
  // leave the tile layers in

  async.series(tasks, function(err, results) {
    log.info('done creating the geopackage');
    doneCallback(err, this.source);
  }.bind(this));
}

GeoPackage.prototype.getTile = function(format, z, x, y, params, callback) {
  if (this.source) {

  } else {
    this.cache.cache.source.getTile(format, z, x, y, params, callback);
  }
}

GeoPackage.prototype.generateCache = function(doneCallback, progressCallback) {
  doneCallback = doneCallback || function() {};
  progressCallback = progressCallback || function(cache, callback) {callback(null, cache);};
  var cacheObj = this.cache;
  var self = this;
  var cache = this.cache.cache;

  var dir = path.join(this.config.outputDirectory, cache.id, 'gpkg');
  var filename = cache.id + '.gpkg';
  this.filePath = path.join(dir, filename);

  if (fs.existsSync(this.filePath)) {
    log.info('Cache already exists, returning');
    return doneCallback(null, cacheObj);
  }

  fs.emptyDirSync(dir);

  log.info('Generating cache with id %s', this.cache.cache.id);

  var map = cache.source.map;
  var mapSources = map.dataSources;
  cache.status.generatedFeatures = 0;

  var tasks = [];

  tasks.push(this._createGeoPackage.bind(this));

  for (var i = 0; i < mapSources.length; i++) {
    tasks.push(this._addSourceToGeoPackage.bind(this, mapSources[i], progressCallback));
  }

  async.series(tasks, function (err, results) {
    console.log('all sources are complete');
    return doneCallback(null, cacheObj);
  });
}

GeoPackage.prototype._calculateExtentFromGeometry = function(geometry) {
  var extent = turf.extent(geometry);
  extent[0] = Math.max(-180, extent[0]);
  extent[1] = Math.max(-85, extent[1]);
  extent[2] = Math.min(180, extent[2]);
  extent[3] = Math.min(85, extent[3]);
  return extent;
}

GeoPackage.prototype._addSourceToGeoPackage = function(s, progressCallback, callback) {
  var cache = this.cache.cache;
  var params = cache.cacheCreationParams;
  log.info('params are', params);
  log.debug('Checking if %s - %s should be added to the cache', s.source.name, s.source.id.toString());
  if (params.dataSources.indexOf(s.source.id.toString()) == -1) {
    log.debug('%s - %s is not being added to the cache', s.source.name, s.source.id.toString());
    return callback();
  }
  log.info('Adding %s - %s to the cache', s.source.name, s.source.id.toString());
  if (s.source.vector) {
    this._addVectorSourceToGeoPackage(s, progressCallback, callback);
  } else {
    this._addRasterSourceToGeoPackage(s, progressCallback, callback);
  }
}

GeoPackage.prototype._addVectorSourceToGeoPackage = function(vectorSource, progressCallback, sourceFinishedCallback) {
  log.info('Adding the features for cache %s from the source %s - %s', this.cache.cache.id, vectorSource.source.name, vectorSource.source.id)

  var tableName = vectorSource.source.name ? vectorSource.source.name.toString() : vectorSource.source.id.toString();
  tableName = tableName.replace(/[^a-z0-9]/gi,'');

  var cache = this.cache.cache;
  var extent = this._calculateExtentFromGeometry(cache.geometry);

  var propertyColumnNames = [];
  for (var i = 0; i < vectorSource.source.properties.length; i++) {
    propertyColumnNames.push(vectorSource.source.properties[i].key);
  }
  console.log('property column names', propertyColumnNames);
  var sourceFeaturesCreated = 0;
  // write these to the geoPackage
  var self = this;
  FeatureModel.getAllFeaturesByCacheIdAndSourceId(cache.id, vectorSource.source.id, extent[0], extent[1], extent[2], extent[3], '3857', function(err, features) {
    self.geoPackage.createFeatureTable(extent, tableName, propertyColumnNames, function(err) {
      self.geoPackage.addFeaturesToGeoPackage(features, tableName, function(err) {
        console.log('features.length', features.length);
        if (!cache.cacheCreationParams || !cache.cacheCreationParams.noGeoPackageIndex) {
          self.geoPackage.indexGeoPackage(tableName, features.length, sourceFinishedCallback);
        } else {
          sourceFinishedCallback();
        }
      }, function(progress, callback) {
        cache.status.generatedFeatures = cache.status.generatedFeatures + progress.featuresAdded - sourceFeaturesCreated;
        sourceFeaturesCreated = progress.featuresAdded;

        progressCallback(cache, callback);
      });
    });
  });
}

GeoPackage.prototype._addRasterSourceToGeoPackage = function(rasterSource, progressCallback, sourceFinishedCallback) {
  log.info('Adding the tiles for cache %s from the source %s - %s', this.cache.cache.id, rasterSource.source.name, rasterSource.source.id);

  var tableName = rasterSource.source.name ? rasterSource.source.name.toString() : rasterSource.source.id.toString();
  tableName = tableName.replace(/[^a-z0-9]/gi,'');

  var cache = this.cache.cache;

  var extent = this._calculateExtentFromGeometry(cache.geometry);

  var xRangeMinZoom = xyzTileUtils.calculateXTileRange(extent, cache.minZoom);
  var yRangeMinZoom = xyzTileUtils.calculateXTileRange(extent, cache.minZoom);

  var llCorner = xyzTileUtils.tileBboxCalculator(xRangeMinZoom.min, yRangeMinZoom.max, cache.minZoom);
  var urCorner = xyzTileUtils.tileBboxCalculator(xRangeMinZoom.max, yRangeMinZoom.min, cache.minZoom);
  var totalTileExtent = [llCorner.west, llCorner.south, urCorner.east, urCorner.north];
  var self = this;
  this.geoPackage.createTileTable(extent, tableName, cache.minZoom, cache.maxZoom, function() {
    xyzTileUtils.iterateAllTilesInExtent(turf.extent(cache.geometry), cache.minZoom, cache.maxZoom, cache, function(tile, tileDone) {
        var xRange = xyzTileUtils.calculateXTileRange(totalTileExtent, tile.z);
        var yRange = xyzTileUtils.calculateYTileRange(totalTileExtent, tile.z);

        var tileRow = tile.y - yRange.min;
        var tileColumn = tile.x - xRange.min;
        rasterSource.getTile('png', tile.z, tile.x, tile.y, cache.cacheCreationParams, function(err, tileStream) {
          if (err || !tileStream) { return tileDone()};
          self.geoPackage.addTileToGeoPackage(tileStream, tableName, tile.z, tileRow, tileColumn, tileDone);
        });
      },
      function(zoom, zoomFinishedCallback) {
        log.info('zoom level %d is done for %s', zoom, cache.id);
        zoomFinishedCallback();
      },
      function(err, data) {
        log.info('all tiles are done for %s', cache.id);
        self.cache.cache = data;
        log.info('need to callback the finished callback', sourceFinishedCallback);
        sourceFinishedCallback(null, self.cache);
      }
    );
  });
}

GeoPackage.prototype.getDataWithin = function(west, south, east, north, projection, callback) {
  callback(null, null);
}

GeoPackage.prototype._createGeoPackage = function(callback) {
  log.info('Opening a new GeoPackage at %s', this.filePath);
  this.geoPackage = new GeoPackageApi();
  this.geoPackage.createAndOpenGeoPackageFile(this.filePath, function() {
    callback(null, this.geoPackage);
  });
}

GeoPackage.prototype._openGeoPackage = function(path, callback) {
  log.info('Opening GeoPackage at %s', path);
  this.geoPackage = new GeoPackageApi();
  this.geoPackage.openGeoPackageFile(path, function(err) {
    callback(err, this.geoPackage);
  });
}

GeoPackage.prototype._insertVectorLayers = function(geoPackage, callback) {
  log.info('Retrieving vector layers from GeoPackage');

  var gp = this.geoPackage;
  var self = this;
  gp.getFeatureTables(function(err, featureTables) {
    console.log('featureTables', featureTables.sizeSync());

    var featureTableLength = featureTables.sizeSync();
    var count = 0;
    async.whilst(
      function() {
        return count < featureTableLength;
      },
      function(callback) {
        log.info('Getting features from table %d', count);
        var featureTable = featureTables.getSync(count);
        log.info('feature table', featureTable);
        // var featureCount = featureTable.getCountSync();
        gp.iterateFeaturesFromTable(featureTable, function(err, feature, callback) {
          FeatureModel.createFeature(feature, {sourceId: self.source.id, layerId: count}, function(err) {
            log.debug('Created feature for sourceId %s and layerId %s', self.source.id, count, feature);
            callback();
          });
        }, function(err) {
          console.log('all features for table %d complete', count);
          count++;
          callback();
        });
      },
      function(err, results) {
        callback(err);
      }
    )
  });
}

GeoPackage.prototype._checkGeoPackage = function(callback) {
  log.info('the geopackage is', this.geoPackage);
  callback(null);
}

module.exports = GeoPackage;
