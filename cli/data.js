var api = require('../api')
  , async = require('async')
  , cacheModel = require('../models/cache')
  , caches = require('../api/caches');

exports.ensureDataIntegrity = function(yargs) {
  var argv =
    yargs.usage('Ensures that the data in the database is correct as far as we can tell.')
    .help('help')
    .argv;

  async.series([
    fixCacheSizes,
    // moveSourceUrlAndFileLocation,
  ], function(err, results) {
    process.exit();
  })
}

function fixCacheSizes(finished) {
  new api.Cache().getAll({}, function(err, caches) {
    if (err) {
      console.log('There was an error retrieving caches.');
      finished();
    }
    if (!caches) {
      console.log('No caches were found.');
      finished();
    }

    console.log('Found ' + caches.length + ' caches.');

    async.eachSeries(caches, function iterator(cache, callback) {
      if (cache.totalTileSize && !cache.vector) {
        cache.formats = cache.formats || {};
        if (!cache.formats.xyz || !cache.formats.xyz.size) {
          console.log('Setting cache xyz size for cache ' + cache.name + ' to ' + cache.totalTileSize);
          cacheModel.updateFormatCreated(cache, 'xyz', cache.totalTileSize, function(err, newCache) {
            if(!err){
              cacheModel.updateFormatCreated(newCache, 'tms', cache.totalTileSize, function(err, newCache) {
                callback(err);
              });
            } else {
              console.log('Error saving cache', err);
              callback(err);
            }
          });
        } else {
          callback();
        }
      } else {
        callback();
      }
    }, function done() {
      finished();
    });
  });
}

function undo(finished) {
  new api.Source().getAll({}, function(err, sources) {
    if (err) {
      console.log("There was an error retrieving sources.");
      finished();
    }
    if (sources.length ==0 ) {
      console.log("Found 0 sources.");
      finished();
    }

    async.eachSeries(sources, function iterator(source, callback) {

      source.dataSources = source.dataSources || [];
      console.log('source.name', source.name);
      console.log('source.datasources', source.dataSources);

      source.set('url', source.dataSources[0].url);
      source.set('wmsGetCapabilities', source.dataSources[0].wmsGetCapabilities);
      source.set('vector', source.dataSources[0].vector);
      source.set('filePath', source.dataSources[0].filePath);
      source.set('format', source.dataSources[0].format);
      source.set('dataSources', undefined);
      source.markModified('dataSources');
      source.markModified('url');
      source.markModified('wmsGetCapabilities');
      source.markModified('vector');
      source.markModified('filePath');
      source.markModified('format');
      source.save(function(err) {
        console.log('error saving', err);
        callback();
      });
    }, function done() {
      finished();
    });
  });
}

function moveSourceUrlAndFileLocation(finished) {
  new api.Source().getAll({}, function(err, sources) {
    if (err) {
      console.log("There was an error retrieving sources.");
      finished();
    }
    if (sources.length ==0 ) {
      console.log("Found 0 sources.");
      finished();
    }

    async.eachSeries(sources, function iterator(source, callback) {

      source.dataSources = source.dataSources || [];
      console.log('source.name', source.name);
      console.log('source.datasources', source.dataSources);
      var found = false;
      for (var i = 0; i < source.dataSources.length && !found; i++) {
        if (source.dataSources[i].url == source.url || source.dataSources[i].filePath == source.filePath) {
          found = true;
        }
      }
      if (!found) {
        console.log('Moving to a dataSource for source: ' + source.name);
        source.dataSources.push({
          url: source.url,
          filePath: source.filePath,
          format: source.format,
          zOrder: 0,
          geometry: source.geometry,
          vector: source.vector || false,
          projection: source.projection,
          wmsGetCapabilities: source.wmsGetCapabilities
        });
      }
      source.set('url', undefined);
      source.set('wmsGetCapabilities', undefined);
      source.set('vector', undefined);
      source.set('filePath', undefined);
      source.set('format', undefined);
      source.markModified('dataSources');
      source.markModified('url');
      source.markModified('wmsGetCapabilities');
      source.markModified('vector');
      source.markModified('filePath');
      source.markModified('format');
      source.save(function(err) {
        console.log('error saving', err);
        callback();
      });
    }, function done() {
      finished();
    });
  });
}

// exports.resetGenerating = function(yargs) {
//   var argv =
//     yargs.usage('Resets all the generating formats.')
//     .help('help')
//     .argv;
//
//   new api.Cache().getAll({}, function(err, caches) {
//     if (err) {
//       console.log('There was an error retrieving caches.');
//       process.exit();
//     }
//     if (!caches) {
//       console.log('No caches were found.');
//       process.exit();
//     }
//
//     process.exit();
//   });
// }
