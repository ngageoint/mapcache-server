var CacheModel = require('../../models/cache.js')
  , xyzTileWorker = require('../xyzTileWorker')
  , fs = require('fs-extra')
  , path = require('path')
  , source = require('../sources')
  , config = require('../../config.js')
  , tileUtilities = require('../tileUtilities.js')
  , Readable = require('stream').Readable;

exports.getCacheData = function(cache, minZoom, maxZoom, callback) {
    var cp = require('child_process');
    var args = ['-rq', '-', 'xyztiles'];
    console.log('stream the zip back');
    var zip = cp.spawn('zip', args, {cwd: path.join(config.server.cacheDirectory.path, cache._id.toString())}).on('close', function(code) {
      console.log('close the zip');
    });

    callback(null, {stream: zip.stdout, extension: '.zip'});
}

function createDir(cacheName, filepath){
	if (!fs.existsSync(config.server.cacheDirectory.path + '/' + cacheName +'/'+ filepath)) {
    fs.mkdirsSync(config.server.cacheDirectory.path + '/' + cacheName +'/'+ filepath, function(err){
       if (err) console.log(err);
     });
	}
  return config.server.cacheDirectory.path + '/' + cacheName +'/'+ filepath;
}

exports.getTile = function(cache, format, z, x, y, callback) {

  var cacheDirectory = path.join(config.server.cacheDirectory.path, cache._id.toString());
  if (fs.existsSync(cacheDirectory + '/xyztiles/'+z+'/'+x+'/'+y+'.'+format)) {
    var stream = fs.createReadStream(cacheDirectory + '/xyztiles/'+z+'/'+x+'/'+y+'.'+format);
    return callback(null, stream);
  }
  return callback(null, null);
}

function downloadTile(tileInfo, tileDone) {
  var dir = createDir(tileInfo.xyzSource._id, 'xyztiles/' + tileInfo.z + '/' + tileInfo.x + '/');
  var filename = tileInfo.y + '.png';

  if (fs.existsSync(dir + filename)) {
    console.log('file already exists, skipping: %s', dir+filename);
    return tileDone();
  }

  CacheModel.shouldContinueCaching(tileInfo.xyzSource, function(err, continueCaching) {
    if (!continueCaching) {
      return tileDone();
    }

    console.log('source is a vector? ', tileInfo.xyzSource.source.vector);
    if (tileInfo.xyzSource.source.vector) {
      tileUtilities.getVectorTile(tileInfo.xyzSource, 'png', tileInfo.z, tileInfo.x, tileInfo.y, tileInfo.xyzSource.cacheCreationParams, function(err, request) {
        if (request) {
          var stream = fs.createWriteStream(dir + filename);
      		stream.on('close',function(status){
            CacheModel.updateTileDownloaded(tileInfo.xyzSource, tileInfo.z, tileInfo.x, tileInfo.y, function(err) {
              tileDone();
            });
      		});

    			request.pipe(stream);
        } else {
          tileDone();
        }
  		});
    } else {
      source.getTile(tileInfo.xyzSource.source, 'png', tileInfo.z, tileInfo.x, tileInfo.y, tileInfo.xyzSource.cacheCreationParams, function(err, request) {
        if (request) {
          var stream = fs.createWriteStream(dir + filename);
      		stream.on('close',function(status){
            CacheModel.updateTileDownloaded(tileInfo.xyzSource, tileInfo.z, tileInfo.x, tileInfo.y, function(err) {
              tileDone();
            });
      		});

    			request.pipe(stream);
        } else {
          tileDone();
        }
  		});
    }
  });
}

exports.generateCache = function(cache, minZoom, maxZoom, callback) {
  CacheModel.getCacheById(cache.id, function(err, cache) {
    if (!cache.source.vector || (cache.formats && cache.formats.geojson && !cache.formats.geojson.generating)) {
      console.log('xyz generating');
      xyzTileWorker.createXYZTiles(cache, minZoom, maxZoom, downloadTile, function(cache, continueCallback) {
        CacheModel.shouldContinueCaching(cache, continueCallback);
      }, function(cache, zoom, zoomDoneCallback) {
        CacheModel.updateZoomLevelStatus(cache, zoom, function(err) {
          zoomDoneCallback();
        });
      }, function(err, cache) {
        CacheModel.getCacheById(cache.id, function(err, foundCache) {
          CacheModel.updateFormatCreated(foundCache, 'xyz', foundCache.totalTileSize, function(err, cache) {
            cache.status.complete = true;
            cache.save(function() {
              callback(null, cache);
            });
          });
        });
      });
    } else {
      console.log('geojson cache is not done generating, waiting 30 seconds to generate tms...');
      setTimeout(exports.generateCache, 30000, cache, minZoom, maxZoom, callback);
    }
  });
}

exports.restart = function(cache, callback) {
  exports.generateCache(cache, cache.minZoom, cache.maxZoom, callback);
}

exports.generateMoreZooms = function(cache, newMinZoom, newMaxZoom, callback) {
  exports.generateCache(cache, cache.minZoom, cache.maxZoom, callback);
}

exports.deleteCache = function(cache, callback) {
  fs.remove(config.server.cacheDirectory.path + "/" + cache._id + "/xyztiles", function(err) {
    callback(err, cache);
  });
}
