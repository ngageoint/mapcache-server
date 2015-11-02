var CacheModel = require('../../models/cache.js')
  , path = require('path')
  , SourceApi = require('../sources')
  , exec = require('child_process').exec
  , config = require('../../config.js')
  , tileUtilities = require('../tileUtilities')
  , fs = require('fs-extra');

exports.getCacheData = function(cache, minZoom, maxZoom, callback) {
  var geoPackageFile = path.join(config.server.cacheDirectory.path, cache._id.toString(), cache._id + ".gpkg");
  if (!fs.existsSync(geoPackageFile)) {
    var child = require('child_process').fork('api/caches/creator.js');
    child.send({operation:'generateCache', cache: cache, format: 'geopackage', minZoom: minZoom, maxZoom: maxZoom});
    callback(null, {creating: true});
  } else {
    var stream = fs.createReadStream(geoPackageFile);
    callback(null, {stream: stream, extension: '.gpkg'});
  }
}

exports.generateCache = function(cache, minZoom, maxZoom, callback) {


  var java = require('java');
  var mvn = require('node-java-maven');

  var extent = turf.extent(cache.geometry);
  extent[0] = Math.max(-180, extent[0]);
  extent[1] = Math.max(-85, extent[1]);
  extent[2] = Math.min(180, extent[2]);
  extent[3] = Math.min(85, extent[3]);

  mvn(function(err, mvnResults) {
    if (err) {
      return console.error('could not resolve maven dependencies', err);
    }
    mvnResults.classpath.forEach(function(c) {
      console.log('adding ' + c + ' to classpath');
      java.classpath.push(c);
    });

    var File = java.import('java.io.File');

    // var geoPackageFile = path.join(config.server.cacheDirectory.path, cache._id.toString(), cache._id + ".gpkg");
    var geoPackageFile = '/tmp/'+cache._id + ".gpkg");

    var gpkgFile = new File(geoPackageFile);
    java.callStaticMethodSync('mil.nga.geopackage.manager.GeoPackageManager', 'create', gpkgFile);

    /*
    put the bounds of the entire cache in the TileMatrixSet


    contents bounds can be in 4326

    tile matrix bounds (bounds of the entire cache) have to be in web mercator

    table name in contents dao is custom table name to contain the tileStream

    update the last change date in the contents dao when done

    Tile table is the user tile table

    each zoom level has a tile matrix



    // to validate https://git.geointapps.org/geopackage/geopackage-validate/tree/master

    // readFormatTiles()
    // https://github.com/ngageoint/geopackage-java/blob/master/src/main/java/mil/nga/geopackage/io/TileReader.java

    */


    async.eachSeries(cache.source.dataSources, function iterator(s, callback) {
      if (cache.cacheCreationParams.dataSources.indexOf(s.id) == -1) return callback();
      if (s.vector) {
        SourceApi.getFeatures(s, extent[0], extent[1], extent[2], extent[3], 0, function(err, features) {
          // now add the features to the geopackage
        });
      } else {
        xyzTileWorker.createXYZTiles(cache, minZoom, maxZoom, function(tileInfo, tileDone) {
          SourceApi.getTileFromDataSource(s, format, z, x, y, cache.cacheCreationParams, function(err, tileStream) {
            if (!tileStream) return callback();

            // write the tileStream which is a png to the geopackage
            // then call

            var tileBbox = tileUtilities.tileBboxCalculator(x, y, z);


            tileDone();
          });
        }, function(cache, continueCallback) {
          CacheModel.shouldContinueCaching(cache, continueCallback);
        }, function(cache, zoom, zoomDoneCallback) {
          zoomDoneCallback();
          // CacheModel.updateZoomLevelStatus(cache, zoom, function(err) {
          //   zoomDoneCallback();
          // });
        }, function(err, cache) {
          callback();
          // CacheModel.getCacheById(cache.id, function(err, foundCache) {
          //   CacheModel.updateFormatCreated(foundCache, 'xyz', foundCache.totalTileSize, function(err, cache) {
          //     cache.status.complete = true;
          //     cache.save(function() {
          //       callback(null, cache);
          //     });
          //   });
          // });
        });
      }
    }, function done() {
      // var cp = require('child_process');
      // var pngquant = cp.spawn('./utilities/pngquant/pngquant', ['-']);
      // canvas.pngStream().pipe(pngquant.stdin);
      // callback(null, pngquant.stdout);

      callback(null, {cache: cache, file: geoPackageFile});

    });
  });



  //
  //
  // SourceApi.getTile(source.source, 'png', z, x, y, source.cacheCreationParams, function(err, request) {
  //   if (request) {
  //     var stream = fs.createWriteStream(dir + filename);
  //     stream.on('close',function(status){
  //       done(null, dir+filename);
  //     });
  //
  //     request.pipe(stream);
  //   } else {
  //     done(null, dir+filename);
  //   }
  // });
  //
  // async.eachSeries(cache.source.dataSources, function iterator(s, callback) {
  //   if (cache.cacheCreationParams.dataSources.indexOf(s.id) == -1) return callback();
  //   if (s.vector) {
  //     SourceApi.getFeatures(s, extent[0], extent[1], extent[2], extent[3], 0, function(err, features) {
  //       // now add the features to the geopackage
  //     });
  //   } else {
  //     xyzTileWorker.createXYZTiles(cache, minZoom, maxZoom, function(tileInfo, tileDone) {
  //       SourceApi.getTileFromDataSource(s, format, z, x, y, cache.cacheCreationParams, function(err, tileStream) {
  //         if (!tileStream) return callback();
  //
  //         // write the tileStream which is a png to the geopackage
  //         // then call
  //         tileDone();
  //       });
  //     }, function(cache, continueCallback) {
  //       CacheModel.shouldContinueCaching(cache, continueCallback);
  //     }, function(cache, zoom, zoomDoneCallback) {
  //       zoomDoneCallback();
  //       // CacheModel.updateZoomLevelStatus(cache, zoom, function(err) {
  //       //   zoomDoneCallback();
  //       // });
  //     }, function(err, cache) {
  //       callback();
  //       // CacheModel.getCacheById(cache.id, function(err, foundCache) {
  //       //   CacheModel.updateFormatCreated(foundCache, 'xyz', foundCache.totalTileSize, function(err, cache) {
  //       //     cache.status.complete = true;
  //       //     cache.save(function() {
  //       //       callback(null, cache);
  //       //     });
  //       //   });
  //       // });
  //     });
  //   }
  // }, function done() {
  //   var cp = require('child_process');
  //   var pngquant = cp.spawn('./utilities/pngquant/pngquant', ['-']);
  //   canvas.pngStream().pipe(pngquant.stdin);
  //   callback(null, pngquant.stdout);
  // });


  // CacheModel.getCacheById(cache.id, function(err, cache) {
  //   // ensure there is already an xyz cache generated
  //   if (cache.formats && cache.formats.xyz && !cache.formats.xyz.generating) {
  //     var geoPackageFile = path.join(config.server.cacheDirectory.path, cache._id.toString(), cache._id + ".gpkg");
  //     console.log('running ' + './utilities/geopackage-python-4.0/Packaging/tiles2gpkg_parallel.py -tileorigin ul -srs 3857 ' + path.join(config.server.cacheDirectory.path, cache._id.toString(), 'xyztiles') + " " + geoPackageFile);
  //     var python = exec(
  //       './utilities/geopackage-python-4.0/Packaging/tiles2gpkg_parallel.py -tileorigin ul -srs 3857 ' + path.join(config.server.cacheDirectory.path, cache._id.toString(), 'xyztiles') + " " + geoPackageFile,
  //       function(error, stdout, stderr) {
  //         callback(error, {cache: cache, file: geoPackageFile});
  //       }
  //     );
  //   } else {
  //     console.log('XYZ cache is not done generating, waiting 30 seconds to generate a geopackage...');
  //     setTimeout(exports.generateCache, 30000, cache, minZoom, maxZoom, callback);
  //   }
  // });
}

exports.deleteCache = function(cache, callback) {
  fs.remove(config.server.cacheDirectory.path + "/" + cache._id + "/" + cache._id + ".gpkg", function(err) {
    callback(err, cache);
  });
}
