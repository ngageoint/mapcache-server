var tileImage = require('tile-image')
  , Canvas = require('canvas')
  , log = require('mapcache-log')
  , Image = Canvas.Image
  , fs = require('fs-extra')
  , xyzTileUtils = require('xyz-tile-utils')
  , turf = require('turf')
  , path = require('path')
  , request = require('request')
  , async = require('async');

var TMS = function(config) {
  this.config = config || {};
  this.source = config.source;
  this.cache = config.cache;
};

TMS.prototype.initialize = function() {
};

TMS.prototype.processSource = function(doneCallback) {
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
  };
  doneCallback(null, this.source);
};

TMS.prototype.delete = function(callback) {
  if (!this.cache) return callback();
  fs.remove(path.join(this.config.outputDirectory, 'xyztiles'), callback);
};

TMS.prototype.generateCache = function(callback, progressCallback) {
  log.info('Generating cache with id %s', this.cache.cache.id);
  var self = this;
  callback = callback || function() {};
  progressCallback = progressCallback || function(cache, callback) {
    callback(null, cache);
  };
  var cache = this.cache.cache;
  var cacheId = this.cache.cache.id;
  cache.formats = cache.formats || {};
  cache.formats.tms = cache.formats.tms || {
    generatedTiles: 0,
    complete: false,
    size: 0,
    percentComplete: 0
  };

  cache.formats.tms.totalTiles = xyzTileUtils.tileCountInExtent(turf.extent(cache.geometry), cache.minZoom, cache.maxZoom);

  console.log('cache.status', cache.formats.tms);

  cache.formats.tms.zoomLevelStatus = [];
  for (var i = cache.minZoom; i <= cache.maxZoom; i++) {
    cache.formats.tms.zoomLevelStatus[i] = {
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
        // put the tiles into the xyztiles directory because all we will do is create a link to the tms tile directory
        var dir = path.join(self.config.outputDirectory, cacheId.toString(), 'xyztiles', tile.z.toString(), tile.x.toString());
        var filename = tile.y + '.png';

        log.debug('tile %d %d %d will be written to %s', tile.z, tile.x, tile.y, path.join(dir, filename));

        if (fs.existsSync(path.join(dir, filename)) && (!cache.cacheCreationParams || (cache.cacheCreationParams && !cache.cacheCreationParams.noCache))) {
          log.debug('file already exists, skipping: %s', path.join(dir, filename));
          cache.formats.tms.zoomLevelStatus[tile.z].generatedTiles++;
          cache.formats.tms.zoomLevelStatus[tile.z].percentComplete = 100 * cache.formats.tms.zoomLevelStatus[tile.z].generatedTiles / cache.formats.tms.zoomLevelStatus[tile.z].totalTiles;
          cache.formats.tms.generatedTiles++;
          cache.formats.tms.percentComplete = 100 * cache.formats.tms.generatedTiles/cache.formats.tms.totalTiles;

          fs.stat(path.join(dir, filename), function(err, stat) {
            cache.formats.tms.size += stat.size;
            cache.formats.tms.zoomLevelStatus[tile.z].size += stat.size;
            var fileLink = path.join(self.config.outputDirectory, cacheId.toString(), 'tmstiles', tile.z.toString(), tile.x.toString(), (Math.pow(2,tile.z) - tile.y -1) + '.png');
            log.debug('Linking %s to %s', path.join(dir, filename), fileLink);
            fs.ensureSymlinkSync(path.join(dir, filename), fileLink);

            progressCallback(cache, function(err, updatedCache) {
              cache = updatedCache;
              return tileDone(null, tile);
            });
        	});
        } else {
          log.info('the file %s does not exist for the tms cache %s, creating', path.join(dir, filename), cacheId);
          self.cache.getTile('png', tile.z, tile.x, tile.y, cache.cacheCreationParams, function(err, stream) {
            log.info('pulled the tile', stream);
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
              log.info('the file %s was written for the tms cache %s', path.join(dir, filename), cacheId);
              cache.formats.tms.zoomLevelStatus[tile.z].generatedTiles++;
              cache.formats.tms.zoomLevelStatus[tile.z].percentComplete = 100 *  cache.formats.tms.zoomLevelStatus[tile.z].generatedTiles / cache.formats.tms.zoomLevelStatus[tile.z].totalTiles;
              cache.formats.tms.generatedTiles++;
              cache.formats.tms.percentComplete = 100 * cache.formats.tms.generatedTiles/cache.formats.tms.totalTiles;

              fs.stat(path.join(dir, filename), function(err, stat) {
                cache.formats.tms.size += stat.size;
                cache.formats.tms.zoomLevelStatus[tile.z].size += stat.size;
                var fileLink = path.join(self.config.outputDirectory, cacheId.toString(), 'tmstiles', tile.z.toString(), tile.x.toString(), (Math.pow(2,tile.z) - tile.y -1) + '.png');
                log.debug('Linking %s to %s', path.join(dir, filename), fileLink);
                fs.ensureSymlinkSync(path.join(dir, filename), fileLink);
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
        log.info('zoom level %d is done for %s', zoom, cacheId);
        cache.formats.tms.zoomLevelStatus[zoom].complete = true;
        progressCallback(cache, function(err, updatedCache) {
          cache = updatedCache;
          callback();
        });
      },
      function(err, data) {
        log.info('all tiles are done for %s', cacheId);
        data.formats.tms.complete = true;
        self.cache.cache = data;
        callback(null, self.cache);
      }
    );
  });
};

TMS.prototype.getData = function(minZoom, maxZoom, callback) {
  var cp = require('child_process');
  var args = ['-rq', '-'];
  console.log('minzoom', minZoom);
  console.log('maxzoom', maxZoom);
  for (var i = minZoom; i <= maxZoom; i++) {
    args.push('tmstiles/'+i);
  }

  console.log('working dir',path.join(this.config.outputDirectory, this.cache.cache.id.toString() ));
  var zip = cp.spawn('zip', args, {cwd: path.join(this.config.outputDirectory, this.cache.cache.id.toString())}).on('close', function(code) {
    console.log('close the zip with code', code);
  });
  callback(null, {stream: zip.stdout, extension: '.zip'});
};

TMS.prototype.getDataWithin = function(west, south, east, north, projection, callback) {
  callback(null, null);
};

TMS.prototype.getTile = function(format, z, x, y, params, callback) {
  format = format.toLowerCase();
  if (format !== 'png' && format !== 'jpeg') return callback(null, null);
  if (this.source) {
    getTileFromSource(this.source, z, x, y, format, callback);
  } else if (this.cache) {
    var map = this.cache.source;
    var sorted = map.dataSources.sort(zOrderDatasources);
    params = params || {};
    if (!params.dataSources || params.dataSources.length === 0) {
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
      if (params.dataSources.indexOf(s.id) === -1) return callback();
      console.log('constructing the data source format %s', s.format);
      var DataSource = require('./' + s.format);
      var dataSource = new DataSource({source: s});
      dataSource.getTile(format, z, x, y, params, function(err, tileStream) {
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
      console.log('done getting tile for cache');
      callback(null, canvas.pngStream());
    });
  }
};

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

function getTileFromSource(source, z, x, y, format, callback) {
  console.log('get tile %d/%d/%d.%s for source %s', z, x, y, format, source.name);
  var url = source.url + "/" + z + '/' + x + '/' + y + '.png';
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

module.exports = TMS;
