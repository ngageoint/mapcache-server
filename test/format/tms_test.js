var assert = require('assert')
  , turf = require('turf')
  , lengthStream = require('length-stream')
  , devnull = require('dev-null')
  , should = require('should');

var osmDataSource = {
  id: 'test-ds',
  name: 'osm',
  url: 'http://osm.geointapps.org/osm',
  format: 'tms',
  zOrder: 0
};

var mapboxDataSource = {
  id: 'test-mapbox-ds',
  name: 'mapbox',
  url: 'http://mapbox.geointapps.org:2999/v4/mapbox.light',
  format: 'tms',
  zOrder: 1
};

var map = {
  id: 'test-map',
  dataSources: [osmDataSource, mapboxDataSource]
};

var cache = {
  id: 'test-cache',
  name: 'osm test cache',
  geometry: turf.polygon([[
    [-180, -85],
    [-180, 85],
    [180, 85],
    [180, -85],
    [-180, -85]
  ]]),
  minZoom: 0,
  maxZoom: 2,
  formats: ['tms'],
  source: map
};

var TMS = require('../../format/tms');

describe('tms', function() {
  describe('#constructor', function () {
    it('should construct an Tms with a source', function () {
      var tms = new TMS({source: {id: '5'}});
      tms.source.id.should.equal('5');
    });
    it('should construct an Tms with a cache', function() {
      var tms = new TMS({cache: {id: '6'}});
      tms.cache.id.should.equal('6');
    })
  });

  describe('source tests', function() {
    var tms;
    before(function() {
      tms = new TMS({
        source: osmDataSource
      });
    });
    it('should process the source', function(done) {
      tms.processSource(function(err, newSource) {
        if(err) {
          return done(err);
        }
        newSource.status.message.should.equal("Complete");
        done();
      });
    });
    it('should pull the 0/0/0 tile for the data source', function(done) {
      tms.getTile('png', 0, 0, 0, {}, function(err, tileRequest) {
        if (err) {
          done(err);
          return;
        }

        tileRequest.on('response', function(response) {
          try {
            response.statusCode.should.equal(200);
            var size = response.headers['content-length'];
            size.should.be.greaterThan(0);
            response.headers['content-type'].should.equal('image/png');
            done();
          } catch (e) {
            done(e);
          }
        })
        .on('error', function(err) {
          console.log('tile request error', err);
          done(err);
        });
      });
    });
  });

  describe('cache tests', function() {
    var tms;
    before(function() {
      tms = new TMS({
        cache: cache
      });
    });
    it('should pull the 0/0/0 tile for the cache', function(done) {
      tms.getTile('png', 0, 0, 0, {}, function(err, stream) {
        if (err) {
          done(err);
          return;
        }

        var lstream = lengthStream(function(length) {
          length.should.be.greaterThan(0);
          done();
        });
        stream.pipe(lstream).pipe(devnull());

      });
    });
  });
});
