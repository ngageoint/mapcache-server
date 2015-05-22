var CacheModel = require('../../models/cache.js')
  , xyzCacheGenerator = require('../xyzCacheGenerator')
  , fs = require('fs-extra')
  , path = require('path')
  , archiver = require('archiver');

exports.getCacheData = function(cache, minZoom, maxZoom, callback) {
  var cacheDirectory = path.join(config.server.cacheDirectory.path, cache._id);

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

      archive.bulk([{ expand: true, cwd: path.join(config.server.cacheDirectory.path, cache._id), src: zoom}]);
      archive.append(JSON.stringify(cache), {name: cache._id+ ".json"});
      archive.finalize();
      callback(null, archive);
    } else {
      var child = require('child_process').fork('api/caches/creator.js');
      child.send({operation:'generateCache', cache: cache, format: 'xyz', minZoom: minZoom, maxZoom: maxZoom});
      callback(null, {creating: true});
    }
  });
}

function downloadTile(tileInfo, tileDone) {
  CacheModel.shouldContinueCaching(tileInfo.cache, function(err, continueCaching) {
    if (continueCaching) {
      downloader.download(tileInfo, tileDone);
    } else {
      tileDone();
    }
  });
}

exports.createCache = function(cache, minZoom, maxZoom, callback) {
  xyzCacheGenerator.createCache(cache, minZoom, maxZoom, downloadTile, callback);
}
