var log = require('mapcache-log')
  , Canvas = require('canvas')
  , xyzTileUtils = require('xyz-tile-utils')
  , Image = Canvas.Image
  , turf = require('turf')
  , fs = require('fs-extra')
  , async = require('async')
  , path = require('path')
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
  log.debug('There are %d data sources to process', this.map.dataSources.length);
  var tempDataSources = this.map.dataSources || [];
  this.map.dataSources = [];
  var self = this;
  async.eachSeries(tempDataSources, function(ds, done) {
    log.info('Processing the data source %s', ds.name);
    self.addDataSource(ds, done);
  }, function done() {
    log.info('Map %s was initialized', self.map.id);
    // log.info('self.map', self.map);
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
    log.debug('data source is already made', ds);
    if (ds.source.status && ds.source.status.complete) {
      log.debug('Adding the datasource %s to add to the map %s', ds.source.id, this.map.id);
      self.dataSources.push(ds);
      self.map.dataSources.push(ds.source);
      callback(null, ds);
    } else {
      log.debug('Processing the datasource %s to add to the map %s', ds.source.id, this.map.id);
      ds.processSource(function(err) {
        if (err) {
          self.dataSourceErrors[ds.source.id] = err;
          log.error('error processing the source', err);
        } else {
          self.dataSources.push(ds);
          self.map.dataSources.push(ds.source);
          log.debug('Adding the datasource %s to add to the map %s', ds.source.id, this.map.id);
        }
        callback(null, ds);
      });
    }
  } else {
    var DataSource = require('../format/'+ds.format);
    var dsObj = new DataSource({source: ds});
    // if (dsObj.source.status && dsObj.source.status.complete) {
    //   self.dataSources.push(dsObj);
    //   self.map.dataSources.push(dsObj.source);
    //   log.debug('Adding the datasource %s to add to the map %s', dsObj.source.id, self.map.id);
    //   callback(null, dsObj);
    // } else {
      log.debug('Processing the datasource %s to add to the map %s', ds.id, self.map.id);
      try {
        dsObj.processSource(function(err, source) {
          if (err) {
            self.dataSourceErrors[ds.id] = err;
            log.error('Error processing the datasource %s', ds.id, err);
          } else {
            log.info('finished processing the source %s', source.id);
            self.dataSources.push(dsObj);
            self.map.dataSources.push(dsObj.source);
            log.debug('Adding the datasource %s to add to the map %s', dsObj.source.id, self.map.id);
          }
          callback(err, dsObj);
        });
      } catch (e) {
        console.log('e is', e);
        console.error(e.stack);
      }
    // }
  }
};

Map.prototype.getOverviewTile = function(callback) {
  var merged;
  for (var i = 0; i < this.map.dataSources.length; i++) {
    var ds = this.map.dataSources[i];
    if (ds.geometry && !merged) {
      merged = ds.geometry;
    } else {
      merged = turf.merge(merged, ds.geometry);
    }
  }
  var extent;
  if (merged) {
    extent = turf.extent(merged);
  } else {
    extent = [-180, -85, 180, 85];
  }
  var xyz = xyzTileUtils.getXYZFullyEncompassingExtent(extent);
  this.getTile('png', xyz.z, xyz.x, xyz.y, {}, callback);
};

Map.prototype.getTile = function(format, z, x, y, params, callback) {
  log.info('get tile %d/%d/%d.%s for map %s', z, x, y, format, this.map.id);
  log.info('the map is initialized?', this.initialized);
  this.initPromise.then(function(self) {

    if (self.config && self.config.outputDirectory) {
      var dir = path.join(self.config.outputDirectory, self.map.id, 'tiles', z.toString(), x.toString());
      var filename = y + '.png';

      log.debug('tile %d %d %d will be written to %s', z, y, x, path.join(dir, filename));

      if (fs.existsSync(path.join(dir, filename)) && (!params || (params && !params.noCache))) {
        log.debug('file already exists, returning: %s', path.join(dir, filename));
        return callback(null, fs.createReadStream(path.join(dir, filename)));
      }
      log.info('the file %s does not exist for the map %s, creating', path.join(dir, filename), self.map.id);
    }

    var sorted = self.dataSources.sort(zOrderDatasources);
    params = params || {};
    if (!params.dataSources || params.dataSources.length === 0) {
      params.dataSources = [];
      for (var i = 0; i < sorted.length; i++) {
        params.dataSources.push(sorted[i].source.id);
      }
    }
    var canvas = new Canvas(256,256);
    var ctx = canvas.getContext('2d');
    var height = canvas.height;

    ctx.clearRect(0, 0, height, height);
    log.info('self.dataSourceErrors', self.dataSourceErrors);
    async.eachSeries(sorted, function iterator(s, callback) {
      log.info('self.dataSourceErrors[s.source.id]', self.dataSourceErrors[s.source.id]);
      if (params.dataSources.indexOf(s.source.id) === -1 || self.dataSourceErrors[s.source.id]) return callback();
      s.getTile(format, z, x, y, params, function(err, tileStream) {
        if (!tileStream) return callback();

        var buffer = new Buffer(0);
        tileStream.on('data', function(chunk) {
          buffer = Buffer.concat([buffer, chunk]);
        });
        tileStream.on('end', function() {
          var img = new Image();
          img.onload = function() {
            ctx.drawImage(img, 0, 0, img.width, img.height);
            callback();
          };
          img.src = buffer;
        });
      });
    }, function done() {
      if (dir) {
        var stream = fs.createOutputStream(path.join(dir, filename));
        canvas.pngStream().pipe(stream);
      }

      log.info('Tile %d %d %d was created for map %s, returning', z, x, y, self.map.id);
      callback(null, canvas.pngStream());
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
