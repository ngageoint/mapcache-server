var geotiff = require('./geotiff')
  , gdal = require("gdal")
  , util = require('util')
  , turf = require('turf')
  , path = require('path')
  , fs = require('fs-extra')
  , mongoose = require('mongoose')
  , png = require('pngjs')
  , tu = require('../tileUtilities')
  , async = require('async')
  , tileUtilities = require('../tileUtilities')
  , paratask = require('paratask')
  , SourceModel = require('../../models/source')
  , CacheModel = require('../../models/cache')
  , config = require('../../config.json');

var mongodbConfig = config.server.mongodb;

var mongoUri = "mongodb://" + mongodbConfig.host + "/" + mongodbConfig.db;
mongoose.connect(mongoUri, {server: {poolSize: mongodbConfig.poolSize}}, function(err) {
  if (err) {
    console.log('Error connecting to mongo database, please make sure mongodb is running...');
    throw err;
  }
});
mongoose.set('debug', true);


process.on('message', function(m) {
  console.log('got a message in child process', m);
    if(m.operation == 'process') {
      processSource(m.sourceId);
    } else if(m.operation == 'generateCache') {
      createCache(m.cache);
    } else if(m.operation == 'exit') {
      process.exit();
    }
});

function pushNextTileTasks(q, cache, zoom, x, yRange, numberOfTasks) {
  if (yRange.current > yRange.max) return false;
  for (var i = yRange.current; i <= yRange.current + numberOfTasks && i <= yRange.max; i++) {
    q.push({z:zoom, x: x, y: i, cache: cache});
  }
  yRange.current = yRange.current + numberOfTasks;
  return true;
}

function downloadTile(tileInfo, tileDone) {
  CacheModel.shouldContinueCaching(tileInfo.cache, function(err, continueCaching) {
    if (continueCaching) {
      geotiff.getTile(tileInfo.cache.source, tileInfo.z, tileInfo.x, tileInfo.y, function(err, tileStream) {
        var filepath = getFilepath(tileInfo);
        var dir = createDir(tileInfo.cache._id, filepath);
        var filename = getFilename(tileInfo, tileInfo.cache.source.format);
        var stream = fs.createWriteStream(dir + '/' + filename);
        stream.on('close',function(status){
          console.log('status on tile download is', status);
          CacheModel.updateTileDownloaded(tileInfo.cache, tileInfo.z, tileInfo.x, tileInfo.y, function(err) {
            tileDone(null, tileInfo);
          });
        });
        if (tileStream) {
          tileStream.pipe(stream);
        }
      });
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
      console.log("continue caching? " + continueCaching);
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

function createCache(cache) {
  CacheModel.getCacheById(cache.id, function(err, foundCache) {
    cache = foundCache;
    var zoom = cache.minZoom;
    var extent = turf.extent(cache.geometry);

    async.whilst(
      function (stop) {
        return zoom <= cache.maxZoom && !stop;
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
        cache.status.complete = true;
        cache.save();
      }
    );
  });
}

function processSource(sourceId) {

  SourceModel.getSourceById(sourceId, function(err, source){
    if (!source) {
      console.log('did not find the source: ' + sourceId);
    }
    source.status="Extracting GeoTIFF data";
    source.complete = false;
    source.save(function(err) {
      var ds = gdal.open(source.filePath);
      source.projection = ds.srs.getAuthorityCode("PROJCS");
      var polygon = turf.polygon([sourceCorners(ds)]);
      source.geometry = polygon;
      source.save(function(err) {
        ds.close();
        reproject(source, 3857, function(err){
          console.log('done');
          process.exit();
        });
      });
    });
  });
}

function reproject(source, epsgCode, callback) {
  source.status = "Reprojecting to EPSG:3857";
  source.save(function(err) {
    var targetSrs = gdal.SpatialReference.fromEPSG(epsgCode);
    var ds = gdal.open(source.filePath);
    var warpSuggestion = gdal.suggestedWarpOutput({
      src: ds,
      s_srs: ds.srs,
      t_srs:targetSrs
    });
    var dir = path.join(config.server.sourceDirectory.path, source.id);
    var fileName = path.basename(epsgCode + "_" + path.basename(source.filePath));
    var file = path.join(dir, fileName);

    console.log("translating " + source.filePath + " to " + file);

    var destination = gdal.open(file, 'w', "GTiff", warpSuggestion.rasterSize.x, warpSuggestion.rasterSize.y, 3);
    destination.srs = targetSrs;
    destination.geoTransform = warpSuggestion.geoTransform;

    gdal.reprojectImage({
      src: ds,
      dst: destination,
      s_srs: ds.srs,
      t_srs: targetSrs
    });
    ds.close();
    destination.close();
    fs.stat(file, function(err, stat) {
      source.projections = source.projections || {};
      source.projections[epsgCode] = {path: file, size: stat.size};
      source.status = "Complete";
      source.complete = true;
      source.save(callback);
    });
  });
}

function sourceCorners(ds) {
  var size = ds.rasterSize;
  var geotransform = ds.geoTransform;

  // corners
  var corners = {
  	'Upper Left  ' : {x: 0, y: 0},
  	'Upper Right ' : {x: size.x, y: 0},
  	'Bottom Right' : {x: size.x, y: size.y},
  	'Bottom Left ' : {x: 0, y: size.y}
  };

  var wgs84 = gdal.SpatialReference.fromEPSG(4326);
  var coord_transform = new gdal.CoordinateTransformation(ds.srs, wgs84);

  var corner_names = Object.keys(corners);

  var coordinateCorners = [];

  corner_names.forEach(function(corner_name) {
  	// convert pixel x,y to the coordinate system of the raster
  	// then transform it to WGS84
  	var corner      = corners[corner_name];
  	var pt_orig     = {
  		x: geotransform[0] + corner.x * geotransform[1] + corner.y * geotransform[2],
  		y: geotransform[3] + corner.x * geotransform[4] + corner.y * geotransform[5]
  	}
  	var pt_wgs84    = coord_transform.transformPoint(pt_orig);
    coordinateCorners.push([pt_wgs84.x, pt_wgs84.y]);
  });

  coordinateCorners.push([coordinateCorners[0][0], coordinateCorners[0][1]]);
  return coordinateCorners;
}

function getFilepath(tileInfo) {
	return tileInfo.z + '/' + tileInfo.x + '/' ;
}

function getFilename(tileInfo, type) {
	if (type == 'tms') {
		y = Math.pow(2,tileInfo.z) - tileInfo.y -1;
		return y + '.png';
	} else {
		return tileInfo.y + '.png';
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
