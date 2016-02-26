var assert = require('assert')
  , FeatureModel = require('mapcache-models').Feature
  , turf = require('turf')
  , lengthStream = require('length-stream')
  , fs = require('fs')
  , Map = require('../../map/map')
  , should = require('should');

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

var geotiffDataSource = {
  id: 'test-ds',
  name: 'geotiff',
  format: 'mrsid',
  file: {
    path: __dirname + '/5682de4cfff8e4894de8fcda',
    name: '5682de4cfff8e4894de8fcda'
  },
  zOrder: 0
};

var mapModel = {
  id: 'test-map',
  dataSources: [geotiffDataSource]
};

/* Bounds of denver.tif *
/*
Upper Left  (  512651.296, 4391240.166) (104d51' 8.98"W, 39d40'15.19"N) (-104.852494, 39.670886)
Lower Left  (  512651.296, 4388316.166) (104d51' 9.18"W, 39d38'40.34"N) (-104.85255, 39.644539)
Upper Right (  515154.296, 4391240.166) (104d49'23.92"W, 39d40'15.04"N) (-104.823311, 39.670844)
Lower Right (  515154.296, 4388316.166) (104d49'24.16"W, 39d38'40.20"N) (-104.823378, 39.6445)
Center      (  513902.796, 4389778.166) (104d50'16.56"W, 39d39'27.69"N)
*/

var cache = {
  id: 'test-cache',
  name: 'generic test cache',
  minZoom: 0,
  maxZoom: 12,
  formats: ['xyz'],
  outputDirectory: '/tmp/mapcache-test'
};

var tmpImage = '/tmp/geotiff_test.png';

describe('geotiff source tests', function() {
  var map;
  before(function(done) {
    this.timeout(60000);
    map = new Map(mapModel);
    map.callbackWhenInitialized(function() {
      done();
    });
  });
  after(function() {
    // fs.remove(path.join(cache.outputDirectory, cache.id), function(err) {
    //   fs.remove(path.join(cache.outputDirectory, map.id), function(err) {
    //     done();
    //   });
    // });
  });
  it('should show the map', function(done) {
    map.getOverviewTile(function(err, tileStream) {
      var ws = fs.createWriteStream(tmpImage);
      tileStream.pipe(ws);
      ws.on('close', function() {
        done();
      });
    });
  });
});
