var turf = require('turf')
  , async = require('async')
  , tileUtilities = require('./tileUtilities')
  , CacheModel = require('../models/cache')
  , config = require('../config.json');

function pushNextTileTasks(q, cache, zoom, x, yRange, numberOfTasks) {
  if (yRange.current > yRange.max) return false;
  for (var i = yRange.current; i <= yRange.current + numberOfTasks && i <= yRange.max; i++) {
    q.push({z:zoom, x: x, y: i, cache: cache});
  }
  yRange.current = yRange.current + numberOfTasks;
  return true;
}

function getXRow(cache, xRow, yRange, zoom, xRowDone, downloadTile) {
  var q = async.queue(downloadTile, 10);

  q.drain = function() {
    CacheModel.shouldContinueCaching(cache, function(err, continueCaching) {
      if (continueCaching) {

        // now go get the next 10 ys and keep going
        var tasksPushed = pushNextTileTasks(q, cache, zoom, xRow, yRange, 10);
        // if there are no more ys do the callback
        if (!tasksPushed) {
          console.log("Complete z: " + zoom + " x: " + xRow);
          yRange.current = yRange.min;
          xRowDone();
        }
      } else {
        yRange.current = yRange.min;
        xRowDone(true);
      }
    });
  };

  CacheModel.shouldContinueCaching(cache, function(err, continueCaching) {
    if (continueCaching) {
      console.log("Continuing to cache row " + xRow);
      pushNextTileTasks(q, cache, zoom, xRow, yRange, 10);
    } else {
      xRowDone(true);
    }
  });
}

exports.createCache = function(cache, minZoom, maxZoom, downloadTile, callback) {
  CacheModel.getCacheById(cache.id, function(err, foundCache) {
    cache = foundCache;
    cache.status.zoomLevelStatus = cache.status.zoomLevelStatus || [];

    var extent = turf.extent(cache.geometry);

    var totalCacheTiles = 0;

    for (var zoom = minZoom; zoom <= maxZoom; zoom++) {
      var yRange = tileUtilities.yCalculator(extent, zoom);
      var xRange = tileUtilities.xCalculator(extent, zoom);
      var totalTiles = (1 + (yRange.max - yRange.min)) * (1 + (xRange.max - xRange.min));
      totalCacheTiles += totalTiles;
      cache.status.zoomLevelStatus[zoom] = {
        complete: false,
        totalTiles: totalTiles,
        generatedTiles: 0
      };
    }

    cache.status.totalTiles = totalCacheTiles;
    cache.save(function() {
      var zoom = minZoom;
      var extent = turf.extent(cache.geometry);

      async.whilst(
        function (stop) {
          return zoom <= maxZoom && !stop;
        },
        function (zoomLevelDone) {
          console.log("Starting zoom level " + zoom);
          CacheModel.shouldContinueCaching(cache, function(err, continueCaching) {
            if (!continueCaching) {
              zoom++;
              return zoomLevelDone();
            }
            console.log("Continuing to cache zoom level " + zoom);
            var yRange = tileUtilities.yCalculator(extent, zoom);
            var xRange = tileUtilities.xCalculator(extent, zoom);

            var currentx = xRange.min;

            async.doWhilst(
              function(xRowDone) {
                getXRow(cache, currentx, yRange, zoom, xRowDone, downloadTile);
              },
              function (stop) {
                console.log("x row " + currentx + " is done");
                currentx++;
                return currentx <= xRange.max && !stop;
              },
              function (err) {
                console.log("Zoom level " + zoom + " is complete.");
                CacheModel.updateZoomLevelStatus(cache, zoom, true, function(err) {
                  zoom++;
                  zoomLevelDone();
                });
              }
            );
          });
        },
        function (err) {
          console.log("done with all the zoom levels");
          CacheModel.getCacheById(cache.id, function(err, foundCache) {
            CacheModel.updateFormatCreated(foundCache, ['xyz', 'tms'], foundCache.totalTileSize, function(err, cache) {
              cache.status.complete = true;
              cache.save(function() {
                callback(null);
              });
            });
          });
        }
      );
    });
  });
}
