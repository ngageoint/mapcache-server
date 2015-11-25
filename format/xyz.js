var tileImage = require('tile-image')
  , Canvas = require('canvas')
  , Image = Canvas.Image
  , fs = require('fs-extra')
  , request = require('request')
  , turf = require('turf')
  , path = require('path')
  , xyzTileUtils = require('xyz-tile-utils')
  , log = require('mapcache-log')
  , async = require('async');

var XYZ = function(config) {
  this.config = config || {};
  this.source = config.source;
  this.cache = config.cache;
  if (config.cache && !config.outputDirectory) {
    throw new Error('An output directory must be specified in config.outputDirectory');
  }
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
  log.info('Generating cache with id %s', this.cache.cache.id);
  var self = this;
  callback = callback || function() {};
  progressCallback = progressCallback || function(cache, callback) {
    callback(null, cache);
  }
  var cache = this.cache.cache;
    xyzTileUtils.iterateAllTilesInExtent(turf.extent(cache.geometry), cache.minZoom, cache.maxZoom, cache, function(tile, callback) {
      var dir = path.join(cache.outputDirectory, cache.id, 'xyztiles', tile.z.toString(), tile.x.toString());
      var filename = tile.y + '.png';

      log.debug('tile %d %d %d will be written to %s', tile.z, tile.y, tile.x, path.join(dir, filename));

      if (fs.existsSync(path.join(dir, filename)) && (!cache.cacheCreationParams || (cache.cacheCreationParams && !cache.cacheCreationParams.noCache))) {
        log.debug('file already exists, skipping: %s', path.join(dir, filename));
        return callback(null, tile);
      } else {
        log.info('the file %s does not exist for the xyz cache %s, creating', path.join(dir, filename), cache.id);
        cache.source.getTile('png', tile.z, tile.x, tile.y, cache.cacheCreationParams, function(err, stream) {
          var ws = fs.createOutputStream(path.join(dir, filename));
          stream.pipe(ws);
          ws.on('finish', function(){
            callback(null, tile);
          });
        });
      }
    },
    function(zoom, callback) {
      log.info('zoom level %d is done for %s', zoom, cache.id);
      callback();
    },
    function(err, data) {
      log.info('all tiles are done for %s', cache.id);
      self.cache.cache = data;
      callback(null, self.cache);
    }
  );
}

function getTileForCache(cache, z, x, y, format, params, outputDirectory, callback) {
  var dir = path.join(outputDirectory, cache.id, 'xyztiles', z.toString(), x.toString());
  var filename = y + '.png';

  if (fs.existsSync(path.join(dir, filename)) && (!params || (params && !params.noCache))) {
    log.info('file already exists, skipping: %s', path.join(dir,filename));
    return callback(null, fs.createReadStream(path.join(dir, filename)));
  }

  var map = cache.source.map;
  map.getTile(format, z, x, y, params, function(err, stream) {
    log.debug('Got the stream for the tile %d %d %d for cache %s', z, x, y, cache.id);
    if (err) {
      return callback(err);
    }

    var ws = fs.createOutputStream(path.join(dir, filename));
    stream.pipe(ws);
    callback(null, ws);
  });
}

function getTileFromSource(source, z, x, y, format, callback) {
  log.info('get tile %d/%d/%d.%s for source %s', z, x, y, format, source.name);
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

module.exports = XYZ;
