var api = require('../api')
  , mapcacheModels = require('mapcache-models')
  , cacheModel = mapcacheModels.Cache
  , config = require('mapcache-config')
  , fs = require('fs-extra')
  , path = require('path')
  , async = require('async');

exports.testGeoPackage = function() {
  var java = require('java');
  var mvn = require('node-java-maven');

  mvn(function(err, mvnResults) {
    if (err) {
      return console.error('could not resolve maven dependencies', err);
    }
    mvnResults.classpath.forEach(function(c) {
      console.log('adding ' + c + ' to classpath');
      java.classpath.push(c);
    });

    var File = java.import('java.io.File');

    var gpkgFile = new File('/tmp/gpkg.gpkg');
    java.callStaticMethodSync('mil.nga.geopackage.manager.GeoPackageManager', 'create', gpkgFile);
    process.exit();
  });
};

exports.fixData = function(yargs) {
  yargs.usage('Ensures that the data in the database is correct as far as we can tell.')
  .help('help');

  async.series([
    dropIndex,
    migrateCaches,
    migrateMaps
  ], function() {
    process.exit();
  });
};

function dropIndex(done) {
  cacheModel.cacheModel.collection.dropIndex('geometry_2dsphere');
  done();
}

function migrateCaches(done) {
  api.Cache.getAll({}, function(err, caches) {
    async.eachSeries(caches, function iterator(cache, callback) {
      console.log('migrating cache %s', cache._id);
      if (cache.formats.xyz) {
        var size = cache.formats.xyz.size;
        cache.formats.xyz = JSON.parse(JSON.stringify(cache.status));
        cache.formats.xyz.size = size;
        cache.formats.xyz.percentComplete = 100;
        cache.geometry = {
          "type":"Feature",
          "geometry": cache.geometry
        };
        cache.markModified('formats');
        cache.markModified('geometry');
        cache.save(function(err) {
          console.log('err is', err);
          callback();
        });
      }
    }, function() {
      done();
    });
  });
}

function migrateMaps(done) {
  var sourceDirectory = config.server.sourceDirectory.path;
  api.Source.getAll({}, function(err, maps) {
    async.eachSeries(maps, function iterator(map, callback) {
      console.log('migrating map %s', map._id);
      async.eachSeries(map.dataSources, function(dataSource, dsDone) {

        // console.log('datasource', dataSource);
        if (dataSource.file && dataSource.file.path) {
          var srcFile = dataSource.file.path;
          var destFile = path.join(sourceDirectory, dataSource._id.toString());
          console.log('moving file %s to %s', srcFile, destFile);
          fs.move(srcFile, destFile, function() {
            dataSource.file.path = destFile;
            dsDone();
          });
        } else {
          dsDone();
        }
      }, function() {
        map.markModified('dataSources');
        map.save(function() {
          callback();
        });
      });
    }, function() {
      done();
    });
  });
}
