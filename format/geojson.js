var tileImage = require('tile-image')
  , Canvas = require('canvas')
  , Image = Canvas.Image
  , tile = require('mapcache-tile')
  , FeatureModel = require('mapcache-models').Feature
  , config = require('mapcache-config')
  , turf = require('turf')
  , Readable = require('stream').Readable
  , StreamQueue = require('streamqueue')
  , request = require('request')
  , fs = require('fs')
  , async = require('async');

var GeoJSON = function(config) {
  config = config || {};
  this.source = config.source;
  this.cache = config.cache;


  // this.initDefer = q.defer();
  // this.initPromise = this.initDefer.promise;
  // this.initialize();
}

GeoJSON.prototype.initialize = function() {
}

GeoJSON.prototype.processSource = function(doneCallback, progressCallback) {
  doneCallback = doneCallback || function() {};
  progressCallback = progressCallback || function(source, callback) {callback(null, source);};
  var source = this.source;
  source.status = source.status || {};
  source.status.message = "Parsing GeoJSON";
  source.vector = true;
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
        doneCallback(err, updatedSource);
      }, progressCallback);
    } else {
      doneCallback(new Error('file does not exist and URL is not specified'));
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
    console.log('gjdata', gjData.features[0].geometry);
    // save the geojson to the db
    console.log('gjdata.features', gjData.features.length);
    var count = 0;
    async.eachSeries(gjData.features, function iterator(feature, callback) {
      async.setImmediate(function() {
        var fivePercent = Math.floor(gjData.features.length * .05);
        console.log('create feature', feature);
        FeatureModel.createFeatureForSource(feature, source.id, function(err) {
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
      source.status.totalFeatures = gjData.features.length;
      var geometry = turf.envelope(gjData);
      if (gjData.features.length == 1) {
        var twoPoints = gjData;
        twoPoints.features.push({
          type: "Feature",
          properties: {},
          geometry: {
            type: "Point",
            coordinates: [gjData.features[0].geometry.coordinates[0] + 1, gjData.features[0].geometry.coordinates[1] + 1]
          }
        });
        geometry = turf.envelope(twoPoints);
      }
    	source.geometry = geometry;
      source.style = {
    		defaultStyle: {
    			style: {
    				'fill': "#000000",
    				'fill-opacity': 0.5,
    				'stroke': "#0000FF",
    				'stroke-opacity': 1.0,
    				'stroke-width': 1
    			}
    		},
    		styles: []
    	};
      source.status.complete = true;
			source.status.message = "Complete";
			source.properties = [];
			var allProperties = {};
			for (var i = 0; i < gjData.features.length; i++) {
				var feature = gjData.features[i];
				for (var property in feature.properties) {
					allProperties[property] = allProperties[property] || {key: property, values:[]};
					if (allProperties[property].values.indexOf(feature.properties[property]) == -1) {
						allProperties[property].values.push(feature.properties[property]);
					}
				}
			}
			for (var property in allProperties) {
				source.properties.push(allProperties[property]);
			}
      callback(null, source);
      // console.log('saving source');
      // SourceModel.updateDatasource(source, function(err, updatedSource) {
      //   source = updatedSource;
      //   callback(null, updatedSource);
      // });
    });

  });
}

GeoJSON.prototype.getTile = function(format, z, x, y, params, callback) {
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
