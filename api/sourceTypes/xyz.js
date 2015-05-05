var CacheModel = require('../../models/cache')
  , SourceModel = require('../../models/source')
  , async = require('async')
  , turf = require('turf')
  , request = require('request')
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
  source.save(function(err) {
    callback(null, source);
  });
}

exports.getTile = function(source, z, x, y, callback) {
  console.log('get tile ' + z + '/' + x + '/' + y + '.png for source ' + source.name);
  var url = source.url + "/" + z + '/' + x + '/' + y + '.png';
  var req = request.get({url: url,
    headers: {'Content-Type': 'image/png'},
  })
  .on('error', function(err) {
    console.log(err+ url);

    callback(err, tileInfo);
  })
  .on('response', function(response) {
    var size = response.headers['content-length'];
    SourceModel.updateSourceAverageSize(source, size, function(err) {
      console.log('err updating tilesize', err);

    });
  });
  callback(null, req);
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

function getXRow(cache, xRow, yRange, zoom, xRowDone) {
  var q = async.queue(downloadTile, 10);

  q.drain = function() {
    console.log("Should keep going on row " + xRow);
    CacheModel.shouldContinueCaching(cache, function(err, continueCaching) {
      if (continueCaching) {
        console.log("Continuing to cache row " + xRow);

        // now go get the next 10 ys and keep going
        var tasksPushed = pushNextTileTasks(q, cache, zoom, xRow, yRange, 10);
        // if there are no more ys do the callback
        if (!tasksPushed) {
          console.log("Complete z: " + zoom + " x: " + xRow);
          yRange.current = yRange.min;
          xRowDone();
        }
      } else {
        xRowDone();
      }
    });
  };

  CacheModel.shouldContinueCaching(cache, function(err, continueCaching) {
    if (continueCaching) {
      console.log("Continuing to cache row " + xRow);
      pushNextTileTasks(q, cache, zoom, xRow, yRange, 10);
    } else {
      xRowDone();
    }
  });
}

exports.createCache = function(cache) {
  var zoom = cache.minZoom;
  var extent = turf.extent(cache.geometry);

  async.whilst(
    function () {
      return zoom <= cache.maxZoom;
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
            getXRow(cache, currentx, yRange, zoom, xRowDone);
          },
          function () {
            currentx++;
            return currentx <= xRange.max;
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
        cache.status.complete = true;
        cache.save();
    }
  );
}
