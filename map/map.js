var models = require('mapcache-models')
  , log = require('mapcache-log')
  , Canvas = require('canvas')
  , Image = Canvas.Image
  , fs = require('fs-extra')
  , async = require('async')
  , path = require('path')
  , q = require('q');

var Map = function(map, config) {
  this.map = map || {};
  this.config = config || {};
  this.initDefer = q.defer();
  this.initPromise = this.initDefer.promise;
  this.initialize();
}

Map.prototype.callbackWhenInitialized = function(callback) {
  this.initPromise.then(function(self) {
    callback(null, self);
  });
}

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
    self.initialized = true;
    if (callback) {
      callback(null, self);
    }
    self.initDefer.resolve(self);
  });
}

Map.prototype.addDataSource = function(ds, callback) {
  log.debug('Adding a %s data source processor', ds.format);

  var self = this;
  if (ds.getTile) {
    log.debug('data source is already made', ds);
    if (ds.source.status && ds.source.status.complete) {
      log.debug('Adding the datasource %s to add to the map %s', ds.source.id, this.map.id);
      self.map.dataSources.push(ds);
      callback(null, ds);
    } else {
      log.debug('Processing the datasource %s to add to the map %s', ds.source.id, this.map.id);
      ds.processSource(function(err, source) {
        self.map.dataSources.push(ds);
        log.debug('Adding the datasource %s to add to the map %s', ds.source.id, this.map.id);
        callback(null, ds);
      });
    }
  } else {
    log.debug('have to make the ds', ds);
    var DataSource = require('../format/'+ds.format);
    log.debug('made it');
    var dsObj = new DataSource({source: ds});
    log.debug('dsobj', dsObj);
    if (dsObj.source.status && dsObj.source.status.complete) {
      self.map.dataSources.push(dsObj);
      log.debug('Adding the datasource %s to add to the map %s', dsObj.source.id, self.map.id);
      callback(null, dsObj);
    } else {
      log.debug('Processing the datasource %s to add to the map %s', ds.id, self.map.id);
      try {
      dsObj.processSource(function(err, source) {
        if (err) { log.error('Error processing the datasource %s', ds.id, err); }
        self.map.dataSources.push(dsObj);
        log.debug('Adding the datasource %s to add to the map %s', dsObj.source.id, self.map.id);
        callback(err, dsObj);
      });
    } catch (e) {
      console.log('e is', e);
      console.error(e.stack);
    }
    }
  }
}

// Map.prototype.getDataWithin = function(west, south, east, north, projection, sourceDataCallback, doneCallback) {
//   this.initPromise.then(function(self) {
//     async.eachSeries(self.map.dataSources, function iterator(s, callback) {
//       sourceDataCallback()
//     }, function done() {
//
//     });
//   });
// }

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

    var sorted = self.map.dataSources.sort(zOrderDatasources);
    params = params || {};
    if (!params.dataSources || params.dataSources.length == 0) {
      params.dataSources = [];
      for (var i = 0; i < sorted.length; i++) {
        params.dataSources.push(sorted[i].source.id);
      }
    }
    var canvas = new Canvas(256,256);
    var ctx = canvas.getContext('2d');
    var height = canvas.height;

    ctx.clearRect(0, 0, height, height);

    async.eachSeries(sorted, function iterator(s, callback) {
      if (params.dataSources.indexOf(s.source.id) == -1) return callback();
      s.getTile(format, z, x, y, params, function(err, tileStream) {
        if (!tileStream) return callback();

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
      if (dir) {
        var stream = fs.createOutputStream(path.join(dir, filename));
        stream.on('close',function(status){
        });

        canvas.pngStream().pipe(stream);
      }

      log.info('Tile %d %d %d was created for map %s, returning', z, x, y, self.map.id);
      callback(null, canvas.pngStream());
    });
  });
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

module.exports = Map;
