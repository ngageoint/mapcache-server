var assert = require('assert')
  , turf = require('turf')
  , lengthStream = require('length-stream')
  , devnull = require('dev-null')
  , fs = require('fs')
  , xyzTileUtils = require('xyz-tile-utils')
  , should = require('should');

// https://nga.maps.arcgis.com/sharing/rest/content/items/b49ace6aa5c942d591ea508fbf8f168f?f=json
//https://nga.maps.arcgis.com/apps/PublicInformation/index.html?appid=b49ace6aa5c942d591ea508fbf8f168f
//https://tiles1.arcgis.com/tiles/cc7nIINtrZ67dyVJ/arcgis/rest/services/SAMUEL_KANYON_DOE_ETU_Imagery/MapServer/tile/11/988/962

//http://tiles4.arcgis.com/tiles/cc7nIINtrZ67dyVJ/arcgis/rest/services/SAMUEL_KANYON_DOE_ETU_Imagery/MapServer/tile/8/123/120
var dataSource = {
  id: 'test-ds',
  name: 'ds',
  format: 'arcgis',
  //url: 'https://tiles.arcgis.com/tiles/cc7nIINtrZ67dyVJ/arcgis/rest/services/SAMUEL_KANYON_DOE_ETU_Imagery/MapServer',
   url: 'http://tiles.arcgis.com/tiles/cc7nIINtrZ67dyVJ/arcgis/rest/services/Gorkha_West_2015/MapServer',
  zOrder: 0
};

var map = {
  id: 'test-map',
  dataSources: []
};

var ArcGIS = require('../../format/arcgis');
var tmpImage = '/tmp/arcgis_test.png';

describe('arcgis', function() {
  describe('#constructor', function () {
    it('should construct an ArcGIS with a source', function () {
      var arcgis = new ArcGIS({source: {id: '5'}});
      arcgis.source.id.should.equal('5');
    });
    it('should throw an error because we cannot create an ArcGIS', function() {
      try {
        new ArcGIS({cache: {id: '6'}}).should.throw(Error);
      } catch (e) {
        console.log(e);
      }
    });
  });

  describe('ArcGIS source tests', function() {
    var generic;
    before(function() {
      arcgis = new ArcGIS({
        source: dataSource
      });
    });
    after(function() {
    });
    it('should process the source', function(done) {
      this.timeout(0);
      arcgis.processSource(function(err, newSource) {
        if(err) {
          return done(err);
        }
        should.exist(newSource.wmsGetCapabilities);
        console.log('after the source has been processed', JSON.stringify(newSource, null, 2));
        map.dataSources.push(newSource);
        done();
      }, function(source, callback) {
        console.log('progress', source);
        callback(null, source);
      });
    });
    it('should pull a tile for the data source', function(done) {

      console.log('turf extent', turf.extent(arcgis.source.geometry));
      var xyz = xyzTileUtils.getXYZFullyEncompassingExtent(turf.extent(arcgis.source.geometry));
      console.log('xyz', xyz);

      arcgis.getTile('png', xyz.z, xyz.x, xyz.y, {noCache: true}, function(err, stream) {
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
    it('should get no features', function(done) {
      arcgis.getDataWithin(-180, -85, 180, 85, 4326, function(err, features) {
        console.log('err', err);
        if (err) {
          done(err);
          return;
        }
        should.not.exist(features);
        done();
      });
    });
  });
});
