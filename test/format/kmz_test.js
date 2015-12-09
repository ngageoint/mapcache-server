var assert = require('assert')
  , FeatureModel = require('mapcache-models').Feature
  , fs = require('fs-extra')
  , turf = require('turf')
  , lengthStream = require('length-stream')
  , devnull = require('dev-null')
  , should = require('should');

var kmzSource = {
  id: 'kmz-nepal',
  name: 'nepal',
  file: {
    path:__dirname + '/nepal.kmz',
    name: 'nepal.kmz'
  },
  format: 'kmz',
  zOrder: 0
};

var map = {
  id: 'kmz-map',
  dataSources: []
};

var KMZ = require('../../format/kmz');
var kmz;

describe('KMZ', function() {
  describe('#constructor', function () {
    it('should construct an kmz with a source', function () {
      kmz = new KMZ({source: kmzSource, outputDirectory: '/tmp/kmz-test'});
    });
  });

  describe('kmz source tests', function() {
    before(function(done) {
      FeatureModel.deleteFeaturesBySourceId(kmz.source.id, function(err) {
        console.log('err is', err);
        done();
      });
    });
    after(function(done) {
      FeatureModel.deleteFeaturesBySourceId(kmz.source.id, function(err) {
        console.log('err is', err);
        done();
      });
    });
    it('should process the source', function(done) {
      this.timeout(0);
      kmz.processSource(function(err, newSource) {
        if(err) {
          return done(err);
        }
        console.log('after the source has been processed', newSource);
        console.log('XXXXXXXXXXX ----------------------', kmz.source);
        newSource.status.message.should.equal("Complete");
        FeatureModel.getAllSourceFeatures(kmz.source.id, function(err, features) {
          console.log('features', features.length);
          done();
        });
      }, function(source, callback) {
        console.log('progress', source);
        callback(null, source);
      });
    });
    it('should pull the 0/0/0 tile for the data source', function(done) {
      this.timeout(0);
      kmz.getTile('png', 8, 188, 107, {noCache: true}, function(err, stream) {
        if (err) {
          done(err);
          return;
        }
        var ws = fs.createWriteStream('/tmp/kmz_test.png');
        stream.pipe(ws);
        stream.on('end', function() {
          console.log('wrote the file to /tmp/kmz_test.png');
          done();
        });
      });
    });
    it('should pull the 0/0/0 geojson tile for the data source', function(done) {
      this.timeout(0);
      kmz.getTile('geojson', 0, 0, 0, {noCache: true}, function(err, stream) {
        if (err) {
          done(err);
          return;
        }
        var ws = fs.createWriteStream('/tmp/kmz_test.geojson');
        stream.pipe(ws);
        stream.on('end', function() {
          console.log('wrote the file to /tmp/kmz_test.geojson');
          done();
        });
      });
    });
    xit('should get all features of the source', function(done) {
      this.timeout(0);
      kmz.getDataWithin(-180, -85, 180, 85, 4326, function(err, features) {
        console.log('err', err);
        if (err) {
          done(err);
          return;
        }

        console.log("feature count", features.length);
        features.length.should.be.equal(1);
        done();
      });
    });
  });
});
