var models = require('mapcache-models')
  , Canvas = require('canvas')
  , Image = Canvas.Image
  , fs = require('fs-extra')
  , async = require('async')
  , path = require('path')
  , q = require('q');

var Map = function(map) {
  this.map = map || {};
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
  var tempDataSources = this.map.dataSources || [];
  this.map.dataSources = [];
  var self = this;
  async.eachSeries(tempDataSources, function(ds, done) {
    self.addDataSource(ds, done);
  }, function done() {
    console.log('the map is now', self.map.dataSources);
    if (callback) {
      callback(null, self);
    }
    self.initDefer.resolve(self);
  });
}

Map.prototype.addDataSource = function(ds, callback) {
  console.log('ds', ds);
  var self = this;
  if (ds.getTile) {
    if (ds.source.status && ds.source.status.complete) {
      self.map.dataSources.push(ds);
      callback(null, ds);
    } else {
      ds.processSource(function(err, source) {
        self.map.dataSources.push(ds);
        console.log('source', source);
        callback(null, ds);
      });
    }
  } else {
    console.log('ds', ds);
    var DataSource = require('../format/'+ds.format);
    var dsObj = new DataSource({source: ds});
    console.log('dsObj', dsObj);
    if (dsObj.source.status && dsObj.source.status.complete) {
      self.map.dataSources.push(dsObj);
      callback(null, dsObj);
    } else {
      dsObj.processSource(function(err, source) {
        self.map.dataSources.push(dsObj);
        callback(null, dsObj);
      });
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
  console.log('getting the tile from the map in map');
  this.initPromise.then(function(self) {
    console.log('promise resolved');
    console.log('create the dir', self.map.outputDirectory + '/' + self.map.id, '/tiles/' + z + '/' + x + '/');
    var dir = createDir(self.map.outputDirectory + '/' + self.map.id, '/tiles/' + z + '/' + x + '/');
    var filename = y + '.png';
    console.log('created the map directory', dir);

    if (fs.existsSync(path.join(dir, filename)) && (!params || (params && !params.noCache))) {
      console.log('file already exists, skipping: %s', path.join(dir, filename));
      return callback(null, fs.createReadStream(path.join(dir, filename)));
    }
    console.log('%s does not exist so we will create it', path.join(dir, filename));

    var sorted = self.map.dataSources.sort(zOrderDatasources);
    console.log('params in the map', params);
    params = params || {};
    if (!params.dataSources || params.dataSources.length == 0) {
      params.dataSources = [];
      for (var i = 0; i < sorted.length; i++) {
        params.dataSources.push(sorted[i].source.id);
      }
    }

    console.log('params in the map now', params);

    var canvas = new Canvas(256,256);
    var ctx = canvas.getContext('2d');
    var height = canvas.height;

    ctx.clearRect(0, 0, height, height);

    async.eachSeries(sorted, function iterator(s, callback) {
      if (params.dataSources.indexOf(s.source.id) == -1) return callback();
      s.getTile(format, z, x, y, params, function(err, tileStream) {
        var buffer = new Buffer(0);
        var chunk;
        tileStream.on('data', function(chunk) {
          buffer = Buffer.concat([buffer, chunk]);
        });
        tileStream.on('end', function() {
          var img = new Image;
          img.onload = function() {
            console.log('img.width', img.width);
            console.log('img.height', img.height);
            ctx.drawImage(img, 0, 0, img.width, img.height);
            console.log('done drawing source', s.source.id);
            callback();
          };
          img.src = buffer;
        });
      });
    }, function done() {
      var stream = fs.createWriteStream(path.join(dir, filename));
      stream.on('close',function(status){
      });

      canvas.pngStream().pipe(stream);

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

function createDir(cacheName, filepath){
	if (!fs.existsSync(path.join(cacheName,filepath))) {
    fs.mkdirsSync(path.join(cacheName,filepath), function(err){
       if (err) console.log(err);
     });
	}
  return path.join(cacheName,filepath);
}

module.exports = Map;
