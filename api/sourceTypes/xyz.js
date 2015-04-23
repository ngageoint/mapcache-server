var CacheModel = require('../../models/cache')
  , async = require('async')
  , turf = require('turf')
  , tileUtilities = require('../tileUtilities')
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
  console.log("xyz");
  source.status = "Complete";
  source.complete = true;
  source.save();
  callback(null, source);
}

exports.getTile = function(source, z, x, y, callback) {
  console.log('get tile ' + z + '/' + x + '/' + y + '.png for source ' + source.name);
  callback();
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
          var q = async.queue(function (task, tileDone) {
            console.log("go get the tile", task);
              downloader.download(task, tileDone);
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
