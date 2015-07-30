var CacheModel = require('../../models/cache.js')
  , xyzTileWorker = require('../xyzTileWorker')
  , fs = require('fs-extra')
  , path = require('path')
  , config = require('../../config.json');

function xyzToTms(z, y, x) {
  return {
    z: z,
    x: x,
    y: Math.pow(2, z) - y - 1
  }
}

exports.getCacheData = function(cache, minZoom, maxZoom, callback) {
  if (cache.formats['tms'] && !cache.formats['tms'].generating) {
    var cp = require('child_process');
    var args = ['-rq', '-', 'tmstiles'];
    console.log('stream the zip back');
    var zip = cp.spawn('zip', args, {cwd: path.join(config.server.cacheDirectory.path, cache._id.toString())}).on('close', function(code) {
      console.log('close the zip');
    });

    callback(null, {stream: zip.stdout, extension: '.zip'});
  } else if (!cache.formats['tms']) {
    var child = require('child_process').fork('api/caches/creator.js');
    child.send({operation:'generateCache', cache: cache, format: 'tms', minZoom: minZoom, maxZoom: maxZoom});
    callback(null, {creating: true});
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

function downloadTile(tileInfo, tileDone) {

  var dir = createDir(tileInfo.xyzSource._id, 'tmstiles/' + tileInfo.z + '/' + tileInfo.x + '/');
  var filename = (Math.pow(2,tileInfo.z) - tileInfo.y -1) + '.png';

  if (fs.existsSync(dir + filename)) {
    return tileDone();
  }

  fs.symlinkSync(config.server.cacheDirectory.path + '/' + tileInfo.xyzSource._id +'/xyztiles/'+tileInfo.z +'/'+tileInfo.x+'/'+tileInfo.y+'.png',
    dir+filename);

  return tileDone();
}

exports.generateCache = function(cache, minZoom, maxZoom, callback) {
  CacheModel.getCacheById(cache.id, function(err, cache) {
    // ensure there is already an xyz cache generated
    if (cache.formats && cache.formats.xyz && !cache.formats.xyz.generating) {

      xyzTileWorker.createXYZTiles(cache, minZoom, maxZoom, downloadTile, function(cache, continueCallback) {
        CacheModel.shouldContinueCaching(cache, continueCallback);
      }, function(cache, zoom, zoomDoneCallback) {
        CacheModel.updateZoomLevelStatus(cache, zoom, function(err) {
          zoomDoneCallback();
        });
      }, function(err, cache) {
        CacheModel.getCacheById(cache.id, function(err, foundCache) {
          CacheModel.updateFormatCreated(foundCache, 'tms', foundCache.totalTileSize, function(err, cache) {
            cache.status.complete = true;
            cache.save(function() {
              callback(null, cache);
            });
          });
        });
      });
    } else {
      console.log('XYZ cache is not done generating, waiting 30 seconds to generate tms...');
      setTimeout(exports.generateCache, 30000, cache, minZoom, maxZoom, callback);
    }
  });
}

exports.deleteCache = function(cache, callback) {
  fs.remove(config.server.cacheDirectory.path + "/" + cache._id + "/tmstiles", function(err) {
    callback(err, cache);
  });
}
