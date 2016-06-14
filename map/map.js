var log = require('mapcache-log')
  , lwip = require('lwip')
  , xyzTileUtils = require('xyz-tile-utils')
  , Feature = require('mapcache-models').Feature
  , Formats = require('../format')
  , BufferStream = require('simple-bufferstream')
  , turf = require('turf')
  , fs = require('fs-extra')
  , async = require('async')
  , path = require('path')
  , fileType = require('file-type')
  , q = require('q');

var Map = function(map, config) {
  this.map = map || {};
  this.dataSources = [];
  this.config = config || {};
  this.initDefer = q.defer();
  this.initPromise = this.initDefer.promise;
  this.dataSourceErrors = {};
  this.initialize();
};

Map.prototype.callbackWhenInitialized = function(callback) {
  this.initPromise.then(function(self) {
    callback(null, self);
  });
};

Map.prototype.initialize = function(callback) {
  log.info('Initializing the map with id %s', this.map.id);
  var self = this;
  async.eachSeries(this.map.dataSources, function(ds, done) {
    log.info('Processing the data source %s', ds.name);
    self.addDataSource(ds, done);
  }, function done() {
    log.info('Map %s was initialized', self.map.id);
    self.map.status = self.map.status || {};
    self.initialized = true;
    self.map.status.message = "Completed map processing";
    self.map.status.complete = true;
    if (callback) {
      callback(null, self);
    }
    self.initDefer.resolve(self);
  });
};

Map.prototype.addDataSource = function(ds, callback) {
  log.debug('Adding a %s data source processor', ds.format);

  var self = this;
  if (ds.getTile) {
    if (ds.source.status && ds.source.status.complete) {
      log.debug('Adding the datasource %s to add to the map %s', ds.source.id, this.map.id);
      self.dataSources.push(ds);
      // self.map.dataSources.push(ds.source);
      callback(null, ds);
    } else {
      log.debug('Processing the datasource %s to add to the map %s', ds.source.id, this.map.id);
      ds.processSource(function(err) {
        if (err) {
          self.dataSourceErrors[ds.source.id] = err;
          log.error('error processing the source', err);
        } else {
          self.dataSources.push(ds);
          // self.map.dataSources.push(ds.source);
          log.debug('Adding the datasource %s to add to the map %s', ds.source.id, this.map.id);
        }
        callback(null, ds);
      }, function(updatedDataSource, callback) {
        callback(null, updatedDataSource);
        if (self.config.progressCallback) {
          self.config.progressCallback(null, updatedDataSource);
        }
      });
    }
  } else {
    var DataSource = Formats.getFormat(ds.format);
    var dsObj = new DataSource({source: ds});
    log.debug('Processing the datasource %s to add to the map %s', ds.id, self.map.id);
    try {
      dsObj.processSource(function(err, source) {
        if (err) {
          self.dataSourceErrors[ds.id] = err;
          log.error('Error processing the datasource %s', ds.id, err);
        } else {
          self.dataSources.push(dsObj);
          log.debug('Adding the datasource %s to add to the map %s', dsObj.source.id, self.map.id);
        }
        callback(err, dsObj);
      }, function(updatedDataSource, callback) {
        callback(null, updatedDataSource);
        if (self.config.progressCallback) {
          self.config.progressCallback(null, updatedDataSource);
        }
      });
    } catch (e) {
      console.log('e is', e);
      console.error(e.stack);
    }
  }
};

Map.prototype.getOverviewTile = function(callback) {
  var merged;
  for (var i = 0; i < this.map.dataSources.length; i++) {
    var ds = this.map.dataSources[i];
    if (ds.geometry && !merged) {
      merged = ds.geometry;
    } else {
      merged = turf.union(merged, ds.geometry);
    }
  }

  var extent;
  if (merged) {
    extent = turf.bbox(merged);
  } else {
    extent = [-180, -85, 180, 85];
  }
  var xyz = xyzTileUtils.getXYZFullyEncompassingExtent(extent);
  this.getTile('png', xyz.z, xyz.x, xyz.y, {}, callback);
};

Map.prototype.getTile = function(format, z, x, y, params, callback) {
  log.info('[Retrieve Tile]:\t %d %d %d for map %s', z, x, y, this.map.id.toString());
  this.initPromise.then(function(self) {

    if (self.config && self.config.outputDirectory) {
      var dir = path.join(self.config.outputDirectory, self.map.id, 'tiles', z.toString(), x.toString());
      var filename = y + '.png';

      if (fs.existsSync(path.join(dir, filename)) && (!params || (params && !params.noCache))) {
        log.info('[Tile Exists]:\t %d %d %d for map %s', z, x, y, self.map.id.toString());
        return callback(null, fs.createReadStream(path.join(dir, filename)));
      }
    }

    var sorted = self.dataSources.sort(zOrderDatasources);
    params = params || {};
    if (!params.dataSources || params.dataSources.length === 0) {
      params.dataSources = [];
      for (var i = 0; i < sorted.length; i++) {
        params.dataSources.push(sorted[i].source.id);
      }
    }

    lwip.create(256, 256, function(err, image) {

      async.eachSeries(sorted, function iterator(s, callback) {
        if (params.dataSources.indexOf(s.source.id) === -1 || self.dataSourceErrors[s.source.id]) return callback();
        s.getTile(format, z, x, y, params, function(err, tileStream) {
          if (!tileStream) return callback();

          var buffer = new Buffer(0);
          tileStream.on('data', function(chunk) {
            buffer = Buffer.concat([buffer, chunk]);
          });
          tileStream.on('end', function() {
            var type = fileType(buffer);
            if (!type) return callback();
            lwip.open(buffer, type.ext, function(err, dsImage) {
              image.paste(0, 0, dsImage, function(err, image) {
                callback();
              });
            });
          });
        });
      }, function done() {
        image.toBuffer('png', function(err, buffer) {
          if (dir) {
            console.log('path.join(dir, filename)', path.join(dir, filename));
            var stream = fs.createOutputStream(path.join(dir, filename));
            stream.write(buffer);
          }
          callback(null, new BufferStream(buffer));
          log.info('[Tile Created]:\t %d %d %d for map %s', z, x, y, self.map.id.toString());
        });
      });

    });
  });
};

Map.prototype.getFeatures = function(west, south, east, north, zoom, callback) {
  var allFeatures = [];
  this.initPromise.then(function(self) {
    async.eachSeries(self.dataSources, function iterator(ds, dsDone) {
      if (ds.getDataWithin) {
        ds.getDataWithin(west, south, east, north, 4326, function(err, features) {
          allFeatures = allFeatures.concat(features);
          dsDone();
        });
      } else {
        dsDone();
      }
    }, function done() {
      callback(null, allFeatures);
    });
  });
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

module.exports = Map;
