var assert = require('assert')
  , FeatureModel = require('mapcache-models').Feature
  , turf = require('turf')
  , lengthStream = require('length-stream')
  , fs = require('fs-extra')
  , Map = require('../../map/map')
  , Cache = require('../../cache/cache')
  , should = require('should')
  , path = require('path');

// var geotiffDataSource = {
//   id: 'test-ds',
//   name: 'geotiff',
//   format: 'geotiff',
//   file: {
//     path: __dirname + '/new.tif',
//     name: 'new.tif'
//   },
//   zOrder: 0
// };

var ds = {
  id: 'test-ds',
  name: 'mines',
  format: 'shapefile',
  file: {
    path: __dirname + '/mines.zip',
    name: 'mines.zip'
  },
  zOrder: 0
};

var mapModel = {
  id: 'test-map',
  dataSources: [ds]
};

/* Bounds of denver.tif *
/*
Upper Left  (  512651.296, 4391240.166) (104d51' 8.98"W, 39d40'15.19"N) (-104.852494, 39.670886)
Lower Left  (  512651.296, 4388316.166) (104d51' 9.18"W, 39d38'40.34"N) (-104.85255, 39.644539)
Upper Right (  515154.296, 4391240.166) (104d49'23.92"W, 39d40'15.04"N) (-104.823311, 39.670844)
Lower Right (  515154.296, 4388316.166) (104d49'24.16"W, 39d38'40.20"N) (-104.823378, 39.6445)
Center      (  513902.796, 4389778.166) (104d50'16.56"W, 39d39'27.69"N)
*/

var cacheModel = {
  id: 'test-cache',
  name: 'generic test cache',
  outputDirectory: '/tmp/mapcache-test',
  geometry: turf.polygon([[
    [-180, -85],
    [-180, 85],
    [180, 85],
    [180, -85],
    [-180, -85]
  ]]).geometry,
  source: mapModel
};

var tmpImage = '/tmp/geotiff_test.png';

describe('one off source tests', function() {
  var map;
  before(function(done) {
    this.timeout(60000);
    fs.remove('/tmp/mapcache-test', function(err) {
      fs.copy(ds.file.path, '/tmp/mapcache-test/'+ds.file.name, function(err) {
        ds.file.path = '/tmp/mapcache-test/mines.zip';
        done();
        // map = new Map(mapModel);
        // map.callbackWhenInitialized(function() {
        //   done();
        // });
      });
    });
  });
  after(function() {
    fs.remove(path.join(cacheModel.outputDirectory, cacheModel.id), function(err) {
      fs.remove(path.join(cacheModel.outputDirectory, mapModel.id), function(err) {
        FeatureModel.deleteFeaturesBySourceId(ds.id, function(count) {
          log.info('deleted %d %s features', count, ds.id);
          done();
        });
      });
    });
  });

  it('should generate a geopackage cache', function(done) {
    this.timeout(0);
    console.log('Created a map %s with id %s', mapModel.name, mapModel.id);
    cache = new Cache(cacheModel);
    cache.callbackWhenInitialized(function() {
      cache.generateFormat('geopackage', function(err, complete) {
        console.log('done', complete);
        console.log('cache.formats.geopackage', complete.cache.formats.geopackage);
        done();
      }, function(cache, callback) {
        console.log('Cache progress', cache);
        callback(null, cache);
      });
    });
  });
});
