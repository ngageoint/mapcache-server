var api = require('../api')
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

exports.ensureDataIntegrity = function(yargs) {
  yargs.usage('Ensures that the data in the database is correct as far as we can tell.')
  .help('help');

  async.series([
    createDataSources,
  ], function() {
    process.exit();
  });
};

function createDataSources(finished) {
  api.Source.getAll({}, function(err, sources) {
    if (err) {
      console.log("There was an error retrieving sources.");
      finished();
    }
    if (sources.length === 0) {
      console.log("Found 0 sources.");
      finished();
    }

    async.eachSeries(sources, function iterator(source, callback) {
      console.log('fixing source ' + source.name);
      var dataSource = {
        name: source.name + ' ' + source.format,
        metadata: source.wmsGetCapabilities,
        url: source.url,
        filePath: source.filePath,
        vector: source.vector,
        layer: source.wmsLayer,
        geometry: source.geometry,
        format: source.format,
        tilesLackExtensions: source.tilesLackExtensions
      };
      source.dataSources = [dataSource];
      source.save(function(err) {
        console.log('err fixing source', err);
        callback(err);
      });
    }, function done() {
      finished();
    });
  });
}
