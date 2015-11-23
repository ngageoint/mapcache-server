var tileImage = require('tile-image')
  , Canvas = require('canvas')
  , Image = Canvas.Image
  , fs = require('fs-extra')
  , request = require('request')
  , turf = require('turf')
  , path = require('path')
  , xyzTileUtils = require('xyz-tile-utils')
  , async = require('async');

var XYZ = function(config) {
  console.log('config', config);
  this.config = config || {};
  this.source = config.source;
  this.cache = config.cache;
  if (config.cache && !config.outputDirectory) {
    throw new Error('An output directory must be specified in config.outputDirectory');
  }
  console.log('turd');
}

XYZ.prototype.initialize = function() {
}

XYZ.prototype.processSource = function(doneCallback, progressCallback) {
  this.source.status = this.source.status || {};
  this.source.status.message = "Complete";
  this.source.status.complete = true;
  doneCallback(null, this.source);
}

XYZ.prototype.getDataWithin = function(west, south, east, north, projection, callback) {
  callback(null, null);
}

XYZ.prototype.getTile = function(format, z, x, y, params, callback) {
  if (this.source) {
    getTileFromSource(this.source, z, x, y, format, callback);
  } else if (this.cache) {
    getTileForCache(this.cache.cache, z, x, y, format, params, this.config.outputDirectory, callback);
  }
}

XYZ.prototype.generateCache = function(callback, progressCallback) {
  console.log('generate cache');
  var self = this;
  callback = callback || function() {};
  progressCallback = progressCallback || function(cache, callback) {
    callback(null, cache);
  }
  var cache = this.cache.cache;
  xyzTileUtils.iterateAllTilesInExtent(turf.extent(cache.geometry), cache.minZoom, cache.maxZoom, cache, function(tile, callback) {
    console.log('process the tile', tile);
    var dir = createDir(cache.outputDirectory + '/' + cache.id, 'xyztiles/' + tile.z + '/' + tile.x + '/');
    var filename = tile.y + '.png';

    if (fs.existsSync(path.join(dir, filename)) && (!cache.cacheCreationParams || (cache.cacheCreationParams && !cache.cacheCreationParams.noCache))) {
      console.log('file already exists, skipping: %s', path.join(dir, filename));
      return callback(null, tile);
    } else {
      console.log('the file %s does not exist for the xyz cache, creating', path.join(dir, filename));
      console.log('getting the tile from the map');
      cache.source.getTile('png', tile.z, tile.x, tile.y, cache.cacheCreationParams, function(err, stream) {
        console.log('got the tile stream for tile', tile);
        var ws = fs.createWriteStream(path.join(dir, filename));
        stream.pipe(ws);
        ws.on('finish', function(){
          callback(null, tile);
        });
      });
    }
  },
  function(zoom, callback) {
    console.log('zoom level %d is done', zoom);
    callback();
  },
  function(err, data) {
    console.log('all tiles are done');
    console.log('data', data);
    self.cache.cache = data;
    callback(null, self.cache);
  });
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

function getTileForCache(cache, z, x, y, format, params, outputDirectory, callback) {
  var dir = createDir(outputDirectory + '/' + cache.id, 'xyztiles/' + z + '/' + x + '/');
  var filename = y + '.png';

  if (fs.existsSync(dir + filename) && !params.noCache) {
    console.log('file already exists, skipping: %s', dir+filename);
    return callback(null, fs.createReadStream(dir+filename));
  }

  var map = cache.source.map;
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
    s = s.source;
    if (params.dataSources.indexOf(s.id) == -1) return callback();
    console.log('s', s);
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
    var stream = fs.createWriteStream(dir + filename);
    stream.on('close',function(status){
    });

    canvas.pngStream().pipe(stream);

    callback(null, canvas.pngStream());
  });

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
	if (!fs.existsSync(path.join(cacheName, filepath))) {
    fs.mkdirsSync(path.join(cacheName, filepath), function(err){
       if (err) console.log(err);
     });
	}
  return path.join(cacheName, filepath);
}

module.exports = XYZ;
