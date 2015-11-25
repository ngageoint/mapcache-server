var models = require('mapcache-models')
  , Canvas = require('canvas')
  , Image = Canvas.Image
  , fs = require('fs-extra')
  , async = require('async')
  , Map = require('../map/map')
  , util = require('util')
  , q = require('q');

var Cache = function(cache) {
  this.cache = cache || {};
  if (this.cache && !this.cache.status) {
    this.cache.status = {};
  }
  this.initDefer = q.defer();
  this.initPromise = this.initDefer.promise;
  this.initialize();
}

Cache.prototype.initialize = function() {
  console.log('init');
  var self = this;
  if (this.cache.source && !this.cache.source.getTile) {
    console.log('make a map');
    var map = new Map(this.cache.source);
    map.callbackWhenInitialized(function(err, map) {
      console.log('map was initialized');
      self.cache.source = map;
      self.initDefer.resolve(self);
    });
  } else {
    console.log('map already made');
    self.initDefer.resolve(self);
  }
}

Cache.prototype.callbackWhenInitialized = function(callback) {
  this.initPromise.then(function(self) {
    callback(null, self);
  });
}

Cache.prototype.getTile = function(format, z, x, y, params, callback) {
  this.initPromise.then(function(self) {
    params = util._extend(params, self.cache.cacheCreationParams);
    var dir = createDir(self.cache.outputDirectory + '/' + self.cache.id, '/tiles/' + z + '/' + x + '/');
    var filename = y + '.' + format;
    console.log('params are now', JSON.stringify(params, null, 2));

    if (fs.existsSync(dir + filename) && !params.noCache) {
      console.log('file already exists, skipping: %s', dir+filename);
      return callback(null, fs.createReadStream(dir+filename));
    }
    self.cache.source.getTile(format, z, x, y, params, function(err, tileStream) {
      var stream = fs.createWriteStream(dir + filename);

      stream.on('close',function(status){
      });

      tileStream.pipe(stream);

      callback(null, stream);
    });
  });
}

// Cache.prototype.getDataWithin = function(west, south, east, north, projection, sourceDataCallback, doneCallback) {
//   this.initPromise.then(function(self) {
//
//     self.cache.source.getDataWithin(west, south, east, north, projection, sourceDataCallback, doneCallback);
//     // params = util._extend(params, self.cache.cacheCreationParams);
//     // var dir = createDir(self.cache.outputDirectory + '/' + self.cache.id, '/tiles/' + z + '/' + x + '/');
//     // var filename = y + '.' + format;
//     // console.log('params are now', JSON.stringify(params, null, 2));
//     //
//     // if (fs.existsSync(dir + filename) && !params.noCache) {
//     //   console.log('file already exists, skipping: %s', dir+filename);
//     //   return callback(null, fs.createReadStream(dir+filename));
//     // }
//     // self.cache.source.getTile(format, z, x, y, params, function(err, tileStream) {
//     //   var stream = fs.createWriteStream(dir + filename);
//     //     stream.on('close',function(status){
//     //   });
//     //
//     //   tileStream.pipe(stream);
//     //
//     //   callback(null, tileStream);
//     // });
//   });
// }

function createDir(cacheName, filepath){
	if (!fs.existsSync(cacheName +'/'+ filepath)) {
    fs.mkdirsSync(cacheName +'/'+ filepath, function(err){
       if (err) console.log(err);
     });
	}
  return cacheName +'/'+ filepath;
}

module.exports = Cache;
