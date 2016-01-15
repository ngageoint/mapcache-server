var tileImage = require('tile-image')
  , Canvas = require('canvas')
  , Image = Canvas.Image
  , request = require('request')
  , async = require('async');

var Tms = function(config) {
  config = config || {};
  this.source = config.source;
  this.cache = config.cache;
}

Tms.prototype.initialize = function() {
}

Tms.prototype.processSource = function(doneCallback, progressCallback) {
  this.source.status = this.source.status || {};
  this.source.status.message = "Complete";
  this.source.status.complete = true;
  this.source.geometry = {
    type: "Feature",
    properties: {},
    geometry: {
      type: "Polygon",
      coordinates: [[
        [180, -85],
        [-180, -85],
        [-180, 85],
        [180, 85],
        [180, -85]
      ]]
    }
  doneCallback(null, this.source);
}

Tms.prototype.getDataWithin = function(west, south, east, north, projection, callback) {
  callback(null, null);
}

Tms.prototype.getTile = function(format, z, x, y, params, callback) {
  format = format.toLowerCase();
  if (format != 'png' && format != 'jpeg') return callback(null, null);
  if (this.source) {
    getTileFromSource(this.source, z, x, y, format, callback);
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

function getTileForCache(callback) {
  var dir = createDir(source._id, 'xyztiles/' + z + '/' + x + '/');
  var filename = y + '.png';

  if (fs.existsSync(dir + filename)) {
    console.log('file already exists, skipping: %s', dir+filename);
    return done(null, dir+filename);
  }
}

function getTileFromSource(source, z, x, y, format, callback) {
  console.log('get tile %d/%d/%d.%s for source %s', z, x, y, format, source.name);
  var url = source.url + "/" + z + '/' + x + '/' + y + '.png';
  var req = null;
  if (format == 'jpg' || format == 'jpeg') {
    tileImage.pngRequestToJpegStream(callback);
  } else {
    req = request.get({url: url,
      headers: {'Content-Type': 'image/png'},
    });
    callback(null, req);
  }
}

function createDir(cacheName, filepath){
	if (!fs.existsSync(config.server.cacheDirectory.path + '/' + cacheName +'/'+ filepath)) {
    fs.mkdirsSync(config.server.cacheDirectory.path + '/' + cacheName +'/'+ filepath, function(err){
       if (err) console.log(err);
     });
	}
  return config.server.cacheDirectory.path + '/' + cacheName +'/'+ filepath;
}

module.exports = Tms;
