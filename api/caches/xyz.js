var CacheModel = require('../../models/cache.js')
  , fs = require('fs-extra')
  , path = require('path')
  , archiver = require('archiver');

exports.getCacheData = function(cache, minZoom, maxZoom, callback) {
  var archive = archiver('zip');
  archive.on('error', function(err){
    throw err;});

  var zoom = [];
  if (maxZoom && minZoom){
    for(i = 0; i < maxZoom-minZoom+1; i++) {
      zoom[i] = minZoom + i + '/**';
    }
  } else if (!maxZoom && minZoom) {
    for(i = 0; i < 17 ; i++) {
      zoom[i] = minZoom + i + '/**';
    }
  } else if (!minZoom && maxZoom){
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
}
