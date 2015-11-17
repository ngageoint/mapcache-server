var assert = require('assert')
  , FeatureModel = require('mapcache-models').Feature
  , turf = require('turf')
  , lengthStream = require('length-stream')
  , devnull = require('dev-null')
  , should = require('should');

var geotiffDataSource = {
  id: 'test-ds',
  name: 'geotiff',
  format: 'geotiff',
  file: {
    path: __dirname + '/denver.tif',
    name: 'geotiff'
  },
  zOrder: 0
};

var map = {
  id: 'test-map',
  dataSources: []
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
  geometry: turf.polygon([[
    [-104.86, 39.6],
    [-104.86, 39.7],
    [-104.81, 39.7],
    [-104.81, 39.6],
    [-104.86, 39.6]
  ]]),
  minZoom: 0,
  maxZoom: 12,
  formats: ['xyz']
};

var GeoTIFF = require('../../format/geotiff');

describe('geotiff', function() {
  describe('#constructor', function () {
    it('should construct an geotiff with a source', function () {
      var geotiff = new GeoTIFF({source: {id: '5'}});
      geotiff.source.id.should.equal('5');
    });
    it('should construct an geotiff with a cache', function() {
      var geotiff = new GeoTIFF({cache: {id: '6'}});
      geotiff.cache.id.should.equal('6');
    });
  });

  describe('generic source tests', function() {
    var generic;
    before(function() {
      geotiff = new GeoTIFF({
        source: geotiffDataSource
      });
    });
    after(function() {
    });
    it('should process the source', function(done) {
      this.timeout(0);
      geotiff.processSource(function(err, newSource) {
        if(err) {
          return done(err);
        }
        console.log('after the source has been processed', newSource);
        map.dataSources.push(newSource);
        done();
      }, function(source, callback) {
        console.log('progress', source);
        callback(null, source);
      });
    });
    it('should pull the 0/0/0 tile for the data source', function(done) {
      this.timeout(0);
      geotiff.getTile('png', 0, 0, 0, {noCache: true}, function(err, stream) {
        if (err) {
          done(err);
          return;
        }
        done();
      });
    });
    it('should pull the 0/0/0 geojson tile for the data source', function(done) {
      this.timeout(0);
      geotiff.getTile('geojson', 0, 0, 0, {noCache: true}, function(err, stream) {
        if (err) {
          done(err);
          return;
        }

        done();
      });
    });
    it('should get all features of the source', function(done) {
      this.timeout(0);
      geotiff.getDataWithin(-180, -85, 180, 85, 4326, function(err, features) {
        console.log('err', err);
        if (err) {
          done(err);
          return;
        }
        done();
      });
    });
    // describe('generic cache tests', function() {
    //   var generic;
    //   before(function() {
    //     cache.source = map;
    //     generic = new Generic({
    //       cache: cache
    //     });
    //   });
    //   after(function() {
    //   });
    //   it('should pull the 0/0/0 tile for the cache', function(done) {
    //     generic.getTile('png', 0, 0, 0, {noCache: true}, function(err, stream) {
    //       if (err) {
    //         done(err);
    //         return;
    //       }
    //       done();
    //     });
    //   });
    //   it('should pull the 0/0/0 generic tile for the cache', function(done) {
    //     this.timeout(0);
    //     generic.getTile('generic', 0, 0, 0, {noCache: true, projection: 4326}, function(err, stream) {
    //       //console.log('stream came back', stream);
    //       if (err) {
    //         done(err);
    //         return;
    //       }
    //       done();
    //     });
    //   });
    //   it('should generate the cache', function(done) {
    //     generic.generateCache(function(err, cache, features) {
    //       done();
    //     });
    //   });
    //   it('should pull features for the cache', function(done) {
    //     generic.getDataWithin(-180, -85, 180, 85, 4326, function(err, features) {
    //       if (err) {
    //         done(err);
    //         return;
    //       }
    //       done();
    //     });
    //   });
    // });
  });
});
