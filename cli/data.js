var api = require('../api')
  , mapcacheModels = require('mapcache-models')
  , cacheModel = mapcacheModels.Cache
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
    migrateCaches
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
