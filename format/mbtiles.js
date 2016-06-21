var log = require('mapcache-log')
  , fs = require('fs-extra')
  , xyzTileUtils = require('xyz-tile-utils')
  , turf = require('turf')
  , path = require('path')
  , request = require('request')
  , async = require('async')
  , cp = require('child_process');

var MBTiles = function(config) {
  this.config = config || {};
  this.source = config.source;
  this.cache = config.cache;
};

MBTiles.prototype.initialize = function() {
};

MBTiles.prototype.processSource = function(doneCallback, progressCallback) {
  this.source.status = this.source.status || {};
  this.extractDirectory = path.join(path.dirname(this.source.file.path), 'mbtiles');
  if (this.source.status.complete) {
    return doneCallback(null, this.source);
  }
  async.series([
    this.extractMBTiles.bind(this),
    this.processMetadataFile.bind(this)
  ], function(err, results) {
    this.source.status.message = "Complete";
    this.source.status.complete = true;
    console.log('done with the source', this.source);
    progressCallback(this.source, function(err, updatedSource) {
      doneCallback(err, updatedSource);
    })
  }.bind(this));
};

MBTiles.prototype.extractMBTiles = function(callback) {
  var dir = this.extractDirectory;
  var args = [this.source.file.path, dir];
  var command = path.join('..', 'utilities', 'mbutil', 'mb-util')
  var mbUtil = cp.spawn(command, args, {cwd: __dirname}).on('close', function(code) {
    console.log('mbUtil executed with code ' + code);
    callback(null, dir);
  });
  // not sure why I have to listen to these to process the entire file....
  mbUtil.stdout.on('data', function(data) {
    console.log('mbutil stdout: ' + data);
  });
  mbUtil.stderr.on('data', function(data) {
    console.log('mbutil stderr: ' + data);
  });
}

MBTiles.prototype.processMetadataFile = function(callback) {
  var dir = this.extractDirectory;
  var source = this.source;
  fs.readJson(path.join(dir, 'metadata.json'), function(err, json) {
    var bbox = [];
    if (json.bounds) {
      var split = json.bounds.split(',');
      for (var i = 0; i < split.length; i++) {
        bbox.push(parseFloat(split[i]));
      }
      source.geometry = turf.bboxPolygon(bbox);
    }
    if (json.minzoom || json.maxZoomLevel) {
      source.minZoom = parseInt(json.minzoom || json.maxZoomLevel);
    }
    if (json.maxzoom || json.minZoomLevel) {
      source.maxZoom = parseInt(json.maxzoom || json.minZoomLevel);
    }
    callback(null);
  });
}

MBTiles.prototype.delete = function(callback) {
  if (!this.cache) return callback();
  var dir = path.join(this.config.outputDirectory, this.cache.cache.id, 'mbtiles');
  var filename = this.cache.cache.id + '.mbtiles';
  fs.remove(path.join(dir, filename), callback);
}

MBTiles.prototype.getTile = function(format, z, x, y, params, callback) {
  format = format.toLowerCase();
  if (format !== 'png' && format !== 'jpeg') return callback(null, null);
  if (this.source) {
    this._getTileFromSource(this.source, z, x, y, format, callback);
  } else if (this.cache) {
    this._getTileForCache(this.cache, z, x, y, params, this.config.outputDirectory, callback);
  }
};

MBTiles.prototype._getTileForCache = function(cache, z, x, y, format, params, outputDirectory, callback) {
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
};

MBTiles.prototype._getTileFromSource = function(source, z, x, y, format, callback) {
  if (z < source.minZoom || z > source.maxZoom) return callback(null, null);
  console.log('get tile %d/%d/%d.%s for source %s', z, x, y, format, source.name);
  var file = path.join(this.extractDirectory, z.toString(), x.toString(), y+'.png');
  if (fs.existsSync(file)) {
    return callback(null, fs.createReadStream(file));
  }
  return callback();
};

MBTiles.prototype.generateCache = function(callback, progressCallback) {
  log.info('Generating cache with id %s', this.cache.cache.id);
  var self = this;
  callback = callback || function() {};
  progressCallback = progressCallback || function(cache, callback) {
    callback(null, cache);
  };
  var cache = this.cache.cache;
  var cacheId = this.cache.cache.id;
  cache.formats = cache.formats || {};
  cache.formats.mbtiles = cache.formats.mbtiles || {
    generatedTiles: 0,
    complete: false,
    size: 0,
    percentComplete: 0
  };

  var tiles = xyzTileUtils.tilesInFeatureCollection(cache.geometry, cache.minZoom, cache.maxZoom);
  var totalTiles = 0;
  cache.formats.mbtiles.zoomLevelStatus = [];
  for (var i = cache.minZoom; i <= cache.maxZoom; i++) {
    var zoomTiles = Object.keys(tiles[i]).length;
    totalTiles += zoomTiles;
    cache.formats.mbtiles.zoomLevelStatus[i] = {
      generatedTiles: 0,
      totalTiles: zoomTiles,
      complete: false,
      percentComplete: 0,
      size: 0
    };
  }

  cache.formats.mbtiles.totalTiles = totalTiles;
  progressCallback(cache, function(err, updatedCache) {
    cache = updatedCache;
    xyzTileUtils.iterateTiles(tiles, cache.minZoom, cache.maxZoom, cache, function processTile(tile, tileDone) {
      // put the tiles into the xyztiles directory because we will then use mbutil to create an mbtiles file from that directory
      var dir = path.join(self.config.outputDirectory, cacheId.toString(), 'xyztiles', tile.z.toString(), tile.x.toString());
      var filename = tile.y + '.png';

      log.debug('tile %d %d %d will be written to %s', tile.z, tile.x, tile.y, path.join(dir, filename));

      if (fs.existsSync(path.join(dir, filename)) && (!cache.cacheCreationParams || (cache.cacheCreationParams && !cache.cacheCreationParams.noCache))) {
        log.debug('file already exists, skipping: %s', path.join(dir, filename));
        cache.formats.mbtiles.zoomLevelStatus[tile.z].generatedTiles++;
        cache.formats.mbtiles.zoomLevelStatus[tile.z].percentComplete = 100 * cache.formats.mbtiles.zoomLevelStatus[tile.z].generatedTiles / cache.formats.mbtiles.zoomLevelStatus[tile.z].totalTiles;
        cache.formats.mbtiles.generatedTiles++;
        cache.formats.mbtiles.percentComplete = 100 * cache.formats.mbtiles.generatedTiles/cache.formats.mbtiles.totalTiles;
        progressCallback(cache, function(err, updatedCache) {
          cache = updatedCache;
          return tileDone(null, tile);
        });
      } else {
        log.info('the file %s does not exist for the mbtiles cache %s, creating', path.join(dir, filename), cacheId);
        self.cache.getTile('png', tile.z, tile.x, tile.y, cache.cacheCreationParams, function(err, stream) {
          if (err) {
            log.error(err);
            return tileDone(null, null);
          } else if (!stream) {
            log.error('There was no tile for ' + path.join(dir, filename));
            return tileDone(null, null);
          }
          var ws = fs.createOutputStream(path.join(dir, filename));
          stream.pipe(ws);
          ws.on('close', function(){
            log.info('the file %s was written for the mbtiles cache %s', path.join(dir, filename), cacheId);
            cache.formats.mbtiles.zoomLevelStatus[tile.z].generatedTiles++;
            cache.formats.mbtiles.zoomLevelStatus[tile.z].percentComplete = 100 *  cache.formats.mbtiles.zoomLevelStatus[tile.z].generatedTiles / cache.formats.mbtiles.zoomLevelStatus[tile.z].totalTiles;
            cache.formats.mbtiles.generatedTiles++;
            cache.formats.mbtiles.percentComplete = 100 * cache.formats.mbtiles.generatedTiles/cache.formats.mbtiles.totalTiles;
            progressCallback(cache, function(err, updatedCache) {
              cache = updatedCache;
              return tileDone(null, tile);
            });
          });
        });
      }
    }, function zoomCallback(zoom, callback) {
      log.info('zoom level %d is done for %s', zoom, cacheId);
      cache.formats.mbtiles.zoomLevelStatus[zoom].complete = true;
      progressCallback(cache, function(err, updatedCache) {
        cache = updatedCache;
        callback();
      });
    }, function done(err, data) {
      log.info('all tiles are done for %s', cacheId);
      self._createMetadataFile();
      self.createMBTilesFile(function(err, file) {
        data.formats.mbtiles.complete = true;
        var stats = fs.statSync(file);
        data.formats.mbtiles.size = stats.size;
        self.cache.cache = data;
        callback(null, self.cache);
      });
    });
  });
};

MBTiles.prototype._createMetadataFile = function() {
  var metadataFile = path.join(this.config.outputDirectory, this.cache.cache.id.toString(), 'xyztiles', 'metadata.json');
  fs.outputJsonSync(metadataFile, {
    "name": this.cache.cache.name,
    "minzoom": this.cache.cache.minZoom+'',
    "maxzoom": this.cache.cache.maxZoom+'',
    "bounds": turf.bbox(this.cache.cache.geometry).join(',')
  });
}

MBTiles.prototype.createMBTilesFile = function(callback) {
  var dir = path.join(this.config.outputDirectory, this.cache.cache.id.toString(), 'xyztiles');
  var mbtilesFile = path.join(this.config.outputDirectory, this.cache.cache.id.toString(), this.cache.cache.id.toString()+'.mbtiles');
  var args = [dir, mbtilesFile];
  var command = path.join('..', 'utilities', 'mbutil', 'mb-util')
  var mbUtil = cp.spawn(command, args, {cwd: __dirname}).on('close', function(code) {
    callback(null, mbtilesFile);
  });
  // not sure why I have to listen to these to process the entire file....
  mbUtil.stdout.on('data', function(data) {
    console.log('mbutil stdout: ' + data);
  });
  mbUtil.stderr.on('data', function(data) {
    console.log('mbutil stderr: ' + data);
  });
}

MBTiles.prototype.getData = function(minZoom, maxZoom, callback) {
  var mbtilesFile = path.join(this.config.outputDirectory, this.cache.cache.id.toString(), this.cache.cache.id.toString()+'.mbtiles');
  callback(null, {
    stream: fs.createReadStream(path.join(this.config.outputDirectory, this.cache.cache.id.toString(), this.cache.cache.id.toString()+'.mbtiles')),
    extension: '.mbtiles'
  });
};

MBTiles.prototype.getDataWithin = function(west, south, east, north, projection, callback) {
  callback(null, null);
};

module.exports = MBTiles;
