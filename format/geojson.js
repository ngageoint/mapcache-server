var tileImage = require('tile-image')
  , log = require('mapcache-log')
  , Canvas = require('canvas')
  , Image = Canvas.Image
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
  log.debug('Constructing a GeoJSON format', config);
  this.config = config || {};
  this.source = this.config.source;
  this.cache = this.config.cache;
  if (this.config.cache && !this.config.outputDirectory) {
    throw new Error('An output directory must be specified in config.outputDirectory');
  }
}

GeoJSON.prototype.generateCache = function(doneCallback, progressCallback) {
  doneCallback = doneCallback || function() {};
  progressCallback = progressCallback || function(cache, callback) {callback(null, cache);};
  var cacheObj = this.cache;
  var cache = this.cache.cache;

  var dir = path.join(this.config.outputDirectory, cache.id, 'geojson');
  var filename = cache.id + '.geojson';
  fs.emptyDirSync(dir);

  if (fs.existsSync(path.join(dir, filename))) {
    log.info('Cache already exists, returning');
    return doneCallback(null, cacheObj);
  }

  log.info('Generating cache with id %s', this.cache.cache.id);

  FeatureModel.writeAllCacheFeatures(cache.id, path.join(dir, filename), 'geojson', function(err, result) {
    log.info('Wrote the GeoJSON for cache %s to the file %s', cache.id, path.join(dir, filename));
    return doneCallback(null, cacheObj);
  });
}

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
        console.log('source was already processed, returning', source);

        doneCallback(null, source);
      });
    }
    source.status.message = "Parsing GeoJSON";
    progressCallback(source, function(err, updatedSource) {
      console.log('updated source', updatedSource);
      if (updatedSource.url) {
        var dir = path.join(config.server.sourceDirectory.path, updatedSource.id);
        fs.mkdirp(dir, function(err) {
          if (err) return callback(err);
          var req = request.get({url: updatedSource.url})
          .on('error', function(err) {
            console.log(err+ updatedSource.url);

            callback(err);
          })
          .on('response', function(response) {
            var size = response.headers['content-length'];
            SourceModel.updateSourceAverageSize(updatedSource, size, function(err) {
            });
          });
          if (req) {
            var stream = fs.createWriteStream(dir + '/' + updatedSource.id + '.geojson');
        		stream.on('close',function(status) {
              fs.stat(dir + '/' + updatedSource.id + '.geojson', function(err, stat) {
                updatedSource.filePath = dir + '/' + updatedSource.id + '.geojson';
                updatedSource.size = stat.size;
                updatedSource.status = {
                  message: "Creating",
                  complete: false,
                  zoomLevelStatus: {}
                };
                SourceModel.updateDatasource(updatedSource, function(err, updatedSource) {
                  parseGeoJSONFile(updatedSource, function(err, updatedSource) {
                    callback();
                  });
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
          console.log('updated source style blabhabl', source);
          doneCallback(err, source);
        }, progressCallback);
      } else {
        doneCallback(new Error('file does not exist and URL is not specified'));
      }
    });
  });
}

function isAlreadyProcessed(source, callback) {
  log.debug('is it already processed?', source);
  if (source.status && source.status.complete) {
    return callback(true);
  }
  FeatureModel.getFeatureCount({sourceId: source.id, cacheId: null}, function(resultArray){
    log.debug("The source already has features", resultArray);
    if (resultArray[0].count != '0') {
      return callback(true);
    } else {
      return callback(false);
    }
  });
}

function parseGeoJSONFile(source, callback, progressCallback) {
  var stream = fs.createReadStream(source.file.path);
  console.log('reading in the file', source.file.path);
  fs.readFile(source.file.path, function(err, fileData) {
    console.log('parsing file data', source.file.path);
    console.time('parsing geojson');
    var gjData = JSON.parse(fileData);
    console.timeEnd('parsing geojson');
    // save the geojson to the db
    console.log('gjdata.features', gjData.features.length);
    var count = 0;
    async.eachSeries(gjData.features, function iterator(feature, callback) {
      async.setImmediate(function() {
        var fivePercent = Math.floor(gjData.features.length * .05);
        // console.log('create feature', feature);
        FeatureModel.createFeature(feature, {sourceId:source.id}, function(err) {
          count++;
          // console.log('err', err);
          async.setImmediate(function() {
            if (count % fivePercent == 0) {
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
      console.log('done processing features');
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

GeoJSON.prototype.getDataWithin = function(west, south, east, north, projection, callback) {
  if (this.source) {
    FeatureModel.findFeaturesWithin({sourceId: this.source.id}, west, south, east, north, projection, callback);
  } else {
    FeatureModel.findFeaturesByCacheIdWithin(this.cache.id, west, south, east, north, projection, callback);
  }
}

GeoJSON.prototype.getTile = function(format, z, x, y, params, callback) {
  log.info('get the tile %d %d %d from GeoJSON', z, x, y);
  if (this.source) {
    getTileFromSource(this.source, z, x, y, format, params, callback);
  } else if (this.cache) {
    var map = this.cache.source;
    var sorted = map.dataSources.sort(zOrderDatasources);
    params = params || {};
    if (!params.dataSources || params.dataSources.length == 0) {
      params.dataSources = [];
      for (var i = 0; i < sorted.length; i++) {
        params.dataSources.push(sorted[i].id);
      }
    }

    if (format == 'png') {
      var canvas = new Canvas(256,256);
      var ctx = canvas.getContext('2d');
      var height = canvas.height;

      ctx.clearRect(0, 0, height, height);

      async.eachSeries(sorted, function iterator(s, callback) {
        if (params.dataSources.indexOf(s.id) == -1) return callback();
        console.log('constructing the data source format %s', s.format);
        var DataSource = require('./' + s.format);
        var dataSource = new DataSource({source: s});
        dataSource.getTile(format, z, x, y, params, function(err, tileStream) {
          if (!tileStream) {
            return callback();
          }
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
      }, function done() {
        console.log('done getting tile for cache');
        callback(null, canvas.pngStream());
      });
    } else {
      var queue = new StreamQueue();

      var first = true;
      var stream = new Readable();
      stream.push('{"type":"FeatureCollection","features":[');
      stream.push(null);
      queue.queue(stream);
      async.eachSeries(sorted, function iterator(s, callback) {
        if (params.dataSources.indexOf(s.id) == -1) return callback();
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
        console.log('done getting tile for cache');
        var stream = new Readable();
        stream.push(']}');
        stream.push(null);
        queue.queue(stream);
        queue.done();
        callback(null, queue);
      });
    }
  }
}

function zOrderDatasources(a, b) {
  if (a.zOrder < b.zOrder) {
    return -1;
  }
  if (a.zOrder > b.zOrder) {
    return 1;
  }
  // a must be equal to b
  return 0;
}

function getTileForCache(cache, z, x, y, format, params, callback) {

  return tile.getVectorTile(cache, format, z, x, y, params, callback);
  // var dir = createDir(source._id, 'xyztiles/' + z + '/' + x + '/');
  // var filename = y + '.png';
  //
  // if (fs.existsSync(dir + filename)) {
  //   console.log('file already exists, skipping: %s', dir+filename);
  //   return done(null, dir+filename);
  // }
}

function getTileFromSource(source, z, x, y, format, params, callback) {
  console.log('get tile %d/%d/%d.%s for source %s', z, x, y, format, source.name);

  tile.getVectorTile(source, format, z, x, y, params, callback);
}

function createDir(cacheName, filepath){
	if (!fs.existsSync(config.server.cacheDirectory.path + '/' + cacheName +'/'+ filepath)) {
    fs.mkdirsSync(config.server.cacheDirectory.path + '/' + cacheName +'/'+ filepath, function(err){
       if (err) console.log(err);
     });
	}
  return config.server.cacheDirectory.path + '/' + cacheName +'/'+ filepath;
}

module.exports = GeoJSON;
