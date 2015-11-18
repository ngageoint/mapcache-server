var assert = require('assert')
  , FeatureModel = require('mapcache-models').Feature
  , turf = require('turf')
  , fs = require('fs')
  , lengthStream = require('length-stream')
  , devnull = require('dev-null')
  , should = require('should');

var wmsDataSource = {
  id: 'test-ds',
  name: 'wms',
  format: 'wms',
  url: 'http://gis.srh.noaa.gov/arcgis/services/QPF/MapServer/WMSServer',
  zOrder: 0
};

var map = {
  id: 'test-map',
  dataSources: []
};

var cache = {
  id: 'test-cache',
  name: 'wms test cache',
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

var WMS = require('../../format/wms');
var tmpImage = '/tmp/wms_test.png';


describe('WMS', function() {
  describe('#constructor', function () {
    it('should construct an WMS with a source', function () {
      var wms = new WMS({source: {id: '5'}});
      wms.source.id.should.equal('5');
    });
    it('should construct throw and exception since we cannot make a WMS cache', function() {
      try {
        new WMS({cache: {id: '6'}}).should.throw(Error);
      } catch (e) {
        console.log(e);
      }
    });
  });

  describe('wms source tests', function() {
    var wms;
    before(function() {
      wms = new WMS({
        source: wmsDataSource
      });
    });
    after(function() {
    });
    it('should process the source', function(done) {
      wms.processSource(function(err, newSource) {
        if(err) {
          return done(err);
        }
        // console.log('after the source has been processed', JSON.stringify(newSource, null, 2));
        should.exist(newSource.wmsGetCapabilities);
        // console.log('layer', JSON.stringify(newSource.wmsGetCapabilities.Capability.Layer, null, 2));
        wms.setSourceLayer(newSource.wmsGetCapabilities.Capability.Layer.Layer[0], function(err, source) {
          map.dataSources.push(source);
          done();
        });
      }, function(source, callback) {
        console.log('progress', source);
        callback(null, source);
      });
    });
    it('should pull the 0/0/0 tile for the data source', function(done) {
      wms.getTile('png', 0, 0, 0, {noCache: true}, function(err, stream) {
        if (err) {
          done(err);
          return;
        }
        should.exist(stream);
        var ws = fs.createWriteStream(tmpImage);
        stream.pipe(ws);
        stream.on('end', function() {
          done();
          // var imageDiff = require('image-diff');
          // imageDiff({
          //   actualImage: tmpImage,
          //   expectedImage: __dirname + '/geotifftile.png',
          //   diffImage: '/tmp/difference.png',
          // }, function (err, imagesAreSame) {
          //   should.not.exist(err);
          //   imagesAreSame.should.be.true();
          //   done();
          // });
        });
      });
    });
    it('should pull the 0/0/0 geojson tile for the data source', function(done) {
      this.timeout(0);
      wms.getTile('geojson', 0, 0, 0, {noCache: true}, function(err, stream) {
        if (err) {
          done(err);
          return;
        }

        done();
      });
    });
    it('should get all features of the source', function(done) {
      this.timeout(0);
      wms.getDataWithin(-180, -85, 180, 85, 4326, function(err, features) {
        console.log('err', err);
        if (err) {
          done(err);
          return;
        }
        done();
      });
    });
  });
});
