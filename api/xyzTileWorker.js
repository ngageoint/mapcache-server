var turf = require('turf')
  , async = require('async')
  , tileUtilities = require('./tileUtilities')
  , config = require('../config.json');

function pushNextTileTasks(q, xyzSource, zoom, x, yRange, numberOfTasks) {
  if (yRange.current > yRange.max) return false;
  for (var i = yRange.current; i <= yRange.current + numberOfTasks && i <= yRange.max; i++) {
    q.push({z:zoom, x: x, y: i, xyzSource: xyzSource});
  }
  yRange.current = yRange.current + numberOfTasks;
  return true;
}

function getXRow(xyzSource, xRow, yRange, zoom, xRowDone, downloadTile, shouldContinueFunction) {
  var q = async.queue(downloadTile, 10);

  q.drain = function() {
    shouldContinueFunction(xyzSource, function(err, keepGoing) {
      if (keepGoing) {

        // now go get the next 10 ys and keep going
        var tasksPushed = pushNextTileTasks(q, xyzSource, zoom, xRow, yRange, 10);
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

  shouldContinueFunction(xyzSource, function(err, keepGoing) {
    if (keepGoing) {
      console.log("Continuing to create row " + xRow);
      pushNextTileTasks(q, xyzSource, zoom, xRow, yRange, 10);
    } else {
      xRowDone(true);
    }
  });
}

exports.createXYZTiles = function(xyzSource, minZoom, maxZoom, downloadTile, shouldContinueFunction, zoomLevelCompleteFunction, callback) {
    xyzSource.status.zoomLevelStatus = xyzSource.status.zoomLevelStatus || [];

    var extent = turf.extent(xyzSource.geometry);

    var totalXYZTiles = 0;

    for (var zoom = minZoom; zoom <= maxZoom; zoom++) {
      var yRange = tileUtilities.yCalculator(extent, zoom);
      var xRange = tileUtilities.xCalculator(extent, zoom);
      var totalTiles = (1 + (yRange.max - yRange.min)) * (1 + (xRange.max - xRange.min));
      totalXYZTiles += totalTiles;
      xyzSource.status.zoomLevelStatus[zoom] = {
        complete: false,
        totalTiles: totalTiles,
        generatedTiles: 0
      };
    }

    xyzSource.status.totalTiles = totalXYZTiles;
    xyzSource.save(function() {
      var zoom = minZoom;
      var extent = turf.extent(xyzSource.geometry);

      async.whilst(
        function (stop) {
          return zoom <= maxZoom && !stop;
        },
        function (zoomLevelDone) {
          console.log("Starting zoom level " + zoom);
          shouldContinueFunction(xyzSource, function(err, keepGoing) {
            if (!keepGoing) {
              zoom++;
              return zoomLevelDone();
            }
            console.log("Continuing to create zoom level " + zoom);
            var yRange = tileUtilities.yCalculator(extent, zoom);
            var xRange = tileUtilities.xCalculator(extent, zoom);

            var currentx = xRange.min;

            async.doWhilst(
              function(xRowDone) {
                getXRow(xyzSource, currentx, yRange, zoom, xRowDone, downloadTile, shouldContinueFunction);
              },
              function (stop) {
                console.log("x row " + currentx + " is done");
                currentx++;
                return currentx <= xRange.max && !stop;
              },
              function (err) {
                console.log("Zoom level " + zoom + " is complete.");
                zoomLevelCompleteFunction(xyzSource, zoom, function() {
                  zoom++;
                  zoomLevelDone();
                });
              }
            );
          });
        },
        function (err) {
          console.log("done with all the zoom levels");
          callback(err, xyzSource);
        }
      );
    });
}
