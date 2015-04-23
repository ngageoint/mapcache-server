var CacheModel = require('../../models/cache')
  , async = require('async')
  , turf = require('turf')
  , exec = require('child_process').exec
  , tileUtilities = require('../tileUtilities')
  , config = require('../../config.json')
  , fs = require('fs-extra')
  , downloader = require('../tileDownloader');

function pushNextTileTasks(q, cache, zoom, x, yRange, numberOfTasks) {
  if (yRange.current > yRange.max) return false;
  for (var i = yRange.current; i <= yRange.current + numberOfTasks && i <= yRange.max; i++) {
    q.push({z:zoom, x: x, y: i, cache: cache});
  }
  yRange.current = yRange.current + numberOfTasks;
  return true;
}

exports.process = function(source, callback) {
  console.log("mbtiles");

  console.log('running ' + 'mb-util ' + source.filePath + " .");
  source.status = "Extracting MBTiles";
  source.save();
  callback(null, source);
  var python = exec(
    'mb-util ' + source.filePath + " " + config.server.sourceDirectory.path + "/" + source._id + "/tiles",
   function(error, stdout, stderr) {
     source.status = "Complete";
     source.complete = true;
     source.save();
     console.log('done running ' +   'mb-util ' + source.filePath + " " + config.server.sourceDirectory.path + "/" + source._id + "/tiles");
   });
}

exports.getTile = function(source, z, x, y, callback) {
  console.log('get tile ' + z + '/' + x + '/' + y + '.png for source ' + source.name);

  var tile = config.server.sourceDirectory.path + "/" + source._id + "/tiles/" + z + '/' + x + '/' + y + '.png';

  if (fs.existsSync(tile)) {
    var stream = fs.createReadStream(tile);
    callback(null, stream);
  } else {
    callback();
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

exports.createCache = function(cache) {
  var zoom = cache.minZoom;
  var extent = turf.extent(cache.geometry);

  async.whilst(
    function () {
      return zoom <= cache.maxZoom;
    },
    function (zoomLevelDone) {
      var yRange = tileUtilities.yCalculator(extent, zoom);
      var xRange = tileUtilities.xCalculator(extent, zoom);

      var currentx = xRange.min;

      async.whilst(
        function () {
          console.log('current x ' + currentx + ' xrange max ' + xRange.max);
          return currentx <= xRange.max;
        },
        function(xRowDone) {
          var q = async.queue(function (tileInfo, tileDone) {
            console.log("go get the tile", tileInfo);
            var sourceTile = config.server.sourceDirectory.path + "/" + cache.source._id + "/tiles/" + tileInfo.z + "/" + tileInfo.x + "/" + tileInfo.y + ".png";
            var destTile = createDir(cache._id, tileInfo.z + "/" + tileInfo.x) + "/" + tileInfo.y + ".png";
            console.log("copy tile " + sourceTile + " to " + destTile);
            fs.copy(sourceTile, destTile, function(err) {
              CacheModel.updateTileDownloaded(tileInfo.cache, tileInfo.z, tileInfo.x, tileInfo.y, tileDone);
            });
          }, 10);

          q.drain = function() {
            // now go get the next 10 ys and keep going
            var tasksPushed = pushNextTileTasks(q, cache, zoom, currentx, yRange, 10);
            // if there are no more ys do the callback
            console.log("q drained");
            if (!tasksPushed) {
              console.log("x row " + currentx + " is done");
              currentx++;
              yRange.current = yRange.min;
              xRowDone();
            }
          }

          pushNextTileTasks(q, cache, zoom, currentx, yRange, 10);

        },
        function (err) {
          console.log("go update the zoom level status");
          CacheModel.updateZoomLevelStatus(cache, zoom, true, function(err) {
            zoom++;
            zoomLevelDone();
          });
        }
      );
    },
    function (err) {
        console.log("done with all the zoom levels");
        cache.status.complete = true;
        cache.save();
    }
  );
}
