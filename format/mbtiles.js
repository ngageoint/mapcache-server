var log = require('mapcache-log')
  , fs = require('fs-extra')
  , xyzTileUtils = require('xyz-tile-utils')
  , turf = require('turf')
  , path = require('path')
  , request = require('request')
  , async = require('async')
  , cp = require('child_process')
  , GeoPackage = require('geopackage');

var MBTiles = function(config) {
  this.config = config || {};
  this.source = config.source;
  this.cache = config.cache;
  if (this.config.cache && !this.config.outputDirectory) {
    throw new Error('An output directory must be specified in config.outputDirectory');
  }
};

MBTiles.prototype.generateCache = function(doneCallback, progressCallback) {
  log.info('Generating cache with id %s', this.cache.cache.id);

  var cacheObj = this.cache;
  cacheObj.cache.formats = cacheObj.cache.formats || {};

  if (cacheObj.cache.formats.geopackage) {
    var gpdir = path.join(this.config.outputDirectory, cacheObj.cache.id, 'gpkg');
    var gpfilename = cacheObj.cache.id + '.gpkg';
    var gpfilepath = path.join(gpdir, gpfilename);

    var dir = path.join(this.config.outputDirectory, cacheObj.cache.id, 'mbtiles');
    var filename = cacheObj.cache.id;
    var mbtilesFilePath = path.join(dir, filename + '.mbtiles');
    var zipFilePath = path.join(dir, filename + '.zip');

    if (fs.existsSync(mbtilesFilePath)) {
      log.info('Cache %s already exists, returning', cacheObj.cache.id);
      var stats = fs.statSync(mbtilesFilePath);
      cacheObj.cache.formats.mbtiles = {
        complete: true,
        percentComplete: 100,
        size: stats.size
      };
      return doneCallback(null, cacheObj);
    } else if(fs.existsSync(zipFilePath)) {
      log.info('Cache %s already exists, returning', cacheObj.cache.id);
      var stats = fs.statSync(zipFilePath);
      cacheObj.cache.formats.mbtiles = {
        complete: true,
        percentComplete: 100,
        size: stats.size
      };
      return doneCallback(null, cacheObj);
    } else {
      cacheObj.cache.formats.mbtiles = {
        complete: false,
        percentComplete: 0
      };
      fs.emptyDirSync(dir);
      GeoPackage.openGeoPackage(gpfilepath, function(err, gp) {
        GeoPackage.MBTilesToGeoPackage.extract(gp, undefined, function(err, result, extras) {
          if (extras && extras.extension) {
            filename = filename + '.' + extras.extension;
          } else {
            filename = filename + '.mbtiles';
          }
          var filePath = path.join(dir, filename);
          fs.writeFile(filePath, result, function(err) {
            var stats = fs.statSync(filePath);
            cacheObj.cache.formats.mbtiles.complete = true;
            cacheObj.cache.formats.mbtiles.percentComplete = 100;
            cacheObj.cache.formats.mbtiles.size = stats.size;
            console.log('created the file, call the callback', doneCallback);
            doneCallback(err, cacheObj);
          });
        });
      });
    }
  } else {
    doneCallback(null, null);
  }
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
  console.log('extract dir', dir);
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


MBTiles.prototype.getData = function(minZoom, maxZoom, callback) {
  console.log('get the data');
  var mbtilesFilePath = path.join(this.config.outputDirectory, this.cache.cache.id.toString(), 'mbtiles', this.cache.cache.id.toString()+'.mbtiles');

  var zipFilePath = path.join(this.config.outputDirectory, this.cache.cache.id.toString(), 'mbtiles', this.cache.cache.id.toString()+'.zip');

  var filePath = mbtilesFilePath;
  var extension = '.mbtiles';

  if (fs.existsSync(mbtilesFilePath)) {
    console.log('mbtiles file exists');
    filePath = mbtilesFilePath;
    extension = '.mbtiles';
  } else if (fs.existsSync(zipFilePath)) {
    console.log('zip file exists');
    filePath = zipFilePath;
    extension = '.zip';
  } else {
    console.log('Cache does not exist, go make it');
    return this.generateCache(function(err, cache) {
      this.getData(minZoom, maxZoom, callback);
    }.bind(this));
  }

  console.log('sending back the file ' + filePath);
  callback(null, {
    stream: fs.createReadStream(filePath),
    extension: extension
  });
};

MBTiles.prototype.getDataWithin = function(west, south, east, north, projection, callback) {
  callback(null, null);
};

module.exports = MBTiles;
