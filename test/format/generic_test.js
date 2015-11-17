var assert = require('assert')
  , FeatureModel = require('mapcache-models').Feature
  , turf = require('turf')
  , lengthStream = require('length-stream')
  , devnull = require('dev-null')
  , should = require('should');

var genericDataSource = {
  id: 'test-ds',
  name: 'generic',
  format: 'generic',
  zOrder: 0
};

var map = {
  id: 'test-map',
  dataSources: []
};

var cache = {
  id: 'test-cache',
  name: 'generic test cache',
  geometry: turf.polygon([[
    [-180, -85],
    [-180, 85],
    [180, 85],
    [180, -85],
    [-180, -85]
  ]]),
  minZoom: 0,
  maxZoom: 2,
  formats: ['xyz']
};

var Generic = require('../../format/generic');

describe('generic', function() {
  describe('#constructor', function () {
    it('should construct an generic with a source', function () {
      var generic = new Generic({source: {id: '5'}});
      generic.source.id.should.equal('5');
    });
    it('should construct an generic with a cache', function() {
      var generic = new Generic({cache: {id: '6'}});
      generic.cache.id.should.equal('6');
    });
  });

  describe('generic source tests', function() {
    var generic;
    before(function() {
      generic = new Generic({
        source: genericDataSource
      });
    });
    after(function() {
    });
    it('should process the source', function(done) {
      this.timeout(0);
      generic.processSource(function(err, newSource) {
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
      generic.getTile('png', 0, 0, 0, {noCache: true}, function(err, stream) {
        if (err) {
          done(err);
          return;
        }
        done();
      });
    });
    it('should pull the 0/0/0 geojson tile for the data source', function(done) {
      this.timeout(0);
      generic.getTile('geojson', 0, 0, 0, {noCache: true}, function(err, stream) {
        if (err) {
          done(err);
          return;
        }

        done();
      });
    });
    it('should get all features of the source', function(done) {
      this.timeout(0);
      generic.getDataWithin(-180, -85, 180, 85, 4326, function(err, features) {
        console.log('err', err);
        if (err) {
          done(err);
          return;
        }
        done();
      });
    });
    describe('generic cache tests', function() {
      var generic;
      before(function() {
        cache.source = map;
        generic = new Generic({
          cache: cache
        });
      });
      after(function() {
      });
      it('should pull the 0/0/0 tile for the cache', function(done) {
        generic.getTile('png', 0, 0, 0, {noCache: true}, function(err, stream) {
          if (err) {
            done(err);
            return;
          }
          done();
        });
      });
      it('should pull the 0/0/0 generic tile for the cache', function(done) {
        this.timeout(0);
        generic.getTile('generic', 0, 0, 0, {noCache: true, projection: 4326}, function(err, stream) {
          //console.log('stream came back', stream);
          if (err) {
            done(err);
            return;
          }
          done();
        });
      });
      it('should generate the cache', function(done) {
        generic.generateCache(function(err, cache, features) {
          done();
        });
      });
      it('should pull features for the cache', function(done) {
        generic.getDataWithin(-180, -85, 180, 85, 4326, function(err, features) {
          if (err) {
            done(err);
            return;
          }
          done();
        });
      });
    });
  });
});
