var CacheModel = require('../../models/cache.js')
  , xyzTileWorker = require('../xyzTileWorker')
  , fs = require('fs-extra')
  , path = require('path')
  , source = require('../sources')
  , config = require('../../config.json')
  , archiver = require('archiver');

exports.getCacheData = function(cache, minZoom, maxZoom, callback) {
  var cacheDirectory = path.join(config.server.cacheDirectory.path, cache._id.toString());

  fs.stat(cacheDirectory, function(err, status) {
    if (status && status.isDirectory()) {
      var archive = archiver('zip');
      archive.on('error', function(err) {
        return callback(err);
      });

      var zoom = [];
      if (maxZoom && minZoom){
        for(i = 0; i < maxZoom-minZoom+1; i++) {
          zoom[i] = minZoom + i + '/**';
        }
      } else if (!maxZoom && minZoom) {
        for(i = 0; i < 17 ; i++) {
          zoom[i] = minZoom + i + '/**';
        }
      } else if (!minZoom && maxZoom) {
        for(i = 0; i < maxZoom + 1 ; i++) {
          zoom[i] = i + '/**';
        }
      } else {
        zoom = ['**'];
      }

      archive.bulk([{ expand: true, cwd: path.join(config.server.cacheDirectory.path, cache._id.toString()), src: zoom}]);
      archive.append(JSON.stringify(cache), {name: cache._id+ ".json"});
      archive.finalize();
      callback(null, {stream: archive, extension: '.zip'});
    } else {
      var child = require('child_process').fork('api/caches/creator.js');
      child.send({operation:'generateCache', cache: cache, format: 'xyz', minZoom: minZoom, maxZoom: maxZoom});
      callback(null, {creating: true});
    }
  });
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
  if (format != 'png') return callback(null, null);

  if (!fs.existsSync(config.server.cacheDirectory.path + '/' + cache._id + "/" + z + "/" + x + "/" + y + ".png")) {
    return callback(null, null);
  } else {
    return callback(null, fs.createReadStream(config.server.cacheDirectory.path + '/' + cache._id + "/" + z + "/" + x + "/" + y + ".png"));
  }
}

function downloadTile(tileInfo, tileDone) {
  var dir = createDir(tileInfo.xyzSource._id, tileInfo.z + '/' + tileInfo.x + '/');
  var filename = tileInfo.y + '.png';

  if (fs.existsSync(dir + filename)) {
    return tileDone();
  }

  CacheModel.shouldContinueCaching(tileInfo.xyzSource, function(err, continueCaching) {
    if (!continueCaching) {
      return tileDone();
    }

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
  });
}

exports.generateCache = function(cache, minZoom, maxZoom, callback) {
  xyzTileWorker.createXYZTiles(cache, minZoom, maxZoom, downloadTile, function(cache, continueCallback) {
    CacheModel.shouldContinueCaching(cache, continueCallback);
  }, function(cache, zoom, zoomDoneCallback) {
    CacheModel.updateZoomLevelStatus(cache, zoom, function(err) {
      zoomDoneCallback();
    });
  }, function(err, cache) {
    CacheModel.getCacheById(cache.id, function(err, foundCache) {
      CacheModel.updateFormatCreated(foundCache, ['xyz', 'tms'], foundCache.totalTileSize, function(err, cache) {
        cache.status.complete = true;
        cache.save(function() {
          callback(null, cache);
        });
      });
    });
  });
}
