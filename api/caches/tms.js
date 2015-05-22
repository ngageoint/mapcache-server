var CacheModel = require('../../models/cache.js')
  , fs = require('fs-extra')
  , path = require('path')
  , archiver = require('archiver');

function convert2tms(min, max){
  for (i = min; i < max + 1; i++) {
     var x = fs.readdirSync(config.server.cacheDirectory.path + "/" + cache._id + '/' + i + '/');
     if (x[0] == '.DS_Store') {
       x.splice(0,1);
     }

    for (k = 0; k < x.length; k++){
      var y = fs.readdirSync(config.server.cacheDirectory.path + "/" + cache._id + '/' + i + '/' + x[k] + '/');
      if (y[0] == '.DS_Store') {
         y.splice(0,1);
       }

      for (j = 0 ; j < y.length; j++) {
        ytemp = y[j].replace('.png','');
        ytms = Math.pow(2,i) - ytemp -1;
        archive.file(config.server.cacheDirectory.path + "/" + cache._id + '/' + i + '/'+ x[k] + '/' + ytemp + '.png', {name: i + '/' +x[k] + '/' + ytms + '.png'});
      }
    }
  }
}

exports.getCacheData = function(cache, minZoom, maxZoom, callback) {
  var archive = archiver('zip');

  archive.on('error', callback);

  if (maxZoom && minZoom) {
    convert2tms(minZoom, maxZoom);
  } else if (!maxZoom && minZoom) {
    zoom = fs.readdirSync(config.server.cacheDirectory.path + "/" + cache._id + '/');
    convert2tms(minZoom, zoom[zoom.length - 1] - 1);
  } else if (!minZoom && maxZoom) {
    zoom = fs.readdirSync(config.server.cacheDirectory.path + "/" + cache._id + '/');
    convert2tms(zoom[1], maxZoom);
  } else {
    zoom = fs.readdirSync(config.server.cacheDirectory.path + "/" + cache._id + '/');
    convert2tms(zoom[1] , zoom[zoom.length - 1] - 1);
  }

  archive.append(JSON.stringify(cache), {name: cache._id+ ".json"});
  archive.finalize();
  callback(null, archive);
}
