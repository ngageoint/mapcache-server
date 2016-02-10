var log = require('mapcache-log')
  , tile = require('mapcache-tile')
  , FeatureModel = require('mapcache-models').Feature
  , config = require('mapcache-config')
  , turf = require('turf')
  , Readable = require('stream').Readable
  , StreamQueue = require('streamqueue')
  , request = require('request')
  , fs = require('fs-extra')
  , path = require('path')
  , async = require('async');

var GeoJSON = function(config) {
  log.debug('Constructing a GeoJSON format');
  this.config = config || {};
  this.source = this.config.source;
  this.cache = this.config.cache;
  if (this.config.cache && !this.config.outputDirectory) {
    throw new Error('An output directory must be specified in config.outputDirectory');
  }
};

GeoJSON.prototype.generateCache = function(doneCallback, progressCallback) {
  doneCallback = doneCallback || function() {};
  progressCallback = progressCallback || function(cache, callback) {callback(null, cache);};
  var self = this;
  var cacheObj = this.cache;
  var cache = this.cache.cache;
  cache.formats = cache.formats || {};

  cache.formats.geojson = {
    complete: false,
    generatedFeatures: 0,
    percentComplete: 0
  };

  var dir = path.join(this.config.outputDirectory, cache.id, 'geojson');
  var filename = cache.id + '.geojson';
  fs.emptyDirSync(dir);

  if (fs.existsSync(path.join(dir, filename))) {
    log.info('Cache already exists, returning');
    return doneCallback(null, cacheObj);
  }

  FeatureModel.getFeatureCount({sourceId: self.cache.map.map.id, cacheId: self.cache.id}, function(countResults) {
    if (countResults[0].count !== '0') {
      return self._writeCacheFile(dir, filename, doneCallback);
    }
    var extent = turf.extent(self.cache.cache.geometry);
    extent[0] = Math.max(-180, extent[0]);
    extent[1] = Math.max(-85, extent[1]);
    extent[2] = Math.min(180, extent[2]);
    extent[3] = Math.min(85, extent[3]);
    log.debug('Creating the cache features from the source %s', self.cache.map.map.id);
    FeatureModel.createCacheFeaturesFromSource(self.cache.map.map.id, self.cache.id, extent[0], extent[1], extent[2], extent[3], function(err, features) {
      log.info('Created the cache features for cache %s ', self.cache.id, features);
      cache.formats.geojson.generatedFeatures = features;
      self._writeCacheFile(dir, filename, doneCallback);
    });
  });

};

GeoJSON.prototype._writeCacheFile = function(dir, filename, callback) {
  var self = this;
  log.info('Generating cache with id %s', this.cache.cache.id);
  var cache = self.cache.cache;
  FeatureModel.writeAllCacheFeatures(cache.id, path.join(dir, filename), 'geojson', function(err) {
    if (err) {
      log.error('There was an error writing cache file for cache %s', cache.id);
      cache.formats.geojson.error = JSON.stringify(err);
    }
    log.info('Wrote the GeoJSON for cache %s to the file %s', cache.id, path.join(dir, filename));
    var stats = fs.statSync(path.join(dir, filename));
    cache.formats.geojson.complete = true;
    cache.formats.geojson.size = stats.size;
    return callback(null, self.cache);
  });
};

GeoJSON.prototype.getData = function(minZoom, maxZoom, callback) {
  var dir = path.join(this.config.outputDirectory, this.cache.cache.id, 'geojson');
  var filename = this.cache.cache.id + '.geojson';
  var geojsonFile = path.join(dir, filename);
  var stream = fs.createReadStream(geojsonFile);
  callback(null, {stream: stream, extension: '.geojson'});
};

GeoJSON.prototype.delete = function(callback) {
  if (!this.cache) return callback();
  var dir = path.join(this.config.outputDirectory, this.cache.cache.id, 'geojson');
  var filename = this.cache.cache.id + '.geojson';
  fs.remove(path.join(dir, filename), callback);
};

GeoJSON.prototype.processSource = function(doneCallback, progressCallback) {
  doneCallback = doneCallback || function() {};
  progressCallback = progressCallback || function(source, callback) {callback(null, source);};
  var source = this.source;
  source.vector = true;
  source.status = source.status || {};

  isAlreadyProcessed(source, function(processed) {
    log.info('is already processed?', processed);
    if (processed) {
      return completeProcessing(source, function(err, source) {
        console.log('source %s was already processed, returning', source.id);

        doneCallback(null, source);
      });
    }
    source.status.message = "Parsing GeoJSON";
    progressCallback(source, function(err, updatedSource) {
      if (updatedSource.url) {
        var dir = path.join(config.server.sourceDirectory.path, updatedSource.id);
        fs.mkdirp(dir, function(err) {
          if (err) return doneCallback(err);
          var req = request.get({url: updatedSource.url})
          .on('error', function(err) {
            console.log(err+ updatedSource.url);

            doneCallback(err);
          });
          if (req) {
            var stream = fs.createWriteStream(dir + '/' + updatedSource.id + '.geojson');
        		stream.on('close',function() {
              fs.stat(dir + '/' + updatedSource.id + '.geojson', function(err, stat) {
                updatedSource.filePath = dir + '/' + updatedSource.id + '.geojson';
                updatedSource.size = stat.size;
                updatedSource.status.message = "Creating";
                updatedSource.status.complete = false;
                parseGeoJSONFile(updatedSource, function(err, updatedSource) {
                  updatedSource.status.complete = true;
                  updatedSource.status.message="Complete";
                  source = updatedSource;
                  doneCallback(err, source);
                });
              });
        		});

      			req.pipe(stream);
          }
        });

      } else if (fs.existsSync(updatedSource.file.path)) {
        parseGeoJSONFile(updatedSource, function(err, updatedSource) {
          updatedSource.status.complete = true;
          updatedSource.status.message="Complete";
          source = updatedSource;
          doneCallback(err, source);
        }, progressCallback);
      } else {
        doneCallback(new Error('file does not exist and URL is not specified'));
      }
    });
  });
};

function isAlreadyProcessed(source, callback) {
  log.debug('Checking if the source %s is already processed', source.id);
  FeatureModel.getFeatureCount({sourceId: source.id, cacheId: null}, function(resultArray){
    log.debug("The source already has features", resultArray);
    if (resultArray[0].count !== '0') {
      return callback(true);
    } else {
      return callback(false);
    }
  });
}

function parseGeoJSONFile(source, callback, progressCallback) {
  log.info('reading in the file', source.file.path);
  fs.readFile(source.file.path, function(err, fileData) {
    log.debug('parsing file data', source.file.path);
    console.time('parsing geojson');
    var gjData = JSON.parse(fileData);
    console.timeEnd('parsing geojson');
    // save the geojson to the db
    log.debug('gjdata.features', gjData.features.length);
    var count = 0;
    async.eachSeries(gjData.features, function iterator(feature, callback) {
      async.setImmediate(function() {
        var fivePercent = Math.floor(gjData.features.length * 0.05);
        // console.log('create feature', feature);
        FeatureModel.createFeature(feature, {sourceId:source.id}, function(err) {
          if (err) log.error('err', err);
          count++;
          async.setImmediate(function() {
            if (count % fivePercent === 0) {
              source.status.message="Processing " + ((count/gjData.features.length)*100) + "% complete";
              progressCallback(source, function(err, updatedSource) {
                source = updatedSource;
                callback(null, feature);
      				});
            } else {
              callback(null, feature);
            }
          });
        });
      });
    }, function done() {
      log.info('done processing features');
      completeProcessing(source, function(err, source) {
        callback(null, source);
      });
    });
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
  log.info('looking for properties for source %s: %s', source.name, source.id);
  FeatureModel.getPropertyKeysFromSource({sourceId: source.id}, function(propertyArray){
    log.info('property array', propertyArray);
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

GeoJSON.prototype.getDataWithin = function(west, south, east, north, projection, callback) {
  if (this.source) {
    FeatureModel.findFeaturesWithin({sourceId: this.source.id}, west, south, east, north, projection, callback);
  } else {
    var c = this.cache;
    FeatureModel.findFeaturesByCacheIdWithin(c.cache.id, west, south, east, north, projection, callback);
  }
};

GeoJSON.prototype.getTile = function(format, z, x, y, params, callback) {
  log.info('get the tile %d %d %d from GeoJSON', z, x, y);
  if (this.source) {
    getTileFromSource(this.source, z, x, y, format, params, callback);
  } else if (this.cache) {
    var sorted = this.cache.map.dataSources.sort(zOrderDatasources);
    params = params || {};
    if (!params.dataSources || params.dataSources.length === 0) {
      params.dataSources = [];
      for (var i = 0; i < sorted.length; i++) {
        params.dataSources.push(sorted[i].source.id);
      }
    }

    if (format === 'png') {
      this.cache.getTile(format, z, x, y, params, callback);
    } else {
      var queue = new StreamQueue();

      var first = true;
      var stream = new Readable();
      stream.push('{"type":"FeatureCollection","features":[');
      stream.push(null);
      queue.queue(stream);
      async.eachSeries(sorted, function iterator(s, callback) {
        s = s.source;
        if (params.dataSources.indexOf(s.id) === -1) return callback();
        var DataSource = require('./' + s.format);
        var dataSource = new DataSource({source: s});
        dataSource.getTile(format, z, x, y, params, function(err, dataStream) {
          if (!dataStream) {
            return callback(null);
          }
          if (!first) {
            var stream = new Readable();
            stream.push(',');
            stream.push(null);
            queue.queue(stream);
          } else {
            first = false;
          }

          queue.queue(dataStream);
          callback(null, dataStream);

        });
      }, function done() {
        log.debug('done getting tile for cache');
        var stream = new Readable();
        stream.push(']}');
        stream.push(null);
        queue.queue(stream);
        queue.done();
        callback(null, queue);
      });
    }
  }
};

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

function getTileFromSource(source, z, x, y, format, params, callback) {
  log.info('get tile %d/%d/%d.%s for source %s', z, x, y, format, source.name);

  tile.getVectorTile(source, format, z, x, y, params, callback);
}

module.exports = GeoJSON;
