var FeatureModel = require('mapcache-models').Feature
  , turf = require('turf')
  , Canvas = require('canvas')
  , log = require('mapcache-log')
  , Image = Canvas.Image
  , fs = require('fs-extra')
  , async = require('async')
  , Map = require('../map/map')
  , util = require('util')
  , q = require('q');

var Cache = function(cache) {
  console.log('cache', cache.source.id);
  this.cache = cache || {};
  this.map = {};
  if (this.cache && !this.cache.status) {
    this.cache.status = {};
  }
  this.initDefer = q.defer();
  this.initPromise = this.initDefer.promise;
  this.initialize();
}

Cache.prototype.initialize = function() {
  var self = this;
  if (this.cache.source && !this.cache.source.getTile) {
    var map = new Map(this.cache.source, {outputDirectory: this.cache.outputDirectory});
    map.callbackWhenInitialized(function(err, map) {
      console.log('map id', map);
      console.log('map.source.id', map.map.id);
      console.log('map initilzed in cache', self.cache);
      self.map = map;
      self.cache.source = map.map;
      self._updateDataSourceParams();
      self.initDefer.resolve(self);
    });
  } else {
    self._updateDataSourceParams();
    self.initDefer.resolve(self);
  }
}

Cache.prototype._updateDataSourceParams = function() {
  var mapSources = this.map.dataSources;
  var params = this.cache.cacheCreationParams || {};
  if (!params.dataSources || params.dataSources.length == 0) {
    params.dataSources = [];
    for (var i = 0; i < mapSources.length; i++) {
      params.dataSources.push(mapSources[i].source.id);
    }
  }

  this.cache.cacheCreationParams = this.cache.cacheCreationParams || {};
  this.cache.cacheCreationParams.dataSources = params.dataSources;
}

Cache.prototype.callbackWhenInitialized = function(callback) {
  this.initPromise.then(function(self) {
    console.log('calling back in cache');
    callback(null, self);
  });
}

Cache.prototype.generateFormat = function(format, doneCallback, progressCallback) {
  log.info("Generate the format %s for cache %s", format, this.cache.id);
  this.callbackWhenInitialized(function(err, self) {
    var mapSources = self.map.dataSources;
    self.cache.status = self.cache.status || {};
    self.cache.status.totalFeatures = 0;
    console.log('mapsources', mapSources);
    log.info('cacheCreationParams', self.cache.cacheCreationParams);
    var params = self.cache.cacheCreationParams || {};
    if (!params.dataSources || params.dataSources.length == 0) {
      params.dataSources = [];
      for (var i = 0; i < mapSources.length; i++) {
        log.debug('adding the datasource', mapSources[i].source.id);
        params.dataSources.push(mapSources[i].source.id);
      }
    }

    async.eachSeries(mapSources, function iterator(s, sourceFinishedCallback) {
      log.info('Checking source %s', s.source.id.toString());
      if (!s.source.vector) return sourceFinishedCallback();
      FeatureModel.getFeatureCount({sourceId: s.source.id, cacheId: self.cache.id}, function(countResults) {
        if (countResults[0].count != '0') {
          self.cache.status.totalFeatures = self.cache.status.totalFeatures + Number(countResults[0].count);
          return sourceFinishedCallback();
        }
        var extent = turf.extent(self.cache.geometry);
        extent[0] = Math.max(-180, extent[0]);
        extent[1] = Math.max(-85, extent[1]);
        extent[2] = Math.min(180, extent[2]);
        extent[3] = Math.min(85, extent[3]);
        FeatureModel.createCacheFeaturesFromSource(s.source.id, self.cache.id, extent[0], extent[1], extent[2], extent[3], function(err, features) {
          log.info('Created %d features for the cache %s from the source %s', features.rowCount, self.cache.id, s.source.id);
          self.cache.status.totalFeatures = self.cache.status.totalFeatures + features.rowCount;
          return sourceFinishedCallback();
        });
      });
    }, function(err) {
      // all sources have had their vector data generated
      self._generateFormat(format, doneCallback, progressCallback);
    });
  });
}

Cache.prototype._generateFormat = function(format, doneCallback, progressCallback) {
  var DataSource = require('../format/'+format);
  var ds = new DataSource({cache: this, outputDirectory: this.cache.outputDirectory});
  ds.generateCache(doneCallback, progressCallback);
}

Cache.prototype.getTile = function(format, z, x, y, params, callback) {
  if( typeof params === "function" && !callback) {
    callback = params;
		params = {};
  }
  callback = callback || function(){}

  this.initPromise.then(function(self) {
    console.log('promise inited in cache.getTile');
    self.map.getTile(format, z, x, y, params, function(err, tileStream) {
      log.debug('stream from the cache get tile is', tileStream);
      callback(null, tileStream);
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
