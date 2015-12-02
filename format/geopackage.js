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
  progressCallback = progressCallback || function(cache, callback) {callback(null, cache);};

  doneCallback(null, this.source);
}

GeoPackage.prototype.getTile = function(format, z, x, y, params, callback) {
  callback(null, null);
}

GeoPackage.prototype.generateCache = function(doneCallback, progressCallback) {
  doneCallback = doneCallback || function() {};
  progressCallback = progressCallback || function(cache, callback) {callback(null, cache);};
  var cacheObj = this.cache;
  var self = this;
  var cache = this.cache.cache;

  var dir = path.join(this.config.outputDirectory, cache.id, 'gpkg');
  var filename = cache.id + '.gpkg';
  fs.emptyDirSync(dir);

  if (fs.existsSync(path.join(dir, filename))) {
    log.info('Cache already exists, returning');
    return doneCallback(null, cacheObj);
  }

  log.info('Generating cache with id %s', this.cache.cache.id);

  var extent = turf.extent(cache.geometry);

  var map = cache.source.map;
  var sorted = map.dataSources.sort(zOrderDatasources);
  var params = cache.cacheCreationParams || {};
  if (!params.dataSources || params.dataSources.length == 0) {
    params.dataSources = [];
    for (var i = 0; i < sorted.length; i++) {
      log.debug('adding the datasource', sorted[i].source.id);
      params.dataSources.push(sorted[i].source.id);
    }
  }

  var extent = turf.extent(cache.geometry);
  extent[0] = Math.max(-180, extent[0]);
  extent[1] = Math.max(-85, extent[1]);
  extent[2] = Math.min(180, extent[2]);
  extent[3] = Math.min(85, extent[3]);

  cache.status.totalFeatures = 0;
  cache.status.generatedFeatures = 0;

  var filePath = path.join(dir, filename);
  var geoPackage = new GeoPackageApi();
  geoPackage.createAndOpenGeoPackageFile(filePath, function() {
    console.log('geoPackage is created and open');
    async.eachSeries(sorted, function iterator(s, sourceFinishedCallback) {
      log.info('Checking source %s', s.source.id.toString());
      if (params.dataSources.indexOf(s.source.id.toString()) == -1) {
        return sourceFinishedCallback();
      }

      if (s.source.vector) {
        log.info('Creating the cache features for cache %s from the source %s', cache.id, s.source.id);
        var propertyColumnNames = [];
        for (var i = 0; i < s.source.properties.length; i++) {
          propertyColumnNames.push(s.source.properties[i].key);
        }
        console.log('property column names', propertyColumnNames);
        FeatureModel.createCacheFeaturesFromSource(s.source.id, cache.id, extent[0], extent[1], extent[2], extent[3], function(err, features) {
          log.info('Created %d features for the cache %s from the source %s', features.rowCount, cache.id, s.source.id);
          cache.status.totalFeatures = cache.status.totalFeatures + features.rowCount;
          var sourceFeaturesCreated = 0;
          progressCallback(cacheObj, function(err, cache) {
            cache = cache.cache;
            // write these to the geoPackage
            FeatureModel.getAllFeaturesByCacheIdAndSourceId(cache.id, s.source.id, extent[0], extent[1], extent[2], extent[3], '3857', function(err, features) {
              var tableName = 'FEATURES_' + s.source.id.toString();
              tableName = tableName.replace(/[^a-z0-9]/gi,'');
              geoPackage.createFeatureTable(extent, tableName, propertyColumnNames, function(err) {
                geoPackage.addFeaturesToGeoPackage(features, tableName, function(err) {
                  console.log('features.length', features.length);
                  geoPackage.indexGeoPackage(tableName, features.length, sourceFinishedCallback);
                }, function(progress, callback) {
                  cache.status.generatedFeatures = cache.status.generatedFeatures + progress.featuresAdded - sourceFeaturesCreated;
                  sourceFeaturesCreated = progress.featuresAdded;

                  progressCallback(cache, callback);
                });
              });
            });
          });
        });
      } else {
        log.info('Creating the tiles for cache %s from the source %s', cache.id, s.source.id);
        var tableName = 'TILES_' + s.source.id.toString();
        tableName = tableName.replace(/[^a-z0-9]/gi,'');
        var xRangeMinZoom = xyzTileUtils.calculateXTileRange(extent, cache.minZoom);
        var yRangeMinZoom = xyzTileUtils.calculateXTileRange(extent, cache.minZoom);

        var llCorner = xyzTileUtils.tileBboxCalculator(xRangeMinZoom.min, yRangeMinZoom.max, cache.minZoom);
        var urCorner = xyzTileUtils.tileBboxCalculator(xRangeMinZoom.max, yRangeMinZoom.min, cache.minZoom);
        var totalTileExtent = [llCorner.west, llCorner.south, urCorner.east, urCorner.north];
        geoPackage.createTileTable(extent, tableName, cache.minZoom, cache.maxZoom, function() {
          xyzTileUtils.iterateAllTilesInExtent(turf.extent(cache.geometry), cache.minZoom, cache.maxZoom, cache, function(tile, tileDone) {
              var xRange = xyzTileUtils.calculateXTileRange(totalTileExtent, tile.z);
              var yRange = xyzTileUtils.calculateYTileRange(totalTileExtent, tile.z);

              var tileRow = tile.y - yRange.min;
              var tileColumn = tile.x - xRange.min;
              s.getTile('png', tile.z, tile.x, tile.y, cache.cacheCreationParams, function(err, tileStream) {
                if (err || !tileStream) { return tileDone()};
                geoPackage.addTileToGeoPackage(tileStream, tableName, tile.z, tileRow, tileColumn, tileDone);
              });
            },
            function(zoom, callback) {
              log.info('zoom level %d is done for %s', zoom, cache.id);
              callback();
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
    }, function done() {
      console.log('all sources are complete');
      return doneCallback(null, cacheObj);
    });
  });
}

GeoPackage.prototype.getDataWithin = function(west, south, east, north, projection, callback) {
  callback(null, null);
}

function zOrderDatasources(a, b) {
  if (a.source.zOrder < b.source.zOrder) {
    return -1;
  }
  if (a.source.zOrder > b.source.zOrder) {
    return 1;
  }
  // a must be equal to b
  return 0;
}

module.exports = GeoPackage;
