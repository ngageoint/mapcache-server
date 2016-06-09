var tileImage = require('tile-image')
  , fs = require('fs-extra')
  , request = require('request')
  , turf = require('turf')
  , path = require('path')
  , xyzTileUtils = require('xyz-tile-utils')
  , colors = require('colors')
  , log = require('mapcache-log');

var XYZ = function(config) {
  this.config = config || {};
  this.source = config.source;
  this.cache = config.cache;
  if (config.cache && !config.outputDirectory) {
    throw new Error('An output directory must be specified in config.outputDirectory');
  }
};

XYZ.prototype.processSource = function(doneCallback) {
  this.source.status = this.source.status || {};
  this.source.status.message = "Complete";
  this.source.status.failure = false;
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
  };
  doneCallback(null, this.source);
};

XYZ.prototype.getDataWithin = function(west, south, east, north, projection, callback) {
  callback(null, []);
};

XYZ.prototype.getTile = function(format, z, x, y, params, callback) {
  format = format.toLowerCase();
  if (format !== 'png' && format !== 'jpeg') return callback(null, null);
  if (this.source) {
    getTileFromSource(this.source, z, x, y, format, callback);
  } else if (this.cache) {
    getTileForCache(this.cache, z, x, y, format, params, this.config.outputDirectory, callback);
  }
};

XYZ.prototype.delete = function(callback) {
  if (!this.cache) return callback();
  fs.remove(path.join(this.config.outputDirectory, this.cache.cache ? this.cache.cache.id.toString() : this.cache.id.toString(), 'xyztiles'), callback);
};

XYZ.prototype.generateCache = function(callback, progressCallback) {
  var self = this;
  callback = callback || function() {};
  progressCallback = progressCallback || function(cache, callback) {
    callback(null, cache);
  };
  var cache = this.cache.cache;
  var cacheId = this.cache.cache.id;
  log.info('%s: %s', 'Generating Cache'.bold.bgBlue.yellow, cacheId.toString());
  cache.formats = cache.formats || {};
  cache.formats.xyz = cache.formats.xyz || {
    generatedTiles: 0,
    complete: false,
    size: 0,
    percentComplete: 0
  };

  cache.formats.xyz.totalTiles = xyzTileUtils.tileCountInExtent(turf.extent(cache.geometry), cache.minZoom, cache.maxZoom);

  cache.formats.xyz.zoomLevelStatus = [];
  for (var i = cache.minZoom; i <= cache.maxZoom; i++) {
    cache.formats.xyz.zoomLevelStatus[i] = {
      generatedTiles: 0,
      totalTiles: xyzTileUtils.tileCountInExtent(turf.extent(cache.geometry), i, i),
      complete: false,
      percentComplete: 0,
      size: 0
    };
  }
  progressCallback(cache, function(err, updatedCache) {
    cache = updatedCache;
    xyzTileUtils.iterateAllTilesInExtent(turf.extent(cache.geometry), cache.minZoom, cache.maxZoom, cache, function(tile, tileDone) {
        var dir = path.join(self.config.outputDirectory, cacheId.toString(), 'xyztiles', tile.z.toString(), tile.x.toString());
        var filename = tile.y + '.png';

        if (fs.existsSync(path.join(dir, filename)) && (!cache.cacheCreationParams || (cache.cacheCreationParams && !cache.cacheCreationParams.noCache))) {
          log.info('[Tile Exists]:\t %d %d %d for the xyz cache %s', tile.z, tile.x, tile.y, cacheId.toString());
          cache.formats.xyz.zoomLevelStatus[tile.z].generatedTiles++;
          cache.formats.xyz.zoomLevelStatus[tile.z].percentComplete = 100 * cache.formats.xyz.zoomLevelStatus[tile.z].generatedTiles / cache.formats.xyz.zoomLevelStatus[tile.z].totalTiles;
          cache.formats.xyz.generatedTiles++;
          cache.formats.xyz.percentComplete = 100 * cache.formats.xyz.generatedTiles/cache.formats.xyz.totalTiles;

          fs.stat(path.join(dir, filename), function(err, stat) {
            cache.formats.xyz.size += stat.size;
            cache.formats.xyz.zoomLevelStatus[tile.z].size += stat.size;
            progressCallback(cache, function(err, updatedCache) {
              cache = updatedCache;
              return tileDone(null, tile);
            });
        	});
        } else {
          self.cache.getTile('png', tile.z, tile.x, tile.y, cache.cacheCreationParams, function(err, stream) {
            console.log('Get Tile returned error and stream', err, !!stream);
            if (err) {
              log.error(err);
              return tileDone(null, null);
            } else if (!stream) {
              log.error('There was no tile for ' + path.join(dir, filename));
              return tileDone(null, null);
            }
            var ws = fs.createOutputStream(path.join(dir, filename));
            stream.pipe(ws);
            ws.on('finish', function(){
              log.info('[Saved Tile]:\t\t %d %d %d for the xyz cache %s', tile.z, tile.x, tile.y, cacheId.toString());
              cache.formats.xyz.zoomLevelStatus[tile.z].generatedTiles++;
              cache.formats.xyz.zoomLevelStatus[tile.z].percentComplete = 100 *  cache.formats.xyz.zoomLevelStatus[tile.z].generatedTiles / cache.formats.xyz.zoomLevelStatus[tile.z].totalTiles;
              cache.formats.xyz.generatedTiles++;
              cache.formats.xyz.percentComplete = 100 * cache.formats.xyz.generatedTiles/cache.formats.xyz.totalTiles;

              fs.stat(path.join(dir, filename), function(err, stat) {
                cache.formats.xyz.size += stat.size;
                cache.formats.xyz.zoomLevelStatus[tile.z].size += stat.size;
                progressCallback(cache, function(err, updatedCache) {
                  cache = updatedCache;
                  return tileDone(null, tile);
                });
            	});
            });
          });
        }
      },
      function(zoom, callback) {
        log.info('[Zoom Level Done]:\t %d for %s', zoom, cacheId.toString());
        cache.formats.xyz.zoomLevelStatus[zoom].complete = true;
        progressCallback(cache, function(err, updatedCache) {
          cache = updatedCache;
          callback();
        });
      },
      function(err, data) {
        log.info('%s: %s', 'Cache is complete'.bold.bgBlue.yellow, cacheId.toString());
        data.formats.xyz.complete = true;
        self.cache.cache = data;
        callback(null, self.cache);
      }
    );
  });
};

XYZ.prototype.getData = function(minZoom, maxZoom, callback) {
  log.info('%s: zoom levels %d through %d for cache %s', 'Zipping the cache'.bold.bgBlue.yellow, minZoom, maxZoom, this.cache.cache.id.toString());

  var cp = require('child_process');
  var args = ['-rq', '-'];
  for (var i = minZoom; i <= maxZoom; i++) {
    args.push('xyztiles/'+i);
  }
  var cacheId = this.cache.cache ? this.cache.cache.id.toString() : this.cache.id.toString();
  var zip = cp.spawn('zip', args, {cwd: path.join(this.config.outputDirectory, cacheId )}).on('close', function(code) {
    log.info('%s: for cache %s', 'Zip was created with code'.bold.bgBlue.yellow, cacheId, code);
  });
  callback(null, {stream: zip.stdout, extension: '.zip'});
};

function getTileForCache(cache, z, x, y, format, params, outputDirectory, callback) {
  var dir = path.join(outputDirectory, cache.cache.id.toString(), 'xyztiles', z.toString(), x.toString());
  var filename = y + '.png';

  if (fs.existsSync(path.join(dir, filename)) && (!params || !params.noCache)) {
    log.info('file already exists, skipping: %s', path.join(dir,filename));
    return callback(null, fs.createReadStream(path.join(dir, filename)));
  }
  // var map = cache.source.map;
  cache.getTile(format, z, x, y, params, function(err, stream) {
    log.debug('Got the stream for the tile %d %d %d for cache %s', z, x, y, cache.id);
    if (err) {
      return callback(err);
    }

    var ws = fs.createOutputStream(path.join(dir, filename));
    stream.pipe(ws);
    callback(null, stream);
  });
}

function getTileFromSource(source, z, x, y, format, callback) {
  var url = source.url + "/" + z + '/' + x + '/' + y + '.png';
  log.info('Get XYZ Tile:\t %s', url);
  var req = null;
  if (format === 'jpg' || format === 'jpeg') {
    tileImage.pngRequestToJpegStream(callback);
  } else {
    req = request.get({url: url,
      headers: {'Content-Type': 'image/png'},
    });
    callback(null, req);
  }
}

module.exports = XYZ;
