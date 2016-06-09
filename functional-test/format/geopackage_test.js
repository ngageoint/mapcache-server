var colors = require('colors')
  , turf = require('turf')
  , fs = require('fs-extra')
  , path = require('path')
  , GeoPackage = require('../../format/geopackage')
  , Cache = require('../../cache/cache')
  , should = require('should');

  function startTest(test) {
    console.log('Starting: '.white.bgRed.italic + test.white.bgBlue.bold);
  }

  function endTest(test) {
    console.log('Complete: '.white.bgRed.italic + test.white.bgBlue.bold);
  }

  function beforeTest(test) {
    console.log('Before: '.white.bgRed.italic + test.white.bgBlue.bold);
  }

  function afterTest(test) {
    console.log('After: '.white.bgRed.italic + test.white.bgBlue.bold);
  }

  function beforeEach(test) {
    console.log('Before Each: '.white.bgRed.italic + test.white.bgBlue.bold);
  }

  function afterEachTest(test) {
    console.log('After Each: '.white.bgRed.italic + test.white.bgBlue.bold);
  }

describe('GeoPackage constraint violation test', function() {

  var f;
  var dataSource = {
    id: 'test-xyz',
    name: 'osm',
    url: 'http://osm.geointservices.io/osm_tiles',
    format: 'xyz',
    zOrder: 0
  };

  var map = {
    id: 'test-map',
    dataSources: [dataSource]
  };

  var cache = {
    id: 'test-cache',
    name: 'test cache',
    geometry: turf.polygon([[
      [-179, -85],
      [-179, 85],
      [179, 85],
      [179, -85],
      [-179, -85]
    ]]),
    minZoom: 0,
    maxZoom: 4,
    source: map,
    outputDirectory: '/tmp'
  };

  before(function(done) {
    beforeTest(dataSource.format + ' cache tests');
    this.timeout(30000);
    console.log('doing the before');
    fs.remove(path.join(cache.outputDirectory, cache.id), function(err) {
      fs.remove(path.join(cache.outputDirectory, map.id), function(err) {
        var cacheObj = new Cache(cache);
        cacheObj.callbackWhenInitialized(function(err, cacheObj) {
          f = new GeoPackage({
            cache: cacheObj,
            outputDirectory:cache.outputDirectory
          });
          done();
        });
      });
    });
  });

  after(function(done){
    afterTest(dataSource.format + ' cache tests');
    fs.remove(path.join(cache.outputDirectory, cache.id), function(err) {
      fs.remove(path.join(cache.outputDirectory, map.id), function(err) {
        done();
      });
    });
  });


  it ('should create the geopackage cache', function(done) {
    this.timeout(30000);
    f.generateCache(function(err, cache) {
      console.log('Done Err:', err);
      console.log('Done cache:', cache);
      done();
    }, function(progress, callback) {
      console.log('progress', progress);
      callback(null, progress);
    });

  });

});
