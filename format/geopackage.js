var GeoPackageApi = require('geopackage')
  , FeatureModel = require('mapcache-models').Feature
  , path = require('path')
  , fs = require('fs-extra')
  , log = require('mapcache-log')
  , Canvas = require('canvas')
  , Image = Canvas.Image
  , turf = require('turf')
  , tile = require('mapcache-tile')
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
  log.info('Process the GeoPackage');
  doneCallback = doneCallback || function() {};
  progressCallback = progressCallback || function(source, callback) {callback(null, source);};

  this.source.status = this.source.status || {};

  var tasks = [];
  // read in the GeoPackage
  tasks.push(this._openGeoPackage.bind(this, this.source.file.path));
  // find all the layers
  tasks.push(this._insertTileLayers.bind(this));
  // pull the feature layers out and put them in postgres
  tasks.push(this._insertVectorLayers.bind(this));
  // leave the tile layers in

  tasks.push(completeProcessing.bind(this, this.source));

  this._isAlreadyProcessed(function(processed) {
    if (processed) {
      var source = this.source;
      this._openGeoPackage(source.file.path, function(err) {
        return completeProcessing(source, function(err, source) {
          console.log('source was already processed, returning', source);

          doneCallback(null, source);
        });
      });
    } else {
      async.series(tasks, function(err, results) {
        log.info('done creating the geopackage');
        doneCallback(err, this.source);
      }.bind(this));
    }
  }.bind(this));
}

GeoPackage.prototype._isAlreadyProcessed = function(callback) {
  log.debug('is it already processed?', this.source);
  FeatureModel.getFeatureCount({sourceId: this.source.id, cacheId: null}, function(resultArray){
    log.debug("The source already has features", resultArray);
    if (resultArray[0].count != '0') {
      return callback(true);
    } else {
      return callback(false);
    }
  });
}

function setSourceCount(source, callback) {
  FeatureModel.getFeatureCount({sourceId: source.id, cacheId: null}, function(resultArray){
    source.status.totalFeatures = resultArray[0].count;
    callback(null, source);
  });
}

function setSourceExtent(source, callback) {
  FeatureModel.getExtentOfSource({sourceId:source.id}, function(resultArray) {
    source.geometry = {
      type: "Feature",
      geometry: JSON.parse(resultArray[0].extent)
    };
    callback(null, source);
  });
}

function setSourceStyle(source, callback) {
  source.style = source.style || {
    defaultStyle: {
      style: {
        'fill': "#000000",
        'fill-opacity': 0.5,
        'stroke': "#0000FF",
        'stroke-opacity': 1.0,
        'stroke-width': 1
      }
    }
  };
  source.style.styles = source.style.styles || [];
  callback(null, source);
}

function setSourceProperties(source, callback) {
  source.properties = [];
  FeatureModel.getPropertyKeysFromSource({sourceId: source.id}, function(propertyArray){
    async.eachSeries(propertyArray, function(key, propertyDone) {
      FeatureModel.getValuesForKeyFromSource(key.property, {sourceId: source.id}, function(valuesArray) {
        source.properties.push({key: key.property, values: valuesArray.map(function(current) {
          return current.value;
        })});
        propertyDone();
      });
    }, function() {
      callback(null, source);
    });
  });
}

function completeProcessing(source, callback) {
  async.waterfall([
    function(callback) {
      callback(null, source);
    },
    setSourceCount,
    setSourceExtent,
    setSourceStyle,
    setSourceProperties
  ], function (err, source){
    source.status.complete = true;
    source.status.message = "Complete";
    callback(err, source);
  });
}


GeoPackage.prototype.getTile = function(format, z, x, y, params, callback) {
  if (this.source) {

    var canvas = new Canvas(256,256);
    var ctx = canvas.getContext('2d');
    var height = canvas.height;

    ctx.clearRect(0, 0, height, height);
    console.log('Get the tile in GeoPackage', this.geoPackage);

    var gp = this.geoPackage;
    var self = this;

    gp.getTileTables(function(err, tileTables) {

      console.log('tileTables', tileTables.length);
      var tileTableLength = tileTables.length;

      var count = 0;
      async.whilst(
        function() {
          return count < tileTableLength;
        },
        function(callback) {
          console.log('tile table', tileTables[count]);
          gp.getTileFromTable(tileTables[count], z, x, y, function(err, tileStream) {
            count++;
            if (!tileStream) return callback();

            var buffer = new Buffer(0);
            var chunk;
            tileStream.on('data', function(chunk) {
              console.log('chunk', chunk);
              buffer = Buffer.concat([buffer, chunk]);
            });
            tileStream.on('end', function() {
              console.log('end buffer');
              var img = new Image;
              console.log('img');
              img.onload = function() {
                console.log('draw it');
                ctx.drawImage(img, 0, 0, img.width, img.height);
                console.log('drawn');
                callback();
              };
              img.src = buffer;
            });
          });
        },
        function(err, results) {

          gp.getFeatureTables(function(err, featureTables) {
            console.log('featureTables', featureTables.length);
            var featureTableLength = featureTables.length;

            var count = 0;
            async.whilst(
              function() {
                return count < featureTableLength;
              },
              function(callback) {
                log.info('Getting features from table %d', count);
                tile.getVectorTileWithLayer(self.source, {id: count}, format, z, x, y, params, function(err, tileStream) {
                  count++;
                  if (!tileStream) return callback();

                  console.log('tilestream is ', tileStream);

                  var buffer = new Buffer(0);
                  var chunk;
                  tileStream.on('data', function(chunk) {
                    buffer = Buffer.concat([buffer, chunk]);
                  });
                  tileStream.on('end', function() {
                    var img = new Image;
                    img.onload = function() {
                      ctx.drawImage(img, 0, 0, img.width, img.height);
                      callback();
                    };
                    img.src = buffer;
                  });
                });

              },
              function(err, results) {
                callback(null, canvas.pngStream());
              }
            );
          });
        }
      );
    });
  } else {
    this.cache.getTile(format, z, x, y, params, callback);
  }
}

GeoPackage.prototype.getData = function(minZoom, maxZoom, callback) {
  var dir = path.join(this.config.outputDirectory, this.cache.cache.id, 'gpkg');
  var filename = this.cache.cache.id + '.gpkg';
  var geoPackageFile = path.join(dir, filename);
  var stream = fs.createReadStream(geoPackageFile);
  callback(null, {stream: stream, extension: '.gpkg'});
}

GeoPackage.prototype.delete = function(callback) {
  if (!this.cache) return callback();
  var dir = path.join(this.config.outputDirectory, this.cache.cache.id, 'gpkg');
  var filename = this.cache.cache.id + '.gpkg';
  fs.remove(path.join(dir, filename), callback);
}

GeoPackage.prototype.generateCache = function(doneCallback, progressCallback) {
  doneCallback = doneCallback || function() {};
  progressCallback = progressCallback || function(cache, callback) {callback(null, cache);};
  var cacheObj = this.cache;
  var self = this;
  var cache = this.cache.cache;
  cache.formats = cache.formats || {};

  cache.formats.geopackage = {
    complete: false,
    generatedFeatures: 0,
    generatedTiles: 0,
    percentComplete: 0
  };

  var dir = path.join(this.config.outputDirectory, cache.id, 'gpkg');
  var filename = cache.id + '.gpkg';
  this.filePath = path.join(dir, filename);

  if (fs.existsSync(this.filePath)) {
    log.info('Cache %s already exists, returning', this.filePath);
    return this._openGeoPackage(this.filePath, function() {
      return doneCallback(null, cacheObj);
    });
  }

  fs.emptyDirSync(dir);

  log.info('Generating cache with id %s', this.cache.cache.id);

  var map = cacheObj.map;
  var mapSources = map.dataSources;

  var tasks = [];

  tasks.push(this._createGeoPackage.bind(this));

  for (var i = 0; i < mapSources.length; i++) {
    tasks.push(this._addSourceToGeoPackage.bind(this, mapSources[i], progressCallback));
  }

  var filePath = this.filePath;
  progressCallback(cache, function(err, updatedCache) {
    cache = updatedCache;
    async.series(tasks, function (err, results) {
      console.log('all sources are complete');
      var stats = fs.statSync(filePath);
      cache.formats.geopackage.complete = true;
      cache.formats.geopackage.size = stats.size;
      cache.formats.geopackage.percentComplete = 100;
      return doneCallback(null, cacheObj);
    }.bind(this));
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
  log.debug('vector source properties', vectorSource.source);
  for (var i = 0; vectorSource.source.properties && i < vectorSource.source.properties.length; i++) {
    propertyColumnNames.push(vectorSource.source.properties[i].key);
  }
  console.log('property column names', propertyColumnNames);
  var sourceFeaturesCreated = 0;
  // write these to the geoPackage
  var self = this;
  FeatureModel.getAllFeaturesByCacheIdAndSourceId(cache.id, vectorSource.source.id, extent[0], extent[1], extent[2], extent[3], '3857', function(err, features) {
    log.info('Adding %d features to the GeoPackage', features.length);
    self.geoPackage.createFeatureTable(extent, tableName, propertyColumnNames, function(err) {
      self.geoPackage.addFeaturesToGeoPackage(features, tableName, function(err) {
        console.log('features.length', features.length);
        if (!cache.cacheCreationParams || !cache.cacheCreationParams.noGeoPackageIndex) {
          self.geoPackage.indexGeoPackage(tableName, sourceFinishedCallback);
        } else {
          sourceFinishedCallback();
        }
      }, function(progress, callback) {
        cache.formats.geopackage.percentComplete += cache.formats.geopackage.generatedFeatures
        cache.formats.geopackage.generatedFeatures = cache.formats.geopackage.generatedFeatures + progress.featuresAdded - sourceFeaturesCreated;

        cache.formats.geopackage.percentComplete += (100 * ((progress.featuresAdded - sourceFeaturesCreated) / features.length)) / self.cache.map.dataSources.length;

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
  var totalTiles = xyzTileUtils.tileCountInExtent(totalTileExtent, cache.minZoom, cache.maxZoom);

  var generatedTiles = 0;

  var self = this;
  this.geoPackage.createTileTable(extent, tableName, cache.minZoom, cache.maxZoom, function() {
    xyzTileUtils.iterateAllTilesInExtent(turf.extent(cache.geometry), cache.minZoom, cache.maxZoom, cache, function(tile, tileDone) {
        var xRange = xyzTileUtils.calculateXTileRange(totalTileExtent, tile.z);
        var yRange = xyzTileUtils.calculateYTileRange(totalTileExtent, tile.z);

        var tileRow = tile.y - yRange.min;
        var tileColumn = tile.x - xRange.min;
        rasterSource.getTile('png', tile.z, tile.x, tile.y, cache.cacheCreationParams, function(err, tileStream) {
          if (err || !tileStream) { return tileDone()};
          log.info('Adding the tile zoom: %d, row: %d, column: %d', tile.z, tileRow, tileColumn);
          self.geoPackage.addTileToGeoPackage(tileStream, tableName, tile.z, tileRow, tileColumn, function(err) {
            generatedTiles++;
            cache.formats.geopackage.percentComplete += (100 * (1 / totalTiles)) / self.cache.map.dataSources.length;
            progressCallback(cache, function(err, updatedCache) {
              cache = updatedCache;
              return tileDone(err, tile);
            });
          });
        });
      },
      function(zoom, zoomFinishedCallback) {
        log.info('zoom level %d is done for %s', zoom, cache.id);
        zoomFinishedCallback();
      },
      function(err, data) {
        log.info('all tiles are done for %s', cache.id);
        self.cache.cache = data;
        sourceFinishedCallback(null, self.cache);
      }
    );
  });
}

GeoPackage.prototype.getDataWithin = function(west, south, east, north, projection, callback) {
  if (this.source) {
    FeatureModel.findFeaturesWithin({sourceId: this.source.id}, west, south, east, north, projection, callback);
  } else {
    var c = this.cache;
    console.log('this.cache.map.source.id', this.cache.map);
    FeatureModel.findFeaturesByCacheIdWithin(c.cache.id, west, south, east, north, projection, callback);
  }
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

GeoPackage.prototype._insertTileLayers = function(callback) {
  console.log('insert tile layers');
  var self = this;
  this.geoPackage.getTileTables(function(err, tileTables) {

    console.log('tileTables', tileTables.length);
    var tileTableLength = tileTables.length;

    var count = 0;
    async.whilst(
      function() {
        return count < tileTableLength;
      },
      function(callback) {
        var tileTable = tileTables[count];
        console.log('tile table', tileTable);

        self.source.layers = self.source.layers || [];
        self.source.layers.push({
          name: tileTable,
          zOrder: self.source.layers.length,
          vector: false
        });
        count++;
        callback();
      },
      function(err, results) {
        callback(err, results);
      }
    );
  });
}

GeoPackage.prototype._insertVectorLayers = function(callback) {
  log.info('Retrieving vector layers from GeoPackage');

  var gp = this.geoPackage;
  var self = this;
  gp.getFeatureTables(function(err, featureTables) {
    console.log('featureTables', featureTables.length);

    var featureTableLength = featureTables.length;
    var count = 0;
    async.whilst(
      function() {
        return count < featureTableLength;
      },
      function(callback) {
        log.info('Getting features from table %d', count);
        var featureTable = featureTables[count];
        log.info('feature table', featureTable);
        gp.iterateFeaturesFromTable(featureTable, function(err, feature, callback) {
          FeatureModel.createFeature(feature, {sourceId: self.source.id, layerId: count}, function(err) {
            log.debug('Created feature for sourceId %s and layerId %s', self.source.id, count);
            callback();
          });
        }, function(err) {
          console.log('all features for table %d complete', count);
          count++;
          self.source.layers = self.source.layers || [];
          self.source.layers.push({
            name: featureTable,
            zOrder: self.source.layers.length,
            vector: true
          });
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
