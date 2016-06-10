var assert = require('assert')
  , FeatureModel = require('mapcache-models').Feature
  , turf = require('turf')
  , lengthStream = require('length-stream')
  , fs = require('fs-extra')
  , path = require('path')
  , Map = require('../../map/map')
  , Cache = require('../../cache/cache')
  , should = require('should');

var dataSource = {
  id: 'test-ds',
  name: 'osm',
  format: 'xyz',
  url: 'http://osm.geointservices.io/osm_tiles',
  zOrder: 0
};

var mapModel = {
  id: 'test-map',
  dataSources: [dataSource]
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
  minZoom: 0,
  maxZoom: 3,
  geometry: turf.polygon([[
    [-179, -85],
    [-179, 85],
    [179, 85],
    [179, -85],
    [-179, -85]
  ]]),
  source: mapModel,
  outputDirectory: '/tmp/mapcache-test'
};

var tmpImage = '/tmp/geotiff_test.png';

describe('tms cache creation tests', function() {
  var map;
  var cache;
  before(function(done) {
    this.timeout(10000);
    fs.mkdirsSync(cacheModel.outputDirectory);
    cache = new Cache(cacheModel);
    cache.callbackWhenInitialized(function() {
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
  afterEach(function() {

  });
  it('should show the map', function(done) {
    this.timeout(0);
    cache.generateFormat('tms', function(err, cache) {
      console.log('done');
      cache.getData('tms', cacheModel.minZoom, cacheModel.maxZoom, function(err, data) {
        var stream = data.stream;
        var ws = fs.createOutputStream(path.join('/tmp', 'zip'+cacheModel.id+data.extension));
        ws.on('close', function() {
          done();
        });
        stream.pipe(ws);
      });
    }, function(cache, callback) {
      callback(null, cache);
    });
  });
});
